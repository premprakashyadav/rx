import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { ToastrService } from 'ngx-toastr';
// Import Capacitor plugins
import { Share, ShareOptions } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Toast } from '@capacitor/toast';

@Injectable({
  providedIn: 'root'
})
export class PrescriptionService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  // Doctor Profile
  getDoctorProfile(): Promise<any> {
    return this.http.get(`${this.apiUrl}/doctor/profile`).toPromise();
  }

  updateDoctorProfile(data: FormData): Promise<any> {
    return this.http.put(`${this.apiUrl}/doctor/profile`, data).toPromise();
  }

  // Medicines
  searchMedicines(search: string): Promise<any> {
    return this.http.get(`${this.apiUrl}/medicines?search=${search}`).toPromise();
  }

  searchExternalMedicines(search: string): Promise<any> {
    return this.http.get(`${this.apiUrl}/medicines/external?search=${search}`).toPromise();
  }

  addMedicine(medicine: any): Promise<any> {
    return this.http.post(`${this.apiUrl}/medicines`, medicine).toPromise();
  }

  // Patients
  getPatients(search: string = ''): Promise<any> {
    return this.http.get(`${this.apiUrl}/patients?search=${search}`).toPromise();
  }

  addPatient(patient: any): Promise<any> {
    return this.http.post(`${this.apiUrl}/patients`, patient).toPromise();
  }

  getPatientById(id: number): Promise<any> {
    return this.http.get(`${this.apiUrl}/patients/${id}`).toPromise();
  }

  // Prescriptions
  createPrescription(data: any): Promise<any> {
    return this.http.post(`${this.apiUrl}/prescriptions`, data).toPromise();
  }

  getPrescriptions(): Promise<any> {
    return this.http.get(`${this.apiUrl}/prescriptions`).toPromise();
  }

  getPrescriptionById(id: number): Promise<any> {
    return this.http.get(`${this.apiUrl}/prescriptions/${id}`).toPromise();
  }

  // PRESCRIPTION PDF - CORRECTED
  generatePrescriptionPDF(prescriptionId: number): Promise<Blob> {
    // Your backend expects: /rx/api/prescriptions/:id/pdf
    return this.http.get(`${this.apiUrl}/prescriptions/${prescriptionId}/pdf`, {
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${this.authService.getToken()}`
      }
    }).toPromise() as Promise<Blob>;
  }
  // Certificates
  createCertificate(data: any): Promise<any> {
    return this.http.post(`${this.apiUrl}/certificates`, data).toPromise();
  }

  getCertificates(): Promise<any> {
    return this.http.get(`${this.apiUrl}/certificates`).toPromise();
  }

  generateCertificatePDF(certificateId: number): Promise<Blob> {
    return this.http.get(`${this.apiUrl}/certificates/${certificateId}/pdf`, {
      responseType: 'blob'
    }).toPromise() as Promise<Blob>;
  }

  // Investigations
  getInvestigations(): Promise<any> {
    return this.http.get(`${this.apiUrl}/investigations`).toPromise();
  }

  // History
  getPatientHistory(patientId: number): Promise<any> {
    return this.http.get(`${this.apiUrl}/patient-history/${patientId}`).toPromise();
  }

  // Share
  shareViaEmail(data: any): Promise<any> {
    return this.http.post(`${this.apiUrl}/share/email`, data).toPromise();
  }

  // Utility methods
  downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // TEMPORARY LINK - ADD THIS METHOD
  async generateTemporaryDownloadLink(prescriptionId: number): Promise<string> {
    try {
      // 1. First check if the endpoint exists
      const blob = await this.generatePrescriptionPDF(prescriptionId);
      
      // 2. Convert to base64
      const base64Data = await this.blobToBase64(blob);
      
      // 3. Upload to server for temporary link
      const response = await this.http.post<any>(
        `${this.apiUrl}/prescriptions/temp-link`, 
        {
          prescriptionId,
          base64Data
        },
        {
          headers: {
            'Authorization': `Bearer ${this.authService.getToken()}`
          }
        }
      ).toPromise();
      
      return response.url;
      
    } catch (error) {
      console.error('Temp link error:', error);
      
      // Fallback: Generate a direct link if temp-link endpoint doesn't exist
      return `${this.apiUrl}/prescriptions/${prescriptionId}/pdf`;
    }
  }


 // SHARE VIA WHATSAPP - UPDATED
  async shareViaWhatsApp(prescriptionId: number, phoneNumber?: string): Promise<void> {
    try {
      // Get download link
      const downloadLink = await this.generateTemporaryDownloadLink(prescriptionId);
      
      const message = `📋 Your prescription is ready!\n\nDownload: ${downloadLink}\n\nThis link expires in 24 hours.`;
      
      if (phoneNumber) {
        const formattedPhone = this.formatPhoneNumber(phoneNumber);
        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      } else {
        // Just show the link
        alert(`Copy this link to share: ${downloadLink}`);
      }
      
    } catch (error) {
      console.error('WhatsApp share error:', error);
      throw new Error('Failed to generate download link');
    }
  }


   /**
   * NEW: Enhanced WhatsApp sharing with file attachment using Capacitor
   */
  async shareViaWhatsAppWithFile(prescriptionId: number, phoneNumber?: string): Promise<void> {
    try {
      // 1. Generate PDF
      const loading = await this.showLoading('Generating prescription...');
      
      const blob = await this.generatePrescriptionPDF(prescriptionId);
      const fileName = `prescription-${prescriptionId}-${Date.now()}.pdf`;
      
      // 2. Check if Capacitor is available (mobile app)
      if (this.isCapacitorAvailable()) {
        await this.shareViaCapacitor(blob, fileName, prescriptionId, phoneNumber);
      } else {
        // 3. Fallback to web version
        await this.shareViaWeb(blob, fileName, prescriptionId, phoneNumber);
      }
      
      await this.dismissLoading(loading);
      
    } catch (error) {
      console.error('WhatsApp share error:', error);
      await this.showToast('Failed to share prescription', 'error');
    }
  }

  /**
   * Share using Capacitor Share API (for mobile apps)
   */
  private async shareViaCapacitor(blob: Blob, fileName: string, prescriptionId: number, phoneNumber?: string): Promise<void> {
    try {
      // Convert blob to base64
      const base64Data = await this.blobToBase64(blob);
      
      // Write file to device storage
      const fileResult = await Filesystem.writeFile({
        path: `prescriptions/${fileName}`,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true
      });

      // Create share options
      const shareOptions: ShareOptions = {
        title: 'Prescription',
        text: this.getShareMessage(prescriptionId, phoneNumber),
        url: fileResult.uri,
        files: [fileResult.uri], // This allows file sharing
        dialogTitle: 'Share Prescription'
      };

      // Open native share dialog
      await Share.share(shareOptions);

    } catch (error) {
      console.error('Capacitor share error:', error);
      throw error;
    }
  }

  /**
   * Fallback for web browsers
   */
  private async shareViaWeb(blob: Blob, fileName: string, prescriptionId: number, phoneNumber?: string): Promise<void> {
    // Create download link
    const url = window.URL.createObjectURL(blob);
    
    if (phoneNumber) {
      // Generate WhatsApp Web URL with download link
      const message = `${this.getShareMessage(prescriptionId, phoneNumber)}\n\nDownload: ${url}`;
      const whatsappUrl = `https://wa.me/${this.formatPhoneNumber(phoneNumber)}?text=${encodeURIComponent(message)}`;
      
      window.open(whatsappUrl, '_blank');
    } else {
      // Just download the file
      this.downloadFile(blob, fileName);
      await this.showToast('Prescription downloaded', 'success');
    }
  }

  /**
   * Check if running in Capacitor (mobile app)
   */
  private isCapacitorAvailable(): boolean {
    return typeof (window as any).Capacitor !== 'undefined';
  }

  /**
   * Convert blob to base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Format phone number for WhatsApp
   */
  private formatPhoneNumber(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  /**
   * Generate share message
   */
  private getShareMessage(prescriptionId: number, phoneNumber?: string): string {
    const patientName = phoneNumber ? 'Patient' : 'You';
    return `📋 Prescription for ${patientName}\n\nID: RX${prescriptionId}\nDate: ${new Date().toLocaleDateString()}\n\nPlease find your prescription attached.`;
  }

  /**
   * Show loading indicator
   */
  private async showLoading(message: string): Promise<HTMLIonLoadingElement> {
    // You'll need to inject LoadingController in constructor
    // For now, using simple alert
    console.log(message);
    return null as any;
  }

  private async dismissLoading(loading: any): Promise<void> {
    // Implement dismiss logic
  }

  /**
   * Show toast notification
   */
  private async showToast(message: string, type: 'success' | 'error'): Promise<void> {
    if (this.isCapacitorAvailable()) {
      await Toast.show({
        text: message,
        duration: 'short'
      });
    } else {
      if (type === 'success') {
        this.toastr.success(message);
      } else {
        this.toastr.error(message);
      }
    }
  }


  async downloadAndSharePDF(type: 'prescription' | 'certificate', id: number, patientPhone?: string) {
    try {
      let blob: Blob;
      let filename: string;

      if (type === 'prescription') {
        blob = await this.generatePrescriptionPDF(id);
        filename = `prescription-${id}.pdf`;
      } else {
        blob = await this.generateCertificatePDF(id);
        filename = `certificate-${id}.pdf`;
      }

      // Download the file
      this.downloadFile(blob, filename);

      // Share via WhatsApp if phone number provided
      if (patientPhone) {
        const message = `Please find your ${type} attached. Download link: [Your server URL]/${filename}`;
        this.shareViaWhatsApp(id, patientPhone);
      }

      this.toastr.success(`${type.charAt(0).toUpperCase() + type.slice(1)} downloaded successfully!`);
    } catch (error) {
      this.toastr.error(`Failed to generate ${type}. Please try again.`);
      console.error(`Error generating ${type}:`, error);
    }
  }
}