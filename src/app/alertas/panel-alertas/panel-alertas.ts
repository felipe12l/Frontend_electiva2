import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertasService } from '../alertas';

import { PacientesService } from '../../pacientes/pacientes'; 
import { DispositivosService } from '../../dispositivos/dispositivos';
import { TiposAlertaService } from '../../tipos-alerta/tipos-alerta';

@Component({
  selector: 'app-panel-alertas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-alertas.html',
  styleUrl: './panel-alertas.css'
})
export class PanelAlertasComponent implements OnInit {
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

  constructor(
    private alertasService: AlertasService,
    private pacientesService: PacientesService,
    private dispositivosService: DispositivosService,
    private tiposAlertaService: TiposAlertaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarAlertas();
    this.cargarListasDesplegables();
  }

  cargarListasDesplegables() {
    this.pacientesService.getPacientes().subscribe(data => {
      this.listaPacientes = data;
      this.cdr.detectChanges();
    });
    
    this.dispositivosService.getDispositivos().subscribe(data => {
      this.listaDispositivos = data.filter(d => d.isActive); 
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

  eliminarAlerta(id: string) {
    if (confirm('¿Eliminar este registro de emergencia del historial?')) {
      this.errorMsg = '';
      this.mensajeExito = '';
      this.alertasService.eliminarAlerta(id).subscribe({
        next: () => {
          this.mensajeExito = 'Registro de alerta eliminado.';
          this.cargarAlertas();
          setTimeout(() => { this.mensajeExito = ''; this.cdr.detectChanges(); }, 3000);
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
    this.cargarAlertas();
    setTimeout(() => { this.mensajeExito = ''; this.cdr.detectChanges(); }, 3000);
  }

  private manejarError(err: any) {
    this.guardando = false;
    this.errorMsg = err.error?.error || 'Error de conexión.';
    this.cdr.detectChanges();
  }
}