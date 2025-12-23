import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
})
export class ResetPasswordPage implements OnInit {
  resetForm: FormGroup;
  token: string = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    this.resetForm = this.createForm();
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (!this.token) {
        this.showAlert('Invalid Link', 'Reset token is missing. Please request a new reset link.');
      }
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  async submit() {
    if (this.resetForm.invalid || !this.token) {
      return;
    }

    if (this.resetForm.errors?.['passwordMismatch']) {
      this.showAlert('Validation Error', 'Passwords do not match.');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Resetting password...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const { newPassword } = this.resetForm.value;
      await this.authService.resetPassword(this.token, newPassword).toPromise();
      
      await loading.dismiss();
      
      const alert = await this.alertController.create({
        header: 'Password Reset Successful!',
        message: 'Your password has been reset successfully. You can now login with your new password.',
        buttons: [
          {
            text: 'Login Now',
            handler: () => {
              this.router.navigate(['/login']);
            }
          }
        ]
      });
      await alert.present();

    } catch (error: any) {
      await loading.dismiss();
      
      let errorMessage = 'Failed to reset password. Please try again.';
      if (error.status === 400) {
        errorMessage = 'Invalid or expired reset link. Please request a new reset link.';
      }
      
      this.showAlert('Error', errorMessage);
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
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