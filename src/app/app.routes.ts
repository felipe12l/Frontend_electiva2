import { Routes } from '@angular/router';
import { Autenticacion } from './autenticacion/autenticacion';
import { LayoutComponent } from './layout/layout';
import { authGuard } from './autenticacion/interceptor/auth-guard';
import { ListarPacientesComponent } from './pacientes/listar-pacientes/listar-pacientes';
import { CrearPacientesComponent } from './pacientes/crear-paciente/crear-paciente';
import { GestionarHabitacionesComponent } from './habitaciones/gestionar-habitaciones/gestionar-habitaciones';
import { GestionarDispositivosComponent } from './dispositivos/gestionar-dispositivos/gestionar-dispositivos';
import { GestionarTiposAlertaComponent } from './tipos-alerta/gestionar-tipos-alerta/gestionar-tipos-alerta';
import { PanelAlertasComponent } from './alertas/panel-alertas/panel-alertas';

export const routes: Routes = [
    { path: 'login', component: Autenticacion },

    {
        path: '',
        component: LayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: 'pacientes', component: ListarPacientesComponent },
            { path: 'crear-paciente', component: CrearPacientesComponent },
            { path: 'editar-paciente/:id', component: CrearPacientesComponent },
            { path: 'habitaciones', component: GestionarHabitacionesComponent },
            { path: 'dispositivos', component: GestionarDispositivosComponent },
            { path: 'tipos-alerta', component: GestionarTiposAlertaComponent },
            { path: 'alertas', component: PanelAlertasComponent },
            { path: '', redirectTo: 'pacientes', pathMatch: 'full' }
        ]
    },
    { path: '**', redirectTo: 'login' }
];