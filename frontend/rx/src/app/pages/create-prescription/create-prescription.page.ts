import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController, ModalController, Platform } from '@ionic/angular';
import { PrescriptionService } from '../../services/prescription.service';
import { SelectPatientModalComponent } from '../../components/select-patient-modal/select-patient-modal.component';
import { AddMedicineModalComponent } from '../../components/add-medicine-modal/add-medicine-modal.component';

@Component({
  selector: 'app-create-prescription',
  templateUrl: './create-prescription.page.html',
  styleUrls: ['./create-prescription.page.scss'],
})
export class CreatePrescriptionPage implements OnInit {
  prescriptionForm: FormGroup;
  patients: any[] = [];
  medicines: any[] = [];
  externalMedicines: any[] = [];
  investigations: any[] = [];
  selectedPatient: any = null;
  isNewPatient = false;
  isLoading = false;
  showExternalMedicineSearch = false;
  consentAccepted = false;
  
  // Medicine search
  medicineSearchResults: any[] = [];
  externalMedicineSearchResults: any[] = [];
  
  // Date picker
  minDate: string;
  maxDate: string;

  constructor(
    private fb: FormBuilder,
    private prescriptionService: PrescriptionService,
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private modalController: ModalController,
    private platform: Platform
  ) {
    this.prescriptionForm = this.createForm();
    
    // Set date limits
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setFullYear(today.getFullYear() + 1);
    this.maxDate = maxDate.toISOString().split('T')[0];
  }

  async ngOnInit() {
    await this.loadInitialData();
    
    // Check if patient is passed via state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['patient']) {
      this.selectedPatient = navigation.extras.state['patient'];
      this.setPatientData(this.selectedPatient);
    }

      this.prescriptionForm.get('consent_obtained')?.valueChanges.subscribe(value => {
      console.log('Consent value changed to:', value);
    });
  }

    // Handle checkbox change
  onConsentChange(event: any) {
    const isChecked = event.detail.checked;
    this.consentAccepted = isChecked;
    
    // Update form value
    this.prescriptionForm.patchValue({
      consent_obtained: isChecked
    });
    
    // Mark as touched to trigger validation
    this.prescriptionForm.get('consent_obtained')?.markAsTouched();
    
    // Update form validation
    this.prescriptionForm.updateValueAndValidity();
  }

    // Better error display method
  showConsentError(): boolean {
    const consentControl = this.prescriptionForm.get('consent_obtained');
    if (!consentControl) return false;
    
    // Show error if:
    // 1. Control is invalid (value is not true)
    // 2. AND control is touched OR form is dirty (user has interacted)
    return consentControl.invalid && (consentControl.touched || this.prescriptionForm.dirty);
  }

  createForm(): FormGroup {
    return this.fb.group({
      // Patient Section
      patient_id: [''],
      patient_info: this.fb.group({
        full_name: ['', Validators.required],
        age: ['', [Validators.required, Validators.min(0), Validators.max(150)]],
        sex: ['', Validators.required],
        mobile: [''],
        email: ['', Validators.email]
      }),
      
      // Medical Information
      chief_complaint: ['', Validators.required],
      history_of_present_illness: [''],
      past_medical_history: [''],
      past_surgical_history: [''],
      diagnosis: [''],
      
      // Medicines
      medicines: this.fb.array([]),
      
      // Investigations
      investigations: this.fb.array([]),
      
      // Follow-up & Advice
      follow_up_date: [''],
      advice: [''],
      
      // Consent
      consent_obtained: [false, Validators.requiredTrue]
    });
  }

  // Form Array Getters
  get medicinesArray(): FormArray {
    return this.prescriptionForm.get('medicines') as FormArray;
  }

  get investigationsArray(): FormArray {
    return this.prescriptionForm.get('investigations') as FormArray;
  }

  // Patient Section
  async selectPatient() {
    const modal = await this.modalController.create({
      component: SelectPatientModalComponent,
      componentProps: {
        patients: this.patients
      },
      cssClass: 'select-patient-modal'
    });

    modal.onDidDismiss().then((result) => {
      if (result.data && result.data.patient) {
        this.selectedPatient = result.data.patient;
        this.setPatientData(this.selectedPatient);
        this.isNewPatient = false;
      }
    });

    await modal.present();
  }

  setPatientData(patient: any) {
    this.prescriptionForm.patchValue({
      patient_id: patient.id,
      patient_info: {
        full_name: patient.full_name,
        age: patient.age,
        sex: patient.sex,
        mobile: patient.mobile,
        email: patient.email
      }
    });
  }

  toggleNewPatient() {
    this.isNewPatient = !this.isNewPatient;
    if (this.isNewPatient) {
      this.selectedPatient = null;
      this.prescriptionForm.patchValue({ patient_id: '' });
      this.prescriptionForm.get('patient_info')?.reset();
    }
  }

  // Medicines Section
  addMedicine() {
    const medicineForm = this.fb.group({
      medicine_id: ['', Validators.required],
      name: ['', Validators.required],
      generic_name: [''],
      strength: [''],
      dosage: ['', Validators.required],
      frequency: ['', Validators.required],
      duration: ['', Validators.required],
      instructions: [''],
      is_external: [false]
    });
    this.medicinesArray.push(medicineForm);
  }

  removeMedicine(index: number) {
    this.medicinesArray.removeAt(index);
  }
  
  // Add this method
  getPatientInitials(): string {
    if (!this.selectedPatient?.full_name) return '';
    
    return this.selectedPatient.full_name
      .split(' ')
      .map((name: string) => name.charAt(0))  // Use charAt(0) instead of n[0]
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  async searchMedicines(event: any, index: number) {
    const searchTerm = event.target.value;
    if (searchTerm.length > 2) {
      try {
        this.medicineSearchResults = await this.prescriptionService.searchMedicines(searchTerm);
      } catch (error) {
        console.error('Error searching medicines:', error);
      }
    }
  }

  async searchExternalMedicines(event: any, index: number) {
    const searchTerm = event.target.value;
    if (searchTerm.length > 2) {
      try {
        this.externalMedicineSearchResults = await this.prescriptionService.searchExternalMedicines(searchTerm);
      } catch (error) {
        console.error('Error searching external medicines:', error);
      }
    }
  }

  selectMedicine(medicine: any, index: number) {
    const medicineForm = this.medicinesArray.at(index);
    medicineForm.patchValue({
      medicine_id: medicine.id,
      name: medicine.name,
      generic_name: medicine.generic_name || '',
      strength: medicine.strength || '',
      is_external: false
    });
    this.medicineSearchResults = [];
  }

  selectExternalMedicine(medicine: any, index: number) {
    const medicineForm = this.medicinesArray.at(index);
    medicineForm.patchValue({
      medicine_id: null, // Will be created or matched later
      name: medicine.name,
      generic_name: medicine.generic_name || '',
      strength: medicine.strength || '',
      is_external: true
    });
    this.externalMedicineSearchResults = [];
  }

  async addMedicineToDatabase(medicine: any, index: number) {
    const alert = await this.alertController.create({
      header: 'Add Medicine to Database',
      message: 'Do you want to add this medicine to your local database?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Add',
          handler: async () => {
            try {
              const newMedicine = await this.prescriptionService.addMedicine(medicine);
              const medicineForm = this.medicinesArray.at(index);
              medicineForm.patchValue({
                medicine_id: newMedicine.id,
                is_external: false
              });
              this.showAlert('Success', 'Medicine added to database');
            } catch (error) {
              this.showAlert('Error', 'Failed to add medicine');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async openAddMedicineModal(index: number) {
    const modal = await this.modalController.create({
      component: AddMedicineModalComponent,
      componentProps: {},
      cssClass: 'add-medicine-modal'
    });

    modal.onDidDismiss().then((result) => {
      if (result.data && result.data.medicine) {
        const medicineForm = this.medicinesArray.at(index);
        medicineForm.patchValue({
          medicine_id: result.data.medicine.id,
          name: result.data.medicine.name,
          generic_name: result.data.medicine.generic_name || '',
          strength: result.data.medicine.strength || '',
          is_external: false
        });
      }
    });

    await modal.present();
  }

  // Investigations Section
  addInvestigation() {
    const investigationForm = this.fb.group({
      investigation_id: ['', Validators.required],
      name: [''],
      notes: ['']
    });
    this.investigationsArray.push(investigationForm);
  }

  removeInvestigation(index: number) {
    this.investigationsArray.removeAt(index);
  }

  // Initial Data Loading
  async loadInitialData() {
    this.isLoading = true;
    try {
      // Load patients
      this.patients = await this.prescriptionService.getPatients();
      
      // Load investigations
      this.investigations = await this.prescriptionService.getInvestigations();
      
      // Add default medicines for quick selection
      this.addMedicine(); // Add first medicine row
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.showAlert('Error', 'Failed to load required data. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  // Form Submission
async submitPrescription() {
  // FIRST: Mark all fields as touched to show errors
  this.markFormGroupTouched(this.prescriptionForm);
  
  // Check consent first (since it's a special case)
  if (!this.prescriptionForm.value.consent_obtained) {
    const confirmed = await this.confirmConsent();
    if (!confirmed) {
      // User didn't confirm, just return
      return;
    } else {
      // User confirmed, update form value
      this.prescriptionForm.patchValue({ consent_obtained: true });
      // Re-validate form
      this.prescriptionForm.updateValueAndValidity();
    }
  }
  
  // NOW check if form is valid
  if (this.prescriptionForm.invalid) {
    // Show which fields are invalid (excluding consent since we handled it)
    this.showValidationErrors();
    return;
  }

  const loading = await this.loadingController.create({
    message: 'Creating prescription...',
    spinner: 'crescent'
  });
  await loading.present();

  try {
    const formData = this.prescriptionForm.value;
    
    // Transform medicines data
    const medicinesData = formData.medicines.map((med: any) => ({
      medicine_id: med.medicine_id,
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      duration: med.duration,
      instructions: med.instructions
    }));

    // Transform investigations data
    const investigationsData = formData.investigations.map((inv: any) => ({
      investigation_id: inv.investigation_id,
      notes: inv.notes
    }));

    // Prepare final data - use actual consent value
    const prescriptionData = {
      patient_id: formData.patient_id,
      patient_info: formData.patient_id ? null : formData.patient_info,
      chief_complaint: formData.chief_complaint,
      history_of_present_illness: formData.history_of_present_illness,
      past_medical_history: formData.past_medical_history,
      past_surgical_history: formData.past_surgical_history,
      diagnosis: formData.diagnosis,
      medicines: medicinesData,
      investigations: investigationsData,
      follow_up_date: formData.follow_up_date,
      advice: formData.advice,
      consent_obtained: formData.consent_obtained // Use the actual value
    };

    const response = await this.prescriptionService.createPrescription(prescriptionData);
    
    await loading.dismiss();
    
    // Show success message with options
    await this.showSuccessOptions(response.id);
    
  } catch (error: any) {
    await loading.dismiss();
    console.error('Create prescription error:', error);
    
    let errorMessage = 'Failed to create prescription. Please try again.';
    if (error.error?.error) {
      errorMessage = error.error.error;
    }
    
    this.showAlert('Error', errorMessage);
  }
}

// Helper method to show validation errors
private showValidationErrors(): void {
  const errors = [];
  
  // Check required fields
  if (!this.prescriptionForm.get('patient_info.full_name')?.value) {
    errors.push('Patient name is required');
  }
  
  if (!this.prescriptionForm.get('patient_info.age')?.value) {
    errors.push('Patient age is required');
  }
  
  if (!this.prescriptionForm.get('patient_info.sex')?.value) {
    errors.push('Patient gender is required');
  }
  
  if (!this.prescriptionForm.get('chief_complaint')?.value) {
    errors.push('Chief complaint is required');
  }
  
  if (this.medicinesArray.length === 0) {
    errors.push('At least one medicine is required');
  }
  
  // Show all errors
  if (errors.length > 0) {
    this.showAlert('Missing Information', errors.join('\n'));
  }
}

  async confirmConsent(): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: 'Patient Consent Required',
        message: `
          <div class="consent-message">
            <p><strong>I confirm that:</strong></p>
            <ul>
              <li>The patient was informed about complete treatment and prognosis of the illness</li>
              <li>In case the complaint aggravates in absence of the doctor, the patient should be admitted</li>
              <li>All treatment options were explained to the patient</li>
              <li>The patient has given informed consent for the treatment</li>
            </ul>
          </div>
        `,
        buttons: [
          {
            text: 'No, Cancel',
            role: 'cancel',
            handler: () => resolve(false)
          },
          {
            text: 'Yes, I Confirm',
            handler: () => {
              this.prescriptionForm.patchValue({ consent_obtained: true });
              resolve(true);
            }
          }
        ]
      });
      await alert.present();
    });
  }

  async showSuccessOptions(prescriptionId: number) {
    const alert = await this.alertController.create({
      header: 'Prescription Created Successfully!',
      message: 'What would you like to do next?',
      buttons: [
        {
          text: 'Download PDF',
          handler: () => {
            this.downloadPrescriptionPDF(prescriptionId);
          }
        },
        {
          text: 'Share via WhatsApp',
          handler: () => {
            this.shareViaWhatsApp(prescriptionId);
          }
        },
        {
          text: 'Share via Email',
          handler: () => {
            this.shareViaEmail(prescriptionId);
          }
        },
        {
          text: 'View Prescription',
          handler: () => {
            this.router.navigate(['/prescriptions']);
          }
        },
        {
          text: 'Create Another',
          role: 'cancel',
          handler: () => {
            this.resetForm();
          }
        }
      ]
    });
    await alert.present();
  }

  async downloadPrescriptionPDF(prescriptionId: number) {
    const loading = await this.loadingController.create({
      message: 'Generating PDF...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const blob = await this.prescriptionService.generatePrescriptionPDF(prescriptionId);
      this.prescriptionService.downloadFile(blob, `prescription-${prescriptionId}.pdf`);
      await loading.dismiss();
    } catch (error) {
      await loading.dismiss();
      this.showAlert('Error', 'Failed to generate PDF');
    }
  }

// Update the shareViaWhatsApp method
  async shareViaWhatsApp(prescriptionId: number) {
    const patientMobile = this.selectedPatient?.mobile || 
                         this.prescriptionForm.value.patient_info?.mobile;
    
    const loading = await this.loadingController.create({
      message: 'Preparing to share...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      if (this.platform.is('capacitor')) {
        // Use Capacitor for mobile app
        await this.shareViaCapacitorNative(prescriptionId, patientMobile);
      } else if (this.platform.is('android') || this.platform.is('ios')) {
        // Mobile browser - try Web Share API
        await this.shareViaWebShareAPI(prescriptionId, patientMobile);
      } else {
        // Desktop browser - use WhatsApp Web
        await this.shareViaWhatsAppWeb(prescriptionId, patientMobile);
      }
      
      await loading.dismiss();
    } catch (error) {
      await loading.dismiss();
      console.error('Share error:', error);
      this.showAlert('Error', 'Failed to share prescription. Please try download instead.');
    }
  }

  /**
   * Method 1: Native Capacitor sharing
   */
  private async shareViaCapacitorNative(prescriptionId: number, phoneNumber?: string) {
    // Use the enhanced service method
    await this.prescriptionService.shareViaWhatsAppWithFile(prescriptionId, phoneNumber);
  }

  /**
   * Method 2: Web Share API (for mobile browsers)
   */
  private async shareViaWebShareAPI(prescriptionId: number, phoneNumber?: string) {
    // Generate PDF
    const blob = await this.prescriptionService.generatePrescriptionPDF(prescriptionId);
    const file = new File([blob], `prescription-${prescriptionId}.pdf`, {
      type: 'application/pdf'
    });

    // Check if Web Share API supports files
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Prescription',
        text: this.getShareMessage(prescriptionId, phoneNumber)
      });
    } else {
      // Fallback to WhatsApp Web
      await this.shareViaWhatsAppWeb(prescriptionId, phoneNumber);
    }
  }

  /**
   * Method 3: WhatsApp Web (for desktop/mobile fallback)
   */
  private async shareViaWhatsAppWeb(prescriptionId: number, phoneNumber?: string) {
    if (!phoneNumber) {
      // Ask for phone number
      const phone = await this.promptForPhoneNumber();
      if (!phone) return;
      phoneNumber = phone;
    }

    // Generate temporary download link
    const downloadLink = await this.generateTemporaryLink(prescriptionId);
    
    const message = `📋 Your prescription is ready!\n\nDownload: ${downloadLink}\n\nThis link expires in 24 hours.`;
    
    const whatsappUrl = `https://wa.me/${this.formatPhoneNumber(phoneNumber)}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
  }

  /**
   * Helper method to generate temporary download link
   */
  private async generateTemporaryLink(prescriptionId: number): Promise<string> {
    // Call your backend to generate a temporary link
    // This should be implemented in your PrescriptionService
    return await this.prescriptionService.generateTemporaryDownloadLink(prescriptionId);
  }

  /**
   * Helper to format phone number
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Handle Indian numbers (add 91 if starts with 0)
    if (digits.startsWith('0')) {
      return '91' + digits.substring(1);
    }
    
    // Return as-is (assuming it already has country code)
    return digits;
  }

  /**
   * Prompt for phone number if not available
   */
  private async promptForPhoneNumber(): Promise<string | null> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: 'Phone Number Required',
        message: 'Enter patient WhatsApp number:',
        inputs: [
          {
            name: 'phone',
            type: 'tel',
            placeholder: 'e.g., 919876543210',
            attributes: {
              inputmode: 'tel'
            }
          }
        ],
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => resolve(null)
          },
          {
            text: 'Share',
            handler: (data) => {
              if (data.phone && data.phone.trim()) {
                resolve(data.phone.trim());
              } else {
                resolve(null);
              }
            }
          }
        ]
      });
      await alert.present();
    });
  }

  /**
   * Generate share message
   */
  private getShareMessage(prescriptionId: number, phoneNumber?: string): string {
    const patientName = phoneNumber ? 'Patient' : 'You';
    return `Prescription for ${patientName}\nID: RX${prescriptionId}\nDate: ${new Date().toLocaleDateString()}`;
  }

  async shareViaEmail(prescriptionId: number) {
    const alert = await this.alertController.create({
      header: 'Share via Email',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'Enter email address',
          value: this.selectedPatient?.email || this.prescriptionForm.value.patient_info?.email
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Send',
          handler: async (data) => {
            if (data.email) {
              const loading = await this.loadingController.create({
                message: 'Sending email...',
                spinner: 'crescent'
              });
              await loading.present();

              try {
                // Generate PDF first
                const blob = await this.prescriptionService.generatePrescriptionPDF(prescriptionId);
                
                // Convert blob to base64 for email attachment
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = async () => {
                  const base64data = reader.result;
                  
                  const emailData = {
                    to: data.email,
                    subject: 'Your Prescription',
                    content: 'Please find your prescription attached.',
                    attachment: base64data
                  };

                  await this.prescriptionService.shareViaEmail(emailData);
                  await loading.dismiss();
                  this.showAlert('Success', 'Email sent successfully!');
                };
              } catch (error) {
                await loading.dismiss();
                this.showAlert('Error', 'Failed to send email');
              }
            }
          }
        }
      ]
    });
    await alert.present();
  }

  resetForm() {
    this.prescriptionForm.reset();
    this.selectedPatient = null;
    this.isNewPatient = false;
    this.consentAccepted = false;
    
    // Clear form arrays
    while (this.medicinesArray.length !== 0) {
      this.medicinesArray.removeAt(0);
    }
    while (this.investigationsArray.length !== 0) {
      this.investigationsArray.removeAt(0);
    }
    
    // Add first medicine row
    this.addMedicine();
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          this.markFormGroupTouched(arrayControl as FormGroup);
        });
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

  // Utility methods
  getMedicineStrength(medicine: any): string {
    if (medicine.strength) {
      return `${medicine.name} (${medicine.strength})`;
    }
    return medicine.name;
  }

  toggleConsent() {
    this.consentAccepted = !this.consentAccepted;
    this.prescriptionForm.patchValue({ consent_obtained: this.consentAccepted });
  }
}