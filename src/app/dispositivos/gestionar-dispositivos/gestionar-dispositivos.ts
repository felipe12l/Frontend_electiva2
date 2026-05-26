import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DispositivosService } from '../dispositivos';
import { WebsocketService } from '../../services/websocket.service';
import { ConfirmModalService } from '../../services/confirm-modal.service';

@Component({
  selector: 'app-gestionar-dispositivos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestionar-dispositivos.html',
  styleUrl: './gestionar-dispositivos.css'
})
export class GestionarDispositivosComponent implements OnInit, OnDestroy {
  dispositivos: any[] = [];
  
  nuevoDispositivo = {
    macAddress: '',
    batteryLevel: 100, 
    isActive: true 
  };

  dispositivoEnEdicionId: string | null = null; 

  cargando = true;
  guardando = false;
  errorMsg = '';
  mensajeExito = '';

  // WebSocket
  wsConectado = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private dispositivosService: DispositivosService,
    private wsService: WebsocketService,
    private cdr: ChangeDetectorRef,
    private confirmService: ConfirmModalService
  ) {}

  ngOnInit() {
    this.cargarDispositivos();
    this.suscribirWebSocket();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  // ============================================================
  // SUSCRIPCIONES WEBSOCKET — BATERÍA Y ESTADO EN TIEMPO REAL
  // ============================================================

  private suscribirWebSocket() {
    this.wsConectado = this.wsService.connected;
    this.subscriptions.push(
      this.wsService.onConnectionChange().subscribe(connected => {
        this.wsConectado = connected;
        this.cdr.detectChanges();
      })
    );

    // Actualización de batería en tiempo real
    this.subscriptions.push(
      this.wsService.onBatteryUpdate().subscribe(event => {
        const disp = this.dispositivos.find(d => d.wearableId === event.wearableId);
        if (disp) {
          disp.batteryLevel = event.batteryLevel;
          disp.batteryVoltage = event.batteryVoltage;
          disp.isCharging = event.isCharging;
          disp._lastBatteryUpdate = new Date();
          this.cdr.detectChanges();
        }
      })
    );

    // Estado del dispositivo (online/offline)
    this.subscriptions.push(
      this.wsService.onDeviceStatus().subscribe(event => {
        const disp = this.dispositivos.find(d => d.wearableId === event.wearableId);
        if (disp) {
          disp.isActive = event.isActive;
          disp._lastStatusUpdate = new Date();
          this.cdr.detectChanges();
        }
      })
    );
  }

  // ============================================================
  // HELPERS DE UI
  // ============================================================

  getBatteryIcon(level: number, isCharging: boolean = false): string {
    if (isCharging) return '⚡';
    if (level > 75) return '🔋';
    if (level > 50) return '🔋';
    if (level > 20) return '🪫';
    return '⚠️';
  }

  getBatteryColor(level: number, isCharging: boolean = false): string {
    if (isCharging) return '#10b981';
    if (level > 50) return '#10b981';
    if (level > 20) return '#f59e0b';
    return '#ef4444';
  }

  getBatteryBarWidth(level: number): string {
    return Math.max(level, 5) + '%';
  }

  // ============================================================
  // CRUD ORIGINAL
  // ============================================================

  cargarDispositivos() {
    this.cargando = true;
    this.dispositivosService.getDispositivos().subscribe({
      next: (data) => {
        this.dispositivos = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = 'Error al cargar los dispositivos.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  guardarDispositivo() {
    this.guardando = true;
    this.errorMsg = '';
    this.mensajeExito = '';

    const payload = {
      ...this.nuevoDispositivo,
      batteryLevel: Number(this.nuevoDispositivo.batteryLevel),
      isActive: String(this.nuevoDispositivo.isActive) === 'true'
    };

    if (this.dispositivoEnEdicionId) {
      this.dispositivosService.actualizarDispositivo(this.dispositivoEnEdicionId, payload).subscribe({
        next: () => this.manejarExito('¡Dispositivo actualizado exitosamente!'),
        error: (err) => this.manejarError(err)
      });
    } else {
      this.dispositivosService.crearDispositivo(payload).subscribe({
        next: () => this.manejarExito('¡Dispositivo registrado exitosamente!'),
        error: (err) => this.manejarError(err)
      });
    }
  }

  editarDispositivo(disp: any) {
    this.dispositivoEnEdicionId = disp.wearableId;
    this.nuevoDispositivo = {
      macAddress: disp.macAddress,
      batteryLevel: disp.batteryLevel,
      isActive: disp.isActive
    };
    this.errorMsg = '';
    this.mensajeExito = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarEdicion() {
    this.dispositivoEnEdicionId = null;
    this.nuevoDispositivo = { macAddress: '', batteryLevel: 100, isActive: true };
    this.errorMsg = '';
  }

  async eliminarDispositivo(id: string) {
    const confirmed = await this.confirmService.confirm(
      'Eliminar Dispositivo',
      '¿Está seguro de que desea eliminar este dispositivo IoT de forma permanente?'
    );
    if (confirmed) {
      this.errorMsg = '';
      this.mensajeExito = '';
      this.dispositivosService.eliminarDispositivo(id).subscribe({
        next: () => {
          this.mensajeExito = 'Dispositivo eliminado correctamente.';
          this.cargarDispositivos();
          setTimeout(() => { this.mensajeExito = ''; this.cdr.detectChanges(); }, 3000);
        },
        error: (err) => {
          this.errorMsg = err.error?.error || 'Error al eliminar el dispositivo.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  private manejarExito(mensaje: string) {
    this.guardando = false;
    this.mensajeExito = mensaje;
    this.cancelarEdicion();
    this.cargarDispositivos();
    setTimeout(() => { this.mensajeExito = ''; this.cdr.detectChanges(); }, 3000);
  }

  private manejarError(err: any) {
    this.guardando = false;
    this.errorMsg = err.error?.error || 'Error de conexión.';
    this.cdr.detectChanges();
  }
}