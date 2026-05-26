import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ConfirmData {
  title: string;
  message: string;
  resolve: (value: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmModalService {
  private confirmSubject = new Subject<ConfirmData | null>();
  confirm$ = this.confirmSubject.asObservable();

  confirm(title: string, message: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.confirmSubject.next({
        title,
        message,
        resolve: (result: boolean) => {
          this.confirmSubject.next(null); // Ocultar modal
          resolve(result);
        }
      });
    });
  }
}
