import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AlertasService } from '../alertas';

import { PacientesService } from '../../pacientes/pacientes'; 
import { DispositivosService } from '../../dispositivos/dispositivos';
import { TiposAlertaService } from '../../tipos-alerta/tipos-alerta';
import { WebsocketService, AlertEvent } from '../../services/websocket.service';
import { ConfirmModalService } from '../../services/confirm-modal.service';

@Component({
  selector: 'app-panel-alertas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-alertas.html',
  styleUrl: './panel-alertas.css'
})
export class PanelAlertasComponent implements OnInit, OnDestroy {
  alertas: any[] = [];
  
  listaPacientes: any[] = [];
  listaDispositivos: any[] = [];
  listaTiposAlerta: any[] = [];
  
  nuevaAlerta = {
    patientId: '',
    wearableId: '',
    alertType: '',
    alertLevel: 'Medio',
    alertStatus: 'Activa'
  };

  alertaEnEdicionId: string | null = null; 

  cargando = true;
  guardando = false;
  errorMsg = '';
  mensajeExito = '';

  // WebSocket: Estado de conexión y notificaciones
  wsConectado = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private alertasService: AlertasService,
    private pacientesService: PacientesService,
    private dispositivosService: DispositivosService,
    private tiposAlertaService: TiposAlertaService,
    private wsService: WebsocketService,
    private cdr: ChangeDetectorRef,
    private confirmService: ConfirmModalService
  ) {}

  ngOnInit() {
    this.cargarAlertas();
    this.cargarListasDesplegables();
    this.suscribirWebSocket();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  // ============================================================
  // SUSCRIPCIONES WEBSOCKET — TIEMPO REAL
  // ============================================================

  private suscribirWebSocket() {
    // Estado de conexión
    this.wsConectado = this.wsService.connected;
    this.subscriptions.push(
      this.wsService.onConnectionChange().subscribe(connected => {
        this.wsConectado = connected;
        this.cdr.detectChanges();
      })
    );

    // Nueva alerta (desde wearable o desde otro usuario creándola manualmente)
    this.subscriptions.push(
      this.wsService.onNewAlert().subscribe(alert => {
        // Verificar que no existe ya en la lista (evitar duplicados)
        const existe = this.alertas.find(a => a.alertId === alert.alertId);
        if (!existe) {
          this.alertas.unshift({
            alertId: alert.alertId,
            patientId: alert.patientId,
            wearableId: alert.wearableId,
            alertType: alert.alertType,
            alertLevel: alert.alertLevel,
            alertStatus: alert.alertStatus,
            createdAt: alert.createdAt,
            resolvedAt: alert.resolvedAt,
            bpm: alert.bpm,
            alertCode: alert.alertCode
          });
        }
        this.cdr.detectChanges();
      })
    );

    // Alerta actualizada (estado cambiado por otro usuario)
    this.subscriptions.push(
      this.wsService.onAlertUpdated().subscribe(alert => {
        const idx = this.alertas.findIndex(a => a.alertId === alert.alertId);
        if (idx !== -1) {
          this.alertas[idx] = {
            ...this.alertas[idx],
            alertStatus: alert.alertStatus,
            alertLevel: alert.alertLevel,
            resolvedAt: alert.resolvedAt
          };
        }
        this.cdr.detectChanges();
      })
    );

    // Alerta eliminada
    this.subscriptions.push(
      this.wsService.onAlertDeleted().subscribe(data => {
        this.alertas = this.alertas.filter(a => a.alertId !== data.alertId);
        this.cdr.detectChanges();
      })
    );

    // Actualización de batería en tiempo real
    this.subscriptions.push(
      this.wsService.onBatteryUpdate().subscribe(event => {
        const disp = this.listaDispositivos.find(d => d.wearableId === event.wearableId);
        if (disp) {
          disp.batteryLevel = event.batteryLevel;
          disp.batteryVoltage = event.batteryVoltage;
          disp.isCharging = event.isCharging;
          this.cdr.detectChanges();
        }
      })
    );
  }



  // ============================================================
  // ACCIONES RÁPIDAS — ATENDER Y RESOLVER
  // ============================================================

  atenderAlerta(alerta: any) {
    const payload = {
      alertStatus: 'En Revisión',
      alertLevel: alerta.alertLevel
    };

    this.alertasService.actualizarAlerta(alerta.alertId, payload).subscribe({
      next: () => {
        // La actualización llegará por WebSocket, pero actualizamos localmente también
        alerta.alertStatus = 'En Revisión';
        this.mensajeExito = 'Alerta marcada como "En Revisión"';
        setTimeout(() => { this.mensajeExito = ''; this.cdr.detectChanges(); }, 3000);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err.error?.error || 'Error al atender la alerta.';
        this.cdr.detectChanges();
      }
    });
  }

  resolverAlerta(alerta: any) {
    const payload = {
      alertStatus: 'Resuelta',
      alertLevel: alerta.alertLevel,
      resolvedAt: new Date().toISOString()
    };

    this.alertasService.actualizarAlerta(alerta.alertId, payload).subscribe({
      next: () => {
        alerta.alertStatus = 'Resuelta';
        alerta.resolvedAt = new Date().toISOString();
        this.mensajeExito = 'Alerta resuelta exitosamente';
        setTimeout(() => { this.mensajeExito = ''; this.cdr.detectChanges(); }, 3000);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err.error?.error || 'Error al resolver la alerta.';
        this.cdr.detectChanges();
      }
    });
  }

  // ============================================================
  // LÓGICA ORIGINAL (con pequeños ajustes)
  // ============================================================

  cargarListasDesplegables() {
    this.pacientesService.getPacientes().subscribe(data => {
      this.listaPacientes = data;
      this.cdr.detectChanges();
    });
    
    this.dispositivosService.getDispositivos().subscribe(data => {
      this.listaDispositivos = data; // Cargar todos para poder ver la batería de cualquiera
      this.cdr.detectChanges();
    });

    this.tiposAlertaService.getTiposAlerta().subscribe(data => {
      this.listaTiposAlerta = data;
      this.cdr.detectChanges();
    });
  }

  cargarAlertas() {
    this.cargando = true;
    this.alertasService.getAlertas().subscribe({
      next: (data) => {
        this.alertas = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = 'Error al cargar las emergencias.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  getNombrePaciente(id: string): string {
    const p = this.listaPacientes.find(x => x.patientId === id);
    return p ? `${p.firstName} ${p.lastName}` : 'Cargando paciente...';
  }

  getMacDispositivo(id: string): string {
    const d = this.listaDispositivos.find(x => x.wearableId === id);
    return d ? d.macAddress : 'Cargando MAC...';
  }

  getNombreAlerta(id: string): string {
    const t = this.listaTiposAlerta.find(x => x.alertTypeId === id);
    return t ? t.name : 'Alerta Desconocida';
  }

  getDispositivo(id: string): any {
    return this.listaDispositivos.find(x => x.wearableId === id);
  }

  getBatteryColor(level: number, isCharging: boolean = false): string {
    if (isCharging) return '#10b981';
    if (level > 50) return '#10b981';
    if (level > 20) return '#f59e0b';
    return '#ef4444';
  }

  get listaDispositivosActivos(): any[] {
    return this.listaDispositivos.filter(d => d.isActive);
  }

  onPacienteChange() {
    const pacienteSeleccionado = this.listaPacientes.find(p => p.patientId === this.nuevaAlerta.patientId);
    
    if (pacienteSeleccionado && pacienteSeleccionado.wearableDevices && pacienteSeleccionado.wearableDevices.length > 0) {
      this.nuevaAlerta.wearableId = pacienteSeleccionado.wearableDevices[0].wearableId;
    } else {
      this.nuevaAlerta.wearableId = ''; 
    }
  }

  guardarAlerta() {
    this.guardando = true;
    this.errorMsg = '';
    this.mensajeExito = '';

    const payload: any = { ...this.nuevaAlerta };

    if (this.alertaEnEdicionId) {
        if (payload.alertStatus === 'Resuelta') {
            payload.resolvedAt = new Date().toISOString();
        }

      this.alertasService.actualizarAlerta(this.alertaEnEdicionId, payload).subscribe({
        next: () => this.manejarExito('¡Alerta actualizada!'),
        error: (err) => this.manejarError(err)
      });
    } else {
      this.alertasService.crearAlerta(payload).subscribe({
        next: () => this.manejarExito('¡Emergencia registrada!'),
        error: (err) => this.manejarError(err)
      });
    }
  }

  editarAlerta(alerta: any) {
    this.alertaEnEdicionId = alerta.alertId;
    this.nuevaAlerta = {
      patientId: alerta.patientId,
      wearableId: alerta.wearableId,
      alertType: alerta.alertType,
      alertLevel: alerta.alertLevel,
      alertStatus: alerta.alertStatus
    };
    this.errorMsg = '';
    this.mensajeExito = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarEdicion() {
    this.alertaEnEdicionId = null;
    this.nuevaAlerta = { patientId: '', wearableId: '', alertType: '', alertLevel: 'Medio', alertStatus: 'Activa' };
    this.errorMsg = '';
  }

  async eliminarAlerta(id: string) {
    const confirmed = await this.confirmService.confirm(
      'Eliminar Emergencia',
      '¿Está seguro de que desea eliminar este registro de emergencia del historial?'
    );
    if (confirmed) {
      this.errorMsg = '';
      this.mensajeExito = '';
      this.alertasService.eliminarAlerta(id).subscribe({
        next: () => {
          this.mensajeExito = 'Registro de alerta eliminado.';
          // No recargamos: la eliminación llegará por WebSocket
          this.alertas = this.alertas.filter(a => a.alertId !== id);
          setTimeout(() => { this.mensajeExito = ''; this.cdr.detectChanges(); }, 3000);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMsg = err.error?.error || 'Error al eliminar.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  private manejarExito(mensaje: string) {
    this.guardando = false;
    this.mensajeExito = mensaje;
    this.cancelarEdicion();
    // No necesitamos recargar alertas: llegará por WebSocket
    this.cargarAlertas();
    setTimeout(() => { this.mensajeExito = ''; this.cdr.detectChanges(); }, 3000);
  }

  private manejarError(err: any) {
    this.guardando = false;
    this.errorMsg = err.error?.error || 'Error de conexión.';
    this.cdr.detectChanges();
  }

  // Helper para contar alertas activas
  get alertasActivas(): number {
    return this.alertas.filter(a => a.alertStatus === 'Activa').length;
  }

  get alertasEnRevision(): number {
    return this.alertas.filter(a => a.alertStatus === 'En Revisión').length;
  }
}