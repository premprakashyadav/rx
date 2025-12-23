import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit, OnDestroy {
  registerForm!: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  uploadedFiles: { [key: string]: File } = {};
  userTypes = [
    { value: 'doctor', label: 'Doctor' },
    { value: 'patient', label: 'Patient' }
  ];
  
  // Show/hide doctor specific fields
  showDoctorFields = true;
previewUrls: { [key: string]: string } = {};
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.setupFormListeners();
  }

  initializeForm(): void {
    this.registerForm = this.fb.group({
      // User type selection
      user_type: ['doctor', [Validators.required]],
      
      // User credentials
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      
      // Doctor information
      full_name: ['', []],
      qualification: ['', []],
      specialization: ['', []],
      registration_number: ['', []],
      clinic_name: ['', []],
      clinic_address: ['', []],
      clinic_phone: ['', []],
      mobile: ['', []],
      experience_years: [''],
      consultation_fee: [''],
      
      // File uploads (optional)
      digital_signature: [null],
      stamp_image: [null],
      letterhead_image: [null]
    }, { 
      validators: [this.passwordMatchValidator, this.fileSizeValidator] 
    });
    
    // Initially enable doctor validators since default is doctor
    this.enableDoctorValidators();
  }

  setupFormListeners(): void {
    // Wait for form to be initialized before setting up listener
    if (this.registerForm) {
      this.registerForm.get('user_type')?.valueChanges.subscribe(userType => {
        this.showDoctorFields = userType === 'doctor';
        
        // Update validators based on user type
        if (userType === 'doctor') {
          this.enableDoctorValidators();
        } else {
          this.disableDoctorValidators();
        }
      });
    }
  }

  // Enable required validators for doctor fields
  private enableDoctorValidators(): void {
    const requiredFields = [
      'full_name', 'qualification', 'specialization', 'registration_number',
      'clinic_name', 'clinic_address', 'clinic_phone', 'mobile'
    ];
    
    requiredFields.forEach(field => {
      const control = this.registerForm.get(field);
      if (control) {
        control.setValidators([Validators.required]);
        control.updateValueAndValidity();
      }
    });
  }

  // Disable required validators for doctor fields
  private disableDoctorValidators(): void {
    const doctorFields = [
      'full_name', 'qualification', 'specialization', 'registration_number',
      'clinic_name', 'clinic_address', 'clinic_phone', 'mobile',
      'experience_years', 'consultation_fee',
      'digital_signature', 'stamp_image', 'letterhead_image'
    ];
    
    doctorFields.forEach(field => {
      const control = this.registerForm.get(field);
      if (control) {
        control.clearValidators();
        control.updateValueAndValidity();
      }
    });
  }

  // File size validator
  fileSizeValidator(group: FormGroup): ValidationErrors | null {
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    for (const field of ['digital_signature', 'stamp_image', 'letterhead_image']) {
      const control = group?.get(field);
      if (!control) continue;
      
      const value = control.value;
      
      // Check if value is a File object
      if (value instanceof File && value.size > maxSize) {
        return { fileTooLarge: `${field} exceeds 5MB limit` };
      }
      
      // Check if value has size property (when we store file info)
      if (value && typeof value === 'object' && value.size && value.size > maxSize) {
        return { fileTooLarge: `${field} exceeds 5MB limit` };
      }
    }
    
    return null;
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form?.get('password')?.value;
    const confirmPassword = form?.get('confirmPassword')?.value;
    
    if (!password || !confirmPassword) {
      return null;
    }
    
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // File handling methods
  getFileName(file: any): string {
    if (file instanceof File) {
      return file.name;
    }
    
    if (file && typeof file === 'object' && file.name) {
      return file.name;
    }
    
    if (typeof file === 'string') {
      // Extract filename from base64 string or path
      const parts = file.split('/');
      return parts[parts.length - 1] || 'Uploaded file';
    }
    
    return 'Uploaded file';
  }

// Updated getFilePreview method
getFilePreview(file: File): string {
  if (!file) return '';
  
  const fieldName = this.getFileFieldName(file);
  
  // Clean up old URL to prevent memory leaks
  if (this.previewUrls[fieldName]) {
    URL.revokeObjectURL(this.previewUrls[fieldName]);
  }
  
  // Create and cache new URL
  this.previewUrls[fieldName] = URL.createObjectURL(file);
  
  // Use setTimeout to ensure change happens in next tick
  setTimeout(() => {
    this.registerForm.markAsPristine();
  }, 0);
  
  return this.previewUrls[fieldName];
}

// Helper method to get field name from file
private getFileFieldName(file: File): string {
  for (const [key, value] of Object.entries(this.uploadedFiles)) {
    if (value === file) return key;
  }
  return 'unknown';
}

// Updated hasImagePreviews method
hasImagePreviews(): boolean {
  return Object.keys(this.previewUrls).length > 0;
}

  // File selection handler with validation
  onFileSelected(event: any, fieldName: string): void {
    const file = event.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        this.showAlert('File Too Large', 
          `${this.getFieldDisplayName(fieldName)} exceeds 5MB limit. Please choose a smaller file.`);
        event.target.value = ''; // Clear the input
        return;
      }
      
      // Check file type
      const allowedTypes = fieldName === 'digital_signature' 
        ? ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
        : ['image/jpeg', 'image/png', 'image/jpg'];
      
      if (!allowedTypes.includes(file.type)) {
        this.showAlert('Invalid File Type', 
          fieldName === 'digital_signature'
            ? 'Please upload JPG, PNG, or PDF files only.'
            : 'Please upload JPG or PNG images only.');
        event.target.value = '';
        return;
      }
      
      this.uploadedFiles[fieldName] = file;
      
      // Update form control value with file info
      this.registerForm.patchValue({
        [fieldName]: {
          name: file.name,
          size: file.size,
          type: file.type,
          file: file // Store the actual file object
        }
      });
    }
  }

  getFileSize(file: any): string {
    let fileSize: number;
    
    if (file instanceof File) {
      fileSize = file.size;
    } else if (file && typeof file === 'object' && file.size) {
      fileSize = file.size;
    } else {
      return '0 KB';
    }
    
    const sizeInKB = fileSize / 1024;
    if (sizeInKB < 1024) {
      return `${sizeInKB.toFixed(1)} KB`;
    }
    return `${(sizeInKB / 1024).toFixed(1)} MB`;
  }

  removeFile(fieldName: string): void {
    delete this.uploadedFiles[fieldName];
    this.registerForm.patchValue({ [fieldName]: null });
    
    // Clear the file input
    const fileInput = document.querySelector(`input[type="file"][data-field="${fieldName}"]`) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // hasImagePreviews(): boolean {
  //   return Object.values(this.uploadedFiles).some(file => 
  //     file && file.type && file.type.includes('image')
  //   );
  // }

  // Helper to get display name for file fields
  private getFieldDisplayName(fieldName: string): string {
    const fieldNames: { [key: string]: string } = {
      digital_signature: 'Digital Signature',
      stamp_image: 'Stamp Image',
      letterhead_image: 'Letterhead'
    };
    return fieldNames[fieldName] || fieldName;
  }

  async register() {
    if (!this.registerForm || this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    if (this.registerForm.errors?.['passwordMismatch']) {
      this.showAlert('Validation Error', 'Passwords do not match.');
      return;
    }

    if (this.registerForm.errors?.['fileTooLarge']) {
      this.showAlert('Validation Error', 'File size exceeds 5MB limit.');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Creating your account...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const formData = this.registerForm.value;
      const userType = formData.user_type;
      
      // Prepare user data based on user type
      const userData: any = {
        email: formData.email,
        password: formData.password,
        user_type: userType
      };

      // If doctor, include doctor data
      if (userType === 'doctor') {
        // First upload files if any exist
        const uploadedFiles = await this.uploadFiles();
        
        userData.doctorData = {
          full_name: formData.full_name,
          qualification: formData.qualification,
          specialization: formData.specialization,
          registration_number: formData.registration_number,
          clinic_name: formData.clinic_name,
          clinic_address: formData.clinic_address,
          clinic_phone: formData.clinic_phone,
          mobile: formData.mobile,
          email: formData.email, // Include email in doctor data too
          experience_years: formData.experience_years || null,
          consultation_fee: formData.consultation_fee || null,
          // Add file paths from uploaded files
          digital_signature_path: uploadedFiles['digital_signature'] || null,
          stamp_image_path: uploadedFiles['stamp_image'] || null,
          letterhead_image_path: uploadedFiles['letterhead_image'] || null
        };
      }
      // If patient, you can add patient data here
      else if (userType === 'patient') {
        // Add patient specific data if needed
        // userData.patientData = { ... }
      }

      console.log('Sending registration data:', userData);

      await this.authService.register(userData).toPromise();
      
      await loading.dismiss();
      
      const successAlert = await this.alertController.create({
        header: 'Registration Successful!',
        message: 'Your account has been created. Please login to continue.',
        buttons: [
          {
            text: 'Login Now',
            handler: () => {
              this.router.navigate(['/login']);
            }
          }
        ]
      });
      await successAlert.present();

    } catch (error: any) {
      await loading.dismiss();
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.error?.error) {
        errorMessage = error.error.error;
      } else if (error.error?.details) {
        errorMessage = `${error.error.error}: ${error.error.details}`;
      } else if (error.status === 400) {
        errorMessage = 'Email already exists. Please use a different email.';
      } else if (error.status === 413) {
        errorMessage = 'File too large. Please upload files less than 5MB.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('Registration error:', error);
      this.showAlert('Registration Failed', errorMessage);
    }
  }

  // Helper method to upload files
  private async uploadFiles(): Promise<{ [key: string]: string }> {
    const uploadedFiles: { [key: string]: string } = {};
    const fileFields = ['digital_signature', 'stamp_image', 'letterhead_image'];
    
    for (const field of fileFields) {
      const file = this.uploadedFiles[field];
      if (file) {
        try {
          // Convert to base64 since we don't have upload endpoint
          const base64Data = await this.convertFileToBase64(file);
          uploadedFiles[field] = base64Data;
          
        } catch (error) {
          console.error(`Failed to upload ${field}:`, error);
          throw new Error(`Failed to upload ${field}. Please try again.`);
        }
      }
    }
    
    return uploadedFiles;
  }

  // Convert file to Base64
  private async convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  markFormGroupTouched(formGroup: FormGroup) {
    if (!formGroup) return;
    
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
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

  ngOnDestroy() {
  // Clean up all object URLs to prevent memory leaks
  Object.values(this.previewUrls).forEach(url => {
    if (url) {
      URL.revokeObjectURL(url);
    }
  });
  this.previewUrls = {};
}
}