import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Subject, Observable, filter, map } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Evento WebSocket recibido del backend
 */
export interface WSEvent {
  type: string;
  payload: any;
}

/**
 * Evento de alerta recibido en tiempo real
 */
export interface AlertEvent {
  alertId: string;
  patientId: string;
  wearableId: string;
  alertType: string;
  alertLevel: string;
  alertStatus: string;
  createdAt: string;
  resolvedAt?: string;
  alertCode?: string;
  bpm?: number;
}

/**
 * Evento de actualización de batería
 */
export interface BatteryEvent {
  wearableId: string;
  macAddress: string;
  batteryLevel: number;
  batteryVoltage?: number;
  isCharging?: boolean;
}

/**
 * Evento de estado del dispositivo
 */
export interface DeviceStatusEvent {
  wearableId: string;
  macAddress: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService implements OnDestroy {
  private ws: WebSocket | null = null;
  private events$ = new Subject<WSEvent>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 20;
  private reconnectTimer: any = null;
  private isConnected = false;

  /** Observable del estado de conexión */
  private connectionStatus$ = new Subject<boolean>();

  constructor(private ngZone: NgZone) {
    this.connect();
  }

  private connect(): void {
    const wsUrl = (environment as any).wsUrl;
    
    if (!wsUrl || wsUrl === 'none' || wsUrl === '') {
      console.log('[WebSocket] ℹ️ Deshabilitado en esta configuración de cliente.');
      return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return; // Ya está conectado o conectando
    }

    try {
      this.ws = new WebSocket(wsUrl);


      this.ws.onopen = () => {
        this.ngZone.run(() => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.connectionStatus$.next(true);
          console.log('[WebSocket] ✅ Conectado al servidor en tiempo real');
        });
      };

      this.ws.onmessage = (event: MessageEvent) => {
        this.ngZone.run(() => {
          try {
            const wsEvent: WSEvent = JSON.parse(event.data);
            this.events$.next(wsEvent);
          } catch (err) {
            console.error('[WebSocket] Error parseando mensaje:', err);
          }
        });
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error de conexión:', error);
      };

      this.ws.onclose = (event) => {
        this.ngZone.run(() => {
          this.isConnected = false;
          this.connectionStatus$.next(false);
          console.log(`[WebSocket] Desconectado (código: ${event.code}). Reintentando...`);
          this.scheduleReconnect();
        });
      };
    } catch (err) {
      console.error('[WebSocket] Error creando conexión:', err);
      this.scheduleReconnect();
    }
  }

  /**
   * Reconexión con backoff exponencial
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[WebSocket] Máximo de intentos de reconexión alcanzado');
      return;
    }

    // Backoff exponencial: 1s, 2s, 4s, 8s, 16s, max 30s
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(`[WebSocket] Reconexión en ${delay / 1000}s (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  // =============================================================
  // OBSERVABLES TIPADOS POR TIPO DE EVENTO
  // =============================================================

  /**
   * Observable de nuevas alertas en tiempo real (desde wearables o creación manual)
   */
  onNewAlert(): Observable<AlertEvent> {
    return this.events$.pipe(
      filter(e => e.type === 'new_alert'),
      map(e => e.payload as AlertEvent)
    );
  }

  /**
   * Observable de alertas actualizadas (cambio de estado: Atendida, Resuelta)
   */
  onAlertUpdated(): Observable<AlertEvent> {
    return this.events$.pipe(
      filter(e => e.type === 'alert_updated'),
      map(e => e.payload as AlertEvent)
    );
  }

  /**
   * Observable de alertas eliminadas
   */
  onAlertDeleted(): Observable<{ alertId: string }> {
    return this.events$.pipe(
      filter(e => e.type === 'alert_deleted'),
      map(e => e.payload as { alertId: string })
    );
  }

  /**
   * Observable de actualizaciones de batería en tiempo real
   */
  onBatteryUpdate(): Observable<BatteryEvent> {
    return this.events$.pipe(
      filter(e => e.type === 'battery_update'),
      map(e => e.payload as BatteryEvent)
    );
  }

  /**
   * Observable de cambios de estado de dispositivos (online/offline)
   */
  onDeviceStatus(): Observable<DeviceStatusEvent> {
    return this.events$.pipe(
      filter(e => e.type === 'device_status'),
      map(e => e.payload as DeviceStatusEvent)
    );
  }

  /**
   * Observable del estado de conexión del WebSocket
   */
  onConnectionChange(): Observable<boolean> {
    return this.connectionStatus$.asObservable();
  }

  /**
   * ¿Está conectado al WebSocket?
   */
  get connected(): boolean {
    return this.isConnected;
  }

  ngOnDestroy(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
    }
    this.events$.complete();
    this.connectionStatus$.complete();
  }
}
