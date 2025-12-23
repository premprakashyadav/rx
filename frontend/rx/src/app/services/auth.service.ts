import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Storage } from '@ionic/storage-angular';
import { environment } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private storage: Storage,
    private toastr: ToastrService
  ) {
    this.init();
  }

  async init() {
    await this.storage.create();
    const user = await this.storage.get('user');
    const token = await this.storage.get('token');
    if (user && token) {
      this.currentUserSubject.next(user);
    }
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(async (response: any) => {
          await this.storage.set('token', response.token);
          await this.storage.set('user', response.user);
          await this.storage.set('profile', response.profile);
          this.currentUserSubject.next(response.user);
          this.toastr.success('Login successful!');
        })
      );
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, userData)
      .pipe(
        tap(() => {
          this.toastr.success('Registration successful! Please login.');
        })
      );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email })
      .pipe(
        tap(() => {
          this.toastr.success('Password reset link sent to your email.');
        })
      );
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, { token, newPassword })
      .pipe(
        tap(() => {
          this.toastr.success('Password reset successful! Please login.');
        })
      );
  }

  async logout() {
    await this.storage.remove('token');
    await this.storage.remove('user');
    await this.storage.remove('profile');
    this.currentUserSubject.next(null);
    this.toastr.info('Logged out successfully.');
  }

  getToken(): Promise<string> {
    return this.storage.get('token');
  }

  getUser(): Promise<any> {
    return this.storage.get('user');
  }

  getProfile(): Promise<any> {
    return this.storage.get('profile');
  }

  isAuthenticated(): Promise<boolean> {
    return this.getToken().then(token => !!token);
  }

  updateProfile(profile: any) {
    return this.storage.set('profile', profile);
  }
}