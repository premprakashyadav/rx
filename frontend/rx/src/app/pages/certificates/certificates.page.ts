import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { PrescriptionService } from '../../services/prescription.service';
import { FilterCertificatesModalComponent } from '../../components/filter-certificates-modal/filter-certificates-modal.component';

@Component({
  selector: 'app-certificates',
  templateUrl: './certificates.page.html',
  styleUrls: ['./certificates.page.scss'],
})
export class CertificatesPage implements OnInit {
  certificates: any[] = [];
  filteredCertificates: any[] = [];
  isLoading = true;
  searchTerm: string = '';
  viewMode: 'list' | 'grid' = 'list';
  
  // Filter state
  activeFilters = {
    certificateType: 'all',
    dateRange: 'all',
    status: 'all',
    patientName: ''
  };
  
  // Date ranges for quick filter
  dateRanges = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'all', label: 'All Time' }
  ];
  
  // Certificate types
  certificateTypes = [
    { value: 'medical', label: 'Medical Certificate', icon: 'medkit-outline', color: 'primary' },
    { value: 'fitness', label: 'Fitness Certificate', icon: 'body-outline', color: 'success' }
  ];
  
  // Sort options
  sortBy = 'date_desc';
  sortOptions = [
    { value: 'date_desc', label: 'Newest First' },
    { value: 'date_asc', label: 'Oldest First' },
    { value: 'patient_asc', label: 'Patient Name (A-Z)' },
    { value: 'patient_desc', label: 'Patient Name (Z-A)' },
    { value: 'expiry_asc', label: 'Expiring Soon' },
    { value: 'expiry_desc', label: 'Expiring Last' }
  ];

  constructor(
    private prescriptionService: PrescriptionService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private modalController: ModalController
  ) {}

  async ngOnInit() {
    await this.loadCertificates();
  }

  async loadCertificates() {
    this.isLoading = true;
    try {
      // In a real app, this would be an API call
      // For now, we'll simulate with mock data
      this.certificates = await this.generateMockCertificates();
      this.applyFilters();
    } catch (error) {
      console.error('Error loading certificates:', error);
      this.showAlert('Error', 'Failed to load certificates. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  async refreshData(event: any) {
    await this.loadCertificates();
    event.target.complete();
  }

  async openFilters() {
    const modal = await this.modalController.create({
      component: FilterCertificatesModalComponent,
      componentProps: {
        activeFilters: this.activeFilters,
        certificateTypes: this.certificateTypes
      },
      cssClass: 'filter-modal'
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        this.activeFilters = result.data;
        this.applyFilters();
      }
    });

    await modal.present();
  }

  applyFilters() {
    let filtered = [...this.certificates];

    // Apply search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(certificate =>
        certificate.patient_name.toLowerCase().includes(search) ||
        certificate.certificate_id.toLowerCase().includes(search) ||
        certificate.content.toLowerCase().includes(search) ||
        certificate.diagnosis?.toLowerCase().includes(search)
      );
    }

    // Apply certificate type filter
    if (this.activeFilters.certificateType !== 'all') {
      filtered = filtered.filter(certificate => 
        certificate.certificate_type === this.activeFilters.certificateType
      );
    }

    // Apply date range filter (based on issue date)
    if (this.activeFilters.dateRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter(certificate => {
        const issueDate = new Date(certificate.issue_date);
        
        switch (this.activeFilters.dateRange) {
          case 'today':
            return issueDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 7);
            return issueDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now);
            monthAgo.setMonth(now.getMonth() - 1);
            return issueDate >= monthAgo;
          case 'year':
            const yearAgo = new Date(now);
            yearAgo.setFullYear(now.getFullYear() - 1);
            return issueDate >= yearAgo;
          default:
            return true;
        }
      });
    }

    // Apply patient name filter
    if (this.activeFilters.patientName) {
      filtered = filtered.filter(certificate =>
        certificate.patient_name.toLowerCase().includes(this.activeFilters.patientName.toLowerCase())
      );
    }

    // Apply sorting
    filtered = this.sortCertificates(filtered);

    this.filteredCertificates = filtered;
  }

  sortCertificates(certificates: any[]): any[] {
    return [...certificates].sort((a, b) => {
      switch (this.sortBy) {
        case 'date_desc':
          return new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime();
        case 'date_asc':
          return new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime();
        case 'patient_asc':
          return a.patient_name.localeCompare(b.patient_name);
        case 'patient_desc':
          return b.patient_name.localeCompare(a.patient_name);
        case 'expiry_asc':
          const aExpiry = new Date(a.valid_until).getTime();
          const bExpiry = new Date(b.valid_until).getTime();
          return aExpiry - bExpiry;
        case 'expiry_desc':
          const aExpiryD = new Date(a.valid_until).getTime();
          const bExpiryD = new Date(b.valid_until).getTime();
          return bExpiryD - aExpiryD;
        default:
          return 0;
      }
    });
  }

  clearFilters() {
    this.activeFilters = {
      certificateType: 'all',
      dateRange: 'all',
      status: 'all',
      patientName: ''
    };
    this.searchTerm = '';
    this.sortBy = 'date_desc';
    this.applyFilters();
  }

  searchCertificates(event: any) {
    this.searchTerm = event.target.value.toLowerCase();
    this.applyFilters();
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'list' ? 'grid' : 'list';
  }

  viewCertificate(certificate: any) {
    // In a real app, this would navigate to certificate detail page
    this.showCertificatePreview(certificate);
  }

  async downloadCertificate(certificate: any) {
    const loading = await this.loadingController.create({
      message: 'Generating PDF...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // In real app: await this.prescriptionService.generateCertificatePDF(certificate.id);
      // For now, simulate download
      setTimeout(() => {
        loading.dismiss();
        this.showAlert('Success', `${this.getCertificateTypeLabel(certificate.certificate_type)} PDF downloaded successfully!`);
      }, 1000);
    } catch (error) {
      await loading.dismiss();
      this.showAlert('Error', 'Failed to download certificate');
    }
  }

  async shareCertificate(certificate: any) {
    const alert = await this.alertController.create({
      header: 'Share Certificate',
      subHeader: certificate.certificate_id,
      message: 'Choose how you want to share this certificate:',
      buttons: [
        {
          text: 'WhatsApp',
          handler: () => {
            this.shareViaWhatsApp(certificate);
          }
        },
        {
          text: 'Email',
          handler: () => {
            this.shareViaEmail(certificate);
          }
        },
        {
          text: 'Copy Link',
          handler: () => {
            this.copyCertificateLink(certificate);
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    await alert.present();
  }

  async deleteCertificate(certificate: any) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete ${certificate.certificate_id}? This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Deleting certificate...',
              spinner: 'crescent'
            });
            await loading.present();

            try {
              // In real app: await this.prescriptionService.deleteCertificate(certificate.id);
              this.certificates = this.certificates.filter(c => c.id !== certificate.id);
              this.applyFilters();
              
              await loading.dismiss();
              this.showAlert('Success', 'Certificate deleted successfully.');
            } catch (error) {
              await loading.dismiss();
              this.showAlert('Error', 'Failed to delete certificate.');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  shareViaWhatsApp(certificate: any) {
    const message = `${this.getCertificateTypeLabel(certificate.certificate_type)} ${certificate.certificate_id} for ${certificate.patient_name}. Download link: [Your certificate link]`;
    this.prescriptionService.shareViaWhatsApp(certificate.patient_mobile, message);
  }

  async shareViaEmail(certificate: any) {
    const alert = await this.alertController.create({
      header: 'Share via Email',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'Enter email address',
          value: certificate.patient_email || ''
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
                // In real app: await this.prescriptionService.shareViaEmail(...)
                await loading.dismiss();
                this.showAlert('Success', 'Email sent successfully!');
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

  copyCertificateLink(certificate: any) {
    const link = `https://yourdomain.com/certificates/${certificate.id}`;
    navigator.clipboard.writeText(link).then(() => {
      this.showAlert('Link Copied', 'Certificate link copied to clipboard.');
    });
  }

  async showCertificatePreview(certificate: any) {
    const alert = await this.alertController.create({
      header: `${this.getCertificateTypeLabel(certificate.certificate_type)} - ${certificate.certificate_id}`,
      message: `
        <div class="certificate-preview">
          <p><strong>Patient:</strong> ${certificate.patient_name} (${certificate.patient_age} yrs)</p>
          <p><strong>Issue Date:</strong> ${new Date(certificate.issue_date).toLocaleDateString()}</p>
          <p><strong>Valid Until:</strong> ${new Date(certificate.valid_until).toLocaleDateString()}</p>
          <p><strong>Status:</strong> ${this.getCertificateStatus(certificate)}</p>
          ${certificate.diagnosis ? `<p><strong>Diagnosis:</strong> ${certificate.diagnosis}</p>` : ''}
          <hr>
          <p>${certificate.content}</p>
          ${certificate.recommendations ? `<p><strong>Recommendations:</strong> ${certificate.recommendations}</p>` : ''}
          ${certificate.restrictions ? `<p><strong>Restrictions:</strong> ${certificate.restrictions}</p>` : ''}
        </div>
      `,
      buttons: [
        {
          text: 'Download',
          handler: () => {
            this.downloadCertificate(certificate);
          }
        },
        {
          text: 'Share',
          handler: () => {
            this.shareCertificate(certificate);
          }
        },
        {
          text: 'Close',
          role: 'cancel'
        }
      ]
    });
    await alert.present();
  }

  getFilterCount(): number {
    let count = 0;
    if (this.activeFilters.certificateType !== 'all') count++;
    if (this.activeFilters.dateRange !== 'all') count++;
    if (this.activeFilters.status !== 'all') count++;
    if (this.activeFilters.patientName) count++;
    return count;
  }

  getCertificateTypeLabel(type: string): string {
    return this.certificateTypes.find(t => t.value === type)?.label || type;
  }

  getCertificateIcon(type: string): string {
    return this.certificateTypes.find(t => t.value === type)?.icon || 'document-text-outline';
  }

  getCertificateColor(type: string): string {
    return this.certificateTypes.find(t => t.value === type)?.color || 'medium';
  }

    getDaysRemaining(expiryDate: string | Date): number {
    if (!expiryDate) return 0;
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    
    // Calculate difference in days
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  getCertificateStatus(certificate: any): string {
    const today = new Date();
    const validUntil = new Date(certificate.valid_until);
    
    if (validUntil < today) return 'Expired';
    if (validUntil.toDateString() === today.toDateString()) return 'Expires Today';
    
    const daysUntilExpiry = Math.ceil((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 7) return `Expires in ${daysUntilExpiry} days`;
    
    return 'Valid';
  }

  getStatusColor(status: string): string {
    if (status === 'Expired') return 'danger';
    if (status === 'Expires Today') return 'warning';
    if (status.includes('Expires in')) return 'warning';
    return 'success';
  }

  getCertificateSummary(certificate: any): string {
    const maxLength = 100;
    let summary = certificate.content || '';
    
    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength) + '...';
    }
    
    return summary;
  }

  // Utility method for days remaining
// getDaysRemaining(certificate: any): string {
//   const today = new Date();
//   const validUntil = new Date(certificate.valid_until);
//   const diffTime = validUntil.getTime() - today.getTime();
//   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
//   if (diffDays < 0) return 'Expired';
//   if (diffDays === 0) return 'Today';
//   if (diffDays === 1) return '1 day';
//   return `${diffDays} days`;
// }

  async exportToCSV() {
    const loading = await this.loadingController.create({
      message: 'Preparing export...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const headers = ['ID', 'Type', 'Patient', 'Age', 'Issue Date', 'Valid Until', 'Status', 'Diagnosis'];
      const csvData = this.filteredCertificates.map(c => [
        c.certificate_id,
        this.getCertificateTypeLabel(c.certificate_type),
        c.patient_name,
        c.patient_age,
        new Date(c.issue_date).toLocaleDateString(),
        new Date(c.valid_until).toLocaleDateString(),
        this.getCertificateStatus(c),
        c.diagnosis || 'N/A'
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificates_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      await loading.dismiss();
      this.showAlert('Export Successful', 'Certificates exported to CSV file.');
    } catch (error) {
      await loading.dismiss();
      this.showAlert('Export Failed', 'Failed to export certificates.');
    }
  }

  // Statistics methods
  getCertificateStats() {
    return {
      total: this.certificates.length,
      medical: this.certificates.filter(c => c.certificate_type === 'medical').length,
      fitness: this.certificates.filter(c => c.certificate_type === 'fitness').length,
      valid: this.certificates.filter(c => this.getCertificateStatus(c) === 'Valid').length,
      expiring: this.certificates.filter(c => this.getCertificateStatus(c).includes('Expires')).length,
      expired: this.certificates.filter(c => this.getCertificateStatus(c) === 'Expired').length
    };
  }

  // Mock data generator (remove in production)
  generateMockCertificates(): Promise<any[]> {
    return new Promise((resolve) => {
      const mockData = [];
      const patients = [
        'John Doe', 'Jane Smith', 'Robert Johnson', 'Sarah Williams', 
        'Michael Brown', 'Emily Davis', 'David Wilson', 'Lisa Miller'
      ];
      const medicalContents = [
        'This is to certify that the patient was under my medical care and requires rest.',
        'Medical certificate issued for treatment and recovery period.',
        'Certificate confirming medical treatment and recommended rest.'
      ];
      const fitnessContents = [
        'This is to certify that the individual is medically fit for employment.',
        'Fitness certificate issued for sports participation.',
        'Medical clearance certificate for travel purposes.'
      ];

      for (let i = 1; i <= 20; i++) {
        const isMedical = i % 2 === 0;
        const patientIndex = i % patients.length;
        const issueDate = new Date();
        issueDate.setDate(issueDate.getDate() - Math.floor(Math.random() * 30));
        const validUntil = new Date(issueDate);
        validUntil.setDate(validUntil.getDate() + 7 + Math.floor(Math.random() * 30));
        
        mockData.push({
          id: i,
          certificate_id: `CERT${1000 + i}`,
          certificate_type: isMedical ? 'medical' : 'fitness',
          patient_name: patients[patientIndex],
          patient_age: 20 + Math.floor(Math.random() * 50),
          patient_mobile: `98765${10000 + i}`,
          patient_email: `patient${i}@example.com`,
          content: isMedical ? 
            medicalContents[patientIndex % medicalContents.length] : 
            fitnessContents[patientIndex % fitnessContents.length],
          diagnosis: isMedical ? ['Fever', 'Migraine', 'Back Pain', 'Injury'][patientIndex % 4] : null,
          recommendations: isMedical ? 'Take rest and follow medication' : 'No restrictions',
          restrictions: isMedical ? 'Avoid strenuous activities' : 'None',
          issue_date: issueDate.toISOString(),
          valid_until: validUntil.toISOString(),
          doctor_name: 'Dr. Sharma'
        });
      }

      resolve(mockData);
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