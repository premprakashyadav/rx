import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Storage } from '@ionic/storage-angular';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private storage: Storage,
    private router: Router,
    private toastr: ToastrService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return new Observable<HttpEvent<any>>(observer => {
      this.storage.get('token').then(token => {
        let authRequest = request;
        
        if (token) {
          authRequest = request.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });
        }

        next.handle(authRequest).subscribe({
          next: (event) => observer.next(event),
          error: (error: HttpErrorResponse) => {
            if (error.status === 401) {
              this.handleUnauthorized();
            } else if (error.status === 403) {
              this.toastr.error('Access denied. Please login again.');
              this.router.navigate(['/login']);
            } else if (error.status === 404) {
              this.toastr.error('Resource not found.');
            } else if (error.status >= 500) {
              this.toastr.error('Server error. Please try again later.');
            }
            observer.error(error);
          },
          complete: () => observer.complete()
        });
      });
    });
  }

  private handleUnauthorized() {
    this.storage.remove('token');
    this.storage.remove('user');
    this.toastr.error('Session expired. Please login again.');
    this.router.navigate(['/login']);
  }
}