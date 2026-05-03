import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AutenticacionService {
    private baseUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    login(username: string, password: string): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/login`, { username, password })
            .pipe(
                tap(response => {
                    if (response && response.token) {
                        localStorage.setItem('token', response.token);
                    }
                })
            );
    }

    logout(): void {
        localStorage.removeItem('token');
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }
}