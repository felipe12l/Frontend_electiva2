import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PacientesService } from '../pacientes';
import { HabitacionesService } from '../../habitaciones/habitaciones'; 
import { DispositivosService } from '../../dispositivos/dispositivos';

@Component({
  selector: 'app-crear-pacientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-paciente.html',
  styleUrl: './crear-paciente.css'
})
export class CrearPacientesComponent implements OnInit {

  paciente = {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    RoomId: '',
    emergencyContact: { firstName: '', lastName: '', phone: '', mail: '', relationship: '' },
    Allergies: [] as any[],
    Diseases: [] as any[],
    wearableDevices: [] as any[]
  };

  listaHabitaciones: any[] = [];
  listaDispositivos: any[] = [];

  cargando = false;
  errorMsg = '';
  mensajeExito = '';

  esEdicion = false;
  pacienteId: string | null = null;

  constructor(
    private pacientesService: PacientesService,
    private habitacionesService: HabitacionesService,
    private dispositivosService: DispositivosService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.pacienteId = this.route.snapshot.paramMap.get('id');
    this.cargarListasDesplegables();

    if (this.pacienteId) {
      this.esEdicion = true;
      this.cargarDatosPaciente();
    }
  }

  cargarListasDesplegables() {
    this.habitacionesService.getHabitaciones().subscribe(data => {
      this.listaHabitaciones = data;
      this.cdr.detectChanges();
    });

    this.dispositivosService.getDispositivos().subscribe(data => {
      this.listaDispositivos = data.filter(d => d.isActive);
      this.cdr.detectChanges();
    });
  }

  cargarDatosPaciente() {
    this.cargando = true;
    this.pacientesService.getPaciente(this.pacienteId!).subscribe({
      next: (data) => {
        this.paciente.firstName = data.firstName;
        this.paciente.lastName = data.lastName;

        if (data.dateOfBirth) {
          this.paciente.dateOfBirth = data.dateOfBirth.split('T')[0];
        }

        if (data.Room && data.Room.idRoom) {
          this.paciente.RoomId = data.Room.idRoom;
        }

        if (data.emergencyContact) {
          this.paciente.emergencyContact = data.emergencyContact;
        }
        this.paciente.Allergies = data.Allergies || [];
        this.paciente.Diseases = data.Diseases || [];
        this.paciente.wearableDevices = data.wearableDevices || [];

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = 'Error al cargar los datos del paciente.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  agregarAlergia() {
    this.paciente.Allergies.push({ name: '', allergenType: '', diagnostics: '' });
  }

  removerAlergia(index: number) {
    this.paciente.Allergies.splice(index, 1);
  }

  agregarEnfermedad() {
    this.paciente.Diseases.push({ name: '', diagnostics: '', isContagious: false, transmissionRoute: '' });
  }

  removerEnfermedad(index: number) {
    this.paciente.Diseases.splice(index, 1);
  }

  agregarWearable() {
    this.paciente.wearableDevices.push({ wearableId: '' });
  }

  removerWearable(index: number) {
    this.paciente.wearableDevices.splice(index, 1);
  }

  guardarPaciente() {
    this.cargando = true;
    this.errorMsg = '';
    this.mensajeExito = '';

    let payload: any = { ...this.paciente };

    if (payload.dateOfBirth) {
      payload.dateOfBirth = new Date(payload.dateOfBirth).toISOString();
    } else {
      delete payload.dateOfBirth;
    }

    if (!payload.RoomId) {
      delete payload.RoomId;
    }

    if (this.esEdicion) {
      this.pacientesService.actualizarPaciente(this.pacienteId!, payload).subscribe({
        next: (res) => {
          this.mensajeExito = 'Paciente actualizado exitosamente.';
          this.cdr.detectChanges();
          setTimeout(() => this.router.navigate(['/pacientes']), 1500);
        },
        error: (err) => this.manejarError(err)
      });
    } else {
      this.pacientesService.crearPaciente(payload).subscribe({
        next: (res) => {
          this.mensajeExito = 'Paciente registrado exitosamente.';
          this.cdr.detectChanges();
          setTimeout(() => this.router.navigate(['/pacientes']), 1500);
        },
        error: (err) => this.manejarError(err)
      });
    }
  }

  private manejarError(err: any) {
    this.cargando = false;
    this.errorMsg = err.error?.error || 'Error de conexión o permisos insuficientes.';
    this.cdr.detectChanges();
  }

  cancelar() {
    this.router.navigate(['/pacientes']);
  }
}