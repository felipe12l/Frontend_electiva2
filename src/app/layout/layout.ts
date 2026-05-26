import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { environment } from '../../../src/environments/environment';
import { ConfirmModalService, ConfirmData } from '../services/confirm-modal.service';
import { WebsocketService, AlertEvent } from '../services/websocket.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class LayoutComponent implements OnInit, OnDestroy {
  theme = environment.theme;
  activeConfirm: ConfirmData | null = null;
  alertaNueva: AlertEvent | null = null; // Toast global
  
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private confirmService: ConfirmModalService,
    private wsService: WebsocketService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    document.documentElement.style.setProperty('--primary-color', this.theme.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', this.theme.secondaryColor);
    document.documentElement.style.setProperty('--background-color', this.theme.background);

    // Suscripción al confirm modal
    this.subscriptions.push(
      this.confirmService.confirm$.subscribe(data => {
        this.activeConfirm = data;
        this.cdr.detectChanges();
      })
    );

    // Suscripción a nuevas alertas de WebSocket (Global)
    this.subscriptions.push(
      this.wsService.onNewAlert().subscribe(alert => {
        this.mostrarNotificacion(alert);
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  confirm(value: boolean) {
    if (this.activeConfirm) {
      this.activeConfirm.resolve(value);
    }
  }

  // Notificación Toast global
  private mostrarNotificacion(alert: AlertEvent) {
    this.alertaNueva = alert;

    // Reproducir sonido para niveles altos, críticos o de emergencia
    const levelLower = (alert.alertLevel || '').toLowerCase();
    if (levelLower.includes('alto') || levelLower.includes('crit') || levelLower.includes('crít')) {
      this.reproducirSonidoAlerta();
    }

    // Auto-ocultar toast después de 8 segundos
    setTimeout(() => {
      this.alertaNueva = null;
      this.cdr.detectChanges();
    }, 8000);
  }

  cerrarNotificacion() {
    this.alertaNueva = null;
    this.cdr.detectChanges();
  }

  private reproducirSonidoAlerta() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = 880; // Nota A5
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      
      // Tres beeps cortos
      setTimeout(() => { gainNode.gain.value = 0; }, 150);
      setTimeout(() => { gainNode.gain.value = 0.3; }, 250);
      setTimeout(() => { gainNode.gain.value = 0; }, 400);
      setTimeout(() => { gainNode.gain.value = 0.3; }, 500);
      setTimeout(() => { gainNode.gain.value = 0; }, 650);
      setTimeout(() => { oscillator.stop(); ctx.close(); }, 700);
    } catch (e) {
      // AudioContext no soportado
    }
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}