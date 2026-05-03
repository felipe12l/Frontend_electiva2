import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HabitacionesService } from '../habitaciones';

@Component({
  selector: 'app-gestionar-habitaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestionar-habitaciones.html',
  styleUrl: './gestionar-habitaciones.css'
})
export class GestionarHabitacionesComponent implements OnInit {
  habitaciones: any[] = [];

  nuevaHabitacion = {
    floor: null as any,
    roomNumber: '',
    roomPavilion: ''
  };

  habitacionEnEdicionId: string | null = null;

  cargando = true;
  guardando = false;
  errorMsg = '';
  mensajeExito = '';

  constructor(
    private habitacionesService: HabitacionesService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.cargarHabitaciones();
  }

  cargarHabitaciones() {
    this.cargando = true;
    this.habitacionesService.getHabitaciones().subscribe({
      next: (data) => {
        this.habitaciones = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error', err);
        this.cargando = false;
        this.errorMsg = 'No se pudo cargar la lista de habitaciones.';
        this.cdr.detectChanges();
      }
    });
  }

  guardarHabitacion() {
    this.guardando = true;
    this.errorMsg = '';
    this.mensajeExito = '';

    const payload = {
      ...this.nuevaHabitacion,
      floor: this.nuevaHabitacion.floor ? Number(this.nuevaHabitacion.floor) : 0
    };

    if (this.habitacionEnEdicionId) {
      this.habitacionesService.actualizarHabitacion(this.habitacionEnEdicionId, payload).subscribe({
        next: () => this.manejarExito('¡Habitación actualizada exitosamente!'),
        error: (err) => this.manejarError(err)
      });
    } else {
      this.habitacionesService.crearHabitacion(payload).subscribe({
        next: () => this.manejarExito('¡Habitación creada exitosamente!'),
        error: (err) => this.manejarError(err)
      });
    }
  }

  editarHabitacion(hab: any) {
    this.habitacionEnEdicionId = hab.roomId;
    this.nuevaHabitacion = {
      floor: hab.floor,
      roomNumber: hab.roomNumber,
      roomPavilion: hab.roomPavilion
    };
    this.errorMsg = '';
    this.mensajeExito = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarEdicion() {
    this.habitacionEnEdicionId = null;
    this.nuevaHabitacion = { floor: null as any, roomNumber: '', roomPavilion: '' };
    this.errorMsg = '';
  }

  eliminarHabitacion(id: string) {
    if (confirm('¿Estás seguro de que deseas eliminar esta habitación?')) {
      this.errorMsg = '';
      this.mensajeExito = '';
      this.habitacionesService.eliminarHabitacion(id).subscribe({
        next: () => {
          this.mensajeExito = 'Habitación eliminada correctamente.';
          this.cargarHabitaciones();
          setTimeout(() => { this.mensajeExito = ''; this.cdr.detectChanges(); }, 3000);
        },
        error: (err) => {
          this.errorMsg = err.error?.error || 'Error al eliminar la habitación.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  private manejarExito(mensaje: string) {
    this.guardando = false;
    this.mensajeExito = mensaje;
    this.cancelarEdicion();
    this.cargarHabitaciones();
    setTimeout(() => { this.mensajeExito = ''; this.cdr.detectChanges(); }, 3000);
  }

  private manejarError(err: any) {
    this.guardando = false;
    this.errorMsg = err.error?.error || 'Error de conexión.';
    this.cdr.detectChanges();
  }
}