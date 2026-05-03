import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HabitacionesService {
  private apiUrl = `${environment.apiUrl}/room`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getHabitaciones(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  crearHabitacion(habitacionData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, habitacionData, { headers: this.getHeaders() });
  }

  actualizarHabitacion(id: string, habitacionData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, habitacionData, { headers: this.getHeaders() });
  }

  eliminarHabitacion(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}