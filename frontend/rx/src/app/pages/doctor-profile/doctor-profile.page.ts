import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { PrescriptionService } from '../../services/prescription.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-doctor-profile',
  templateUrl: './doctor-profile.page.html',
  styleUrls: ['./doctor-profile.page.scss'],
})
export class DoctorProfilePage implements OnInit {
  profileForm: FormGroup;
  profile: any = null;
  isEditing = false;
  signatureFile: File | null = null;
  stampFile: File | null = null;
  letterheadFile: File | null = null;
  signaturePreview: string | null = null;
  stampPreview: string | null = null;
  letterheadPreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private prescriptionService: PrescriptionService,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    this.profileForm = this.createForm();
  }

  async ngOnInit() {
    await this.loadProfile();
  }

  createForm(): FormGroup {
    return this.fb.group({
      full_name: ['', [Validators.required]],
      qualification: ['', [Validators.required]],
      specialization: ['', [Validators.required]],
      registration_number: ['', [Validators.required]],
      clinic_name: ['', [Validators.required]],
      clinic_address: ['', [Validators.required]],
      clinic_phone: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', [Validators.required]],
      experience_years: [''],
      consultation_fee: [''],
      digital_signature_path: [''],
      stamp_image_path: [''],
      letterhead_image_path: ['']
    });
  }

  async loadProfile() {
    const loading = await this.loadingController.create({
      message: 'Loading profile...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      this.profile = await this.prescriptionService.getDoctorProfile();
      if (this.profile) {
        this.profileForm.patchValue(this.profile);
        
        // Load image previews if available
        if (this.profile.digital_signature_path) {
          this.signaturePreview = this.profile.digital_signature_path;
        }
        if (this.profile.stamp_image_path) {
          this.stampPreview = this.profile.stamp_image_path;
        }
        if (this.profile.letterhead_image_path) {
          this.letterheadPreview = this.profile.letterhead_image_path;
        }
      }
      await loading.dismiss();
    } catch (error) {
      await loading.dismiss();
      this.showAlert('Error', 'Failed to load profile. Please try again.');
    }
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.profileForm.patchValue(this.profile);
    }
  }

  onSignatureSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.signatureFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.signaturePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onStampSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.stampFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.stampPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onLetterheadSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.letterheadFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.letterheadPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeSignature() {
    this.signatureFile = null;
    this.signaturePreview = null;
    this.profileForm.patchValue({ digital_signature_path: '' });
  }

  removeStamp() {
    this.stampFile = null;
    this.stampPreview = null;
    this.profileForm.patchValue({ stamp_image_path: '' });
  }

  removeLetterhead() {
    this.letterheadFile = null;
    this.letterheadPreview = null;
    this.profileForm.patchValue({ letterhead_image_path: '' });
  }

  async saveProfile() {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Saving profile...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const formData = new FormData();
      const formValue = this.profileForm.value;

      // Append form data
      Object.keys(formValue).forEach(key => {
        if (key !== 'digital_signature_path' && key !== 'stamp_image_path' && key !== 'letterhead_image_path') {
          formData.append(key, formValue[key]);
        }
      });

      // Append files
      if (this.signatureFile) {
        formData.append('digital_signature', this.signatureFile);
      }
      if (this.stampFile) {
        formData.append('stamp_image', this.stampFile);
      }
      if (this.letterheadFile) {
        formData.append('letterhead_image', this.letterheadFile);
      }

      this.profile = await this.prescriptionService.updateDoctorProfile(formData);
      await this.authService.updateProfile(this.profile);
      
      await loading.dismiss();
      this.isEditing = false;
      this.showAlert('Success', 'Profile updated successfully!');
    } catch (error) {
      await loading.dismiss();
      this.showAlert('Error', 'Failed to update profile. Please try again.');
    }
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
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