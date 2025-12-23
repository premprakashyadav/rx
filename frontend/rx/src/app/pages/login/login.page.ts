import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  showPassword = false;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {}

  async login() {
    if (this.loginForm.invalid) {
      this.showAlert('Validation Error', 'Please fill all required fields correctly.');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Logging in...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const { email, password } = this.loginForm.value;
      await this.authService.login(email, password).toPromise();
      
      await loading.dismiss();
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      await loading.dismiss();
      this.showAlert('Login Failed', error.error?.error || 'Invalid credentials. Please try again.');
    }
  }

  async forgotPassword() {
    const alert = await this.alertController.create({
      header: 'Forgot Password',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'Enter your email',
          attributes: {
            required: true
          }
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Reset',
          handler: async (data) => {
            if (!data.email) {
              this.showAlert('Error', 'Please enter your email address.');
              return false;
            }

            const loading = await this.loadingController.create({
              message: 'Sending reset link...'
            });
            await loading.present();

            try {
              await this.authService.forgotPassword(data.email).toPromise();
              await loading.dismiss();
              this.showAlert('Success', 'Password reset link sent to your email. Please check your inbox.');
            } catch (error) {
              await loading.dismiss();
              this.showAlert('Error', 'Failed to send reset link. Please try again.');
            }
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  goToRegister() {
    this.router.navigate(['/register']);
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