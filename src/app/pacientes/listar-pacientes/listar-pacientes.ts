import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PacientesService } from '../pacientes';
import { RouterModule } from '@angular/router';
import { ConfirmModalService } from '../../services/confirm-modal.service';

@Component({
  selector: 'app-listar-pacientes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './listar-pacientes.html',
  styleUrl: './listar-pacientes.css'
})
export class ListarPacientesComponent implements OnInit {
  pacientes: any[] = [];
  cargando: boolean = true;
  errorMsg = '';
  mensajeExito = '';

  constructor(
    private pacientesService: PacientesService,
    private cdr: ChangeDetectorRef,
    private confirmService: ConfirmModalService
  ) { }

  ngOnInit(): void {
    this.cargarPacientes();
  }

  cargarPacientes() {
    this.cargando = true;
    this.pacientesService.getPacientes().subscribe({
      next: (data) => {
        this.pacientes = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = 'Error al cargar pacientes.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  async eliminarPaciente(id: string) {
    const confirmed = await this.confirmService.confirm(
      'Eliminar Paciente',
      '¿Está seguro de que desea eliminar este paciente y todos sus datos relacionados?'
    );
    if (confirmed) {
      this.errorMsg = '';
      this.mensajeExito = '';
      this.pacientesService.eliminarPaciente(id).subscribe({
        next: () => {
          this.mensajeExito = 'Paciente eliminado correctamente.';
          this.cargarPacientes();
          setTimeout(() => { this.mensajeExito = ''; this.cdr.detectChanges(); }, 3000);
        },
        error: (err) => {
          this.errorMsg = err.error?.error || 'Error al eliminar el paciente.';
          this.cdr.detectChanges();
        }
      });
    }
  }
}