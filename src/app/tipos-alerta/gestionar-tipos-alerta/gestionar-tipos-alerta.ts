import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TiposAlertaService } from '../tipos-alerta'; 

@Component({
  selector: 'app-gestionar-tipos-alerta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestionar-tipos-alerta.html',
  styleUrl: './gestionar-tipos-alerta.css'
})
export class GestionarTiposAlertaComponent implements OnInit {
  tiposAlerta: any[] = [];
  
  nuevoTipo = {
    code: '',
    name: '',
    description: ''
  };

  tipoEnEdicionId: string | null = null; 

  cargando = true;
  guardando = false;
  errorMsg = '';
  mensajeExito = '';

  constructor(
    private tiposAlertaService: TiposAlertaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarTipos();
  }

  cargarTipos() {
    this.cargando = true;
    this.tiposAlertaService.getTiposAlerta().subscribe({
      next: (data) => {
        this.tiposAlerta = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = 'Error al cargar el catálogo de alertas.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  guardarTipo() {
    this.guardando = true;
    this.errorMsg = '';
    this.mensajeExito = '';

    if (this.tipoEnEdicionId) {
      this.tiposAlertaService.actualizarTipoAlerta(this.tipoEnEdicionId, this.nuevoTipo).subscribe({
        next: () => this.manejarExito('¡Tipo de alerta actualizado!'),
        error: (err) => this.manejarError(err)
      });
    } else {
      this.tiposAlertaService.crearTipoAlerta(this.nuevoTipo).subscribe({
        next: () => this.manejarExito('¡Tipo de alerta registrado!'),
        error: (err) => this.manejarError(err)
      });
    }
  }

  editarTipo(tipo: any) {
    this.tipoEnEdicionId = tipo.alertTypeId;
    this.nuevoTipo = {
      code: tipo.code,
      name: tipo.name,
      description: tipo.description
    };
    this.errorMsg = '';
    this.mensajeExito = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarEdicion() {
    this.tipoEnEdicionId = null;
    this.nuevoTipo = { code: '', name: '', description: '' };
    this.errorMsg = '';
  }

  eliminarTipo(id: string) {
    if (confirm('¿Eliminar este tipo de alerta del catálogo?')) {
      this.errorMsg = '';
      this.mensajeExito = '';
      this.tiposAlertaService.eliminarTipoAlerta(id).subscribe({
        next: () => {
          this.mensajeExito = 'Tipo de alerta eliminado.';
          this.cargarTipos();
          setTimeout(() => { this.mensajeExito = ''; this.cdr.detectChanges(); }, 3000);
        },
        error: (err) => {
          // Si el tipo de alerta ya está siendo usado por una emergencia real, Python lo bloquea aquí[cite: 23]
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
    this.cargarTipos();
    setTimeout(() => { this.mensajeExito = ''; this.cdr.detectChanges(); }, 3000);
  }

  private manejarError(err: any) {
    this.guardando = false;
    this.errorMsg = err.error?.error || 'Error de conexión.';
    this.cdr.detectChanges();
  }
}