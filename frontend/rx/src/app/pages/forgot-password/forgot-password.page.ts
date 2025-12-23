import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
})
export class ForgotPasswordPage implements OnInit {
  forgotForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {}

  async submit() {
    if (this.forgotForm.invalid) {
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Sending reset link...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const email = this.forgotForm.value.email;
      await this.authService.forgotPassword(email).toPromise();
      
      await loading.dismiss();
      
      const alert = await this.alertController.create({
        header: 'Check Your Email',
        message: 'Password reset link has been sent to your email address. Please check your inbox and follow the instructions.',
        buttons: [
          {
            text: 'OK',
            handler: () => {
              this.router.navigate(['/login']);
            }
          }
        ]
      });
      await alert.present();

    } catch (error: any) {
      await loading.dismiss();
      
      let errorMessage = 'Failed to send reset link. Please try again.';
      if (error.status === 404) {
        errorMessage = 'Email not found. Please check your email address.';
      }
      
      this.showAlert('Error', errorMessage);
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}