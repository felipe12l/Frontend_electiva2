import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DispositivosService } from '../dispositivos';

@Component({
  selector: 'app-gestionar-dispositivos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestionar-dispositivos.html',
  styleUrl: './gestionar-dispositivos.css'
})
export class GestionarDispositivosComponent implements OnInit {
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

  constructor(
    private dispositivosService: DispositivosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarDispositivos();
  }

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

  eliminarDispositivo(id: string) {
    if (confirm('¿Estás seguro de que deseas eliminar este dispositivo?')) {
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