import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ModalController, Platform } from '@ionic/angular';
import { PrescriptionService } from '../../services/prescription.service';
import { SelectPatientModalComponent } from '../../components/select-patient-modal/select-patient-modal.component';

@Component({
  selector: 'app-create-certificate',
  templateUrl: './create-certificate.page.html',
  styleUrls: ['./create-certificate.page.scss'],
})
export class CreateCertificatePage implements OnInit {
  certificateForm: FormGroup;
  patients: any[] = [];
  selectedPatient: any = null;
  isLoading = false;
  certificateTypes = [
    { value: 'medical', label: 'Medical Certificate', icon: 'medkit-outline' },
    { value: 'fitness', label: 'Fitness Certificate', icon: 'body-outline' }
  ];
  
  // Certificate templates
  templates = {
    medical: {
      content: 'This is to certify that Mr./Ms. [PATIENT_NAME] is suffering from [DIAGNOSIS] and requires rest/medical treatment from [START_DATE] to [END_DATE].',
      recommendations: 'Recommended to take rest and follow prescribed medication.',
      restrictions: 'Should avoid strenuous activities and follow-up as advised.'
    },
    fitness: {
      content: 'This is to certify that Mr./Ms. [PATIENT_NAME] is physically fit and medically cleared for [ACTIVITY_PURPOSE].',
      recommendations: 'Can resume normal activities and exercise.',
      restrictions: 'No specific restrictions.'
    }
  };
  
  // Date picker
  minDate: string;
  maxDate: string;
  
  // Activity purposes for fitness certificate
  activityPurposes = [
    'Employment',
    'Sports Participation',
    'Travel',
    'Education',
    'Driving License',
    'Insurance',
    'Other'
  ];

  constructor(
    private fb: FormBuilder,
    private prescriptionService: PrescriptionService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private modalController: ModalController,
    private platform: Platform
  ) {
    this.certificateForm = this.createForm();
    
    // Set date limits
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setFullYear(today.getFullYear() + 1);
    this.maxDate = maxDate.toISOString().split('T')[0];
  }

  async ngOnInit() {
    await this.loadPatients();
  }

  getPatientInitials(patient: any): string {
  if (!patient?.full_name) return '';
  
  // Split the name, get first letter of each word, join, uppercase, take first 2 chars
  return patient.full_name
    .split(' ')
    .map((n: string) => n.charAt(0))  // Use charAt(0) instead of n[0]
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

  createForm(): FormGroup {
    return this.fb.group({
      // Patient Selection
      patient_id: ['', Validators.required],
      
      // Certificate Details
      certificate_type: ['medical', Validators.required],
      issue_date: [new Date().toISOString().split('T')[0], Validators.required],
      valid_until: ['', Validators.required],
      activity_purpose: [''],
      
      // Medical Information
      diagnosis: [''],
      content: ['', Validators.required],
      recommendations: [''],
      restrictions: ['']
    });
  }

  async loadPatients() {
    this.isLoading = true;
    try {
      this.patients = await this.prescriptionService.getPatients();
    } catch (error) {
      console.error('Error loading patients:', error);
      this.showAlert('Error', 'Failed to load patients. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

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
        this.certificateForm.patchValue({ patient_id: this.selectedPatient.id });
        
        // Pre-fill content with patient name
        this.updateCertificateContent();
      }
    });

    await modal.present();
  }

  onCertificateTypeChange() {
    const type = this.certificateForm.get('certificate_type')?.value;
    const template = this.templates[type as keyof typeof this.templates];
    
    // Update form with template
    this.certificateForm.patchValue({
      content: template.content,
      recommendations: template.recommendations,
      restrictions: template.restrictions
    });
    
    // Clear diagnosis for fitness certificate
    if (type === 'fitness') {
      this.certificateForm.patchValue({ diagnosis: '' });
    }
    
    // Update content with patient name if selected
    this.updateCertificateContent();
  }

  updateCertificateContent() {
    if (!this.selectedPatient) return;
    
    const type = this.certificateForm.get('certificate_type')?.value;
    let content = this.certificateForm.get('content')?.value;
    
    // Replace placeholders
    content = content.replace('[PATIENT_NAME]', this.selectedPatient.full_name);
    
    const diagnosis = this.certificateForm.get('diagnosis')?.value;
    if (diagnosis) {
      content = content.replace('[DIAGNOSIS]', diagnosis);
    }
    
    const startDate = this.certificateForm.get('issue_date')?.value;
    const endDate = this.certificateForm.get('valid_until')?.value;
    if (startDate && endDate) {
      content = content.replace('[START_DATE]', this.formatDate(startDate));
      content = content.replace('[END_DATE]', this.formatDate(endDate));
    }
    
    this.certificateForm.patchValue({ content });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  onDateChange() {
    this.updateCertificateContent();
  }

  applyTemplate(templateType: string) {
    if (templateType === 'short_medical') {
      const content = `This is to certify that Mr./Ms. ${this.selectedPatient?.full_name || '[PATIENT_NAME]'} is under my medical care and requires rest from ${this.formatDate(this.certificateForm.get('issue_date')?.value)} to ${this.formatDate(this.certificateForm.get('valid_until')?.value)} due to ${this.certificateForm.get('diagnosis')?.value || 'medical reasons'}.`;
      this.certificateForm.patchValue({ content });
    } else if (templateType === 'fitness_clearance') {
      const content = `This is to certify that Mr./Ms. ${this.selectedPatient?.full_name || '[PATIENT_NAME]'} has been examined by me and found to be physically fit for ${this.certificateForm.get('activity_purpose')?.value || 'the intended purpose'}.`;
      this.certificateForm.patchValue({ content });
    } else if (templateType === 'sick_leave') {
      const content = `This is to certify that Mr./Ms. ${this.selectedPatient?.full_name || '[PATIENT_NAME]'} was unable to attend work/school from ${this.formatDate(this.certificateForm.get('issue_date')?.value)} to ${this.formatDate(this.certificateForm.get('valid_until')?.value)} due to ${this.certificateForm.get('diagnosis')?.value || 'illness'}.`;
      this.certificateForm.patchValue({ content });
    }
  }

  async generateCertificate() {
    if (this.certificateForm.invalid) {
      this.markFormGroupTouched(this.certificateForm);
      return;
    }

    if (!this.selectedPatient) {
      this.showAlert('Error', 'Please select a patient first.');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Creating certificate...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const formData = this.certificateForm.value;
      
      // Prepare certificate data
      const certificateData = {
        patient_id: formData.patient_id,
        certificate_type: formData.certificate_type,
        issue_date: formData.issue_date,
        valid_until: formData.valid_until,
        content: formData.content,
        diagnosis: formData.diagnosis,
        recommendations: formData.recommendations,
        restrictions: formData.restrictions
      };

      const response = await this.prescriptionService.createCertificate(certificateData);
      
      await loading.dismiss();
      
      // Show success message with options
      await this.showSuccessOptions(response.id);
      
    } catch (error: any) {
      await loading.dismiss();
      console.error('Create certificate error:', error);
      
      let errorMessage = 'Failed to create certificate. Please try again.';
      if (error.error?.error) {
        errorMessage = error.error.error;
      }
      
      this.showAlert('Error', errorMessage);
    }
  }

  async showSuccessOptions(certificateId: number) {
    const alert = await this.alertController.create({
      header: 'Certificate Created Successfully!',
      message: 'What would you like to do next?',
      buttons: [
        {
          text: 'Download PDF',
          handler: () => {
            this.downloadCertificatePDF(certificateId);
          }
        },
        {
          text: 'Share via WhatsApp',
          handler: () => {
            this.shareViaWhatsApp(certificateId);
          }
        },
        {
          text: 'Share via Email',
          handler: () => {
            this.shareViaEmail(certificateId);
          }
        },
        {
          text: 'View Certificate',
          handler: () => {
            this.router.navigate(['/certificates']);
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

  async downloadCertificatePDF(certificateId: number) {
    const loading = await this.loadingController.create({
      message: 'Generating PDF...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const blob = await this.prescriptionService.generateCertificatePDF(certificateId);
      this.prescriptionService.downloadFile(blob, `certificate-${certificateId}.pdf`);
      await loading.dismiss();
    } catch (error) {
      await loading.dismiss();
      this.showAlert('Error', 'Failed to generate PDF');
    }
  }

  // async shareViaWhatsApp(certificateId: number) {
  //   if (!this.selectedPatient?.mobile) {
  //     const alert = await this.alertController.create({
  //       header: 'Mobile Number Required',
  //       message: 'Please select a patient with mobile number to share via WhatsApp.',
  //       buttons: [
  //         {
  //           text: 'Cancel',
  //           role: 'cancel'
  //         },
  //         {
  //           text: 'Enter Manually',
  //           handler: () => {
  //             this.promptForMobileNumber(certificateId);
  //           }
  //         }
  //       ]
  //     });
  //     await alert.present();
  //   } else {
  //     this.prescriptionService.shareViaWhatsApp(this.selectedPatient.mobile, 
  //       `Your ${this.certificateForm.get('certificate_type')?.value === 'medical' ? 'medical' : 'fitness'} certificate is ready. Download link: [Your certificate link]`);
  //   }
  // }

  async promptForMobileNumber(certificateId: number) {
    const alert = await this.alertController.create({
      header: 'Enter Mobile Number',
      inputs: [
        {
          name: 'mobile',
          type: 'tel',
          placeholder: 'Enter mobile number'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Share',
          handler: (data) => {
            if (data.mobile) {
              this.prescriptionService.shareViaWhatsApp(data.mobile, 
                `Your ${this.certificateForm.get('certificate_type')?.value === 'medical' ? 'medical' : 'fitness'} certificate is ready. Download link: [Your certificate link]`);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  
// Update the shareViaWhatsApp method
  async shareViaWhatsApp(prescriptionId: number) {
    const patientMobile = this.selectedPatient?.mobile || 
                         this.certificateForm.value.patient_info?.mobile;
    
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


  async shareViaEmail(certificateId: number) {
    const alert = await this.alertController.create({
      header: 'Share via Email',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'Enter email address',
          value: this.selectedPatient?.email || ''
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
                const blob = await this.prescriptionService.generateCertificatePDF(certificateId);
                
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = async () => {
                  const base64data = reader.result;
                  
                  const emailData = {
                    to: data.email,
                    subject: `Your ${this.certificateForm.get('certificate_type')?.value === 'medical' ? 'Medical' : 'Fitness'} Certificate`,
                    content: 'Please find your certificate attached.',
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
    this.certificateForm.reset({
      certificate_type: 'medical',
      issue_date: new Date().toISOString().split('T')[0]
    });
    this.selectedPatient = null;
    this.onCertificateTypeChange();
  }

  previewCertificate() {
    // In a real app, this would show a preview modal
    const certificateData = this.certificateForm.value;
    const previewContent = `
      Certificate Type: ${certificateData.certificate_type === 'medical' ? 'Medical Certificate' : 'Fitness Certificate'}
      Patient: ${this.selectedPatient?.full_name || 'Not selected'}
      Issue Date: ${certificateData.issue_date}
      Valid Until: ${certificateData.valid_until}
      
      Content:
      ${certificateData.content}
      
      ${certificateData.diagnosis ? `Diagnosis: ${certificateData.diagnosis}\n` : ''}
      ${certificateData.recommendations ? `Recommendations: ${certificateData.recommendations}\n` : ''}
      ${certificateData.restrictions ? `Restrictions: ${certificateData.restrictions}` : ''}
    `;
    
    this.showAlert('Certificate Preview', previewContent);
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getCertificateTypeLabel(type: string): string {
    return this.certificateTypes.find(t => t.value === type)?.label || type;
  }

  getCertificateIcon(type: string): string {
    return this.certificateTypes.find(t => t.value === type)?.icon || 'document-text-outline';
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