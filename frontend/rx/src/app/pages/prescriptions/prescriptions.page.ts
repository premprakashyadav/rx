import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { PrescriptionService } from '../../services/prescription.service';
import { FilterPrescriptionsModalComponent } from '../../components/filter-prescriptions-modal/filter-prescriptions-modal.component';

@Component({
  selector: 'app-prescriptions',
  templateUrl: './prescriptions.page.html',
  styleUrls: ['./prescriptions.page.scss'],
})
export class PrescriptionsPage implements OnInit {
  prescriptions: any[] = [];
  filteredPrescriptions: any[] = [];
  isLoading = true;
  searchTerm: string = '';
  viewMode: 'list' | 'grid' = 'list';
  
  // Filter state
  activeFilters = {
    dateRange: 'all',
    status: 'all',
    patientName: '',
    doctorName: ''
  };
  
  // Date ranges for quick filter
  dateRanges = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'all', label: 'All Time' }
  ];
  
  // Sort options
  sortBy = 'date_desc';
  sortOptions = [
    { value: 'date_desc', label: 'Newest First' },
    { value: 'date_asc', label: 'Oldest First' },
    { value: 'patient_asc', label: 'Patient Name (A-Z)' },
    { value: 'patient_desc', label: 'Patient Name (Z-A)' }
  ];

  constructor(
    private prescriptionService: PrescriptionService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private modalController: ModalController
  ) {}

  async ngOnInit() {
    await this.loadPrescriptions();
  }

  async loadPrescriptions() {
    this.isLoading = true;
    try {
      // In a real app, this would be an API call
      // For now, we'll simulate with mock data
      this.prescriptions = await this.generateMockPrescriptions();
      this.applyFilters();
    } catch (error) {
      console.error('Error loading prescriptions:', error);
      this.showAlert('Error', 'Failed to load prescriptions. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  async refreshData(event: any) {
    await this.loadPrescriptions();
    event.target.complete();
  }

  async openFilters() {
    const modal = await this.modalController.create({
      component: FilterPrescriptionsModalComponent,
      componentProps: {
        activeFilters: this.activeFilters
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
    let filtered = [...this.prescriptions];

    // Apply search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(prescription =>
        prescription.patient_name.toLowerCase().includes(search) ||
        prescription.prescription_id.toLowerCase().includes(search) ||
        prescription.chief_complaint.toLowerCase().includes(search) ||
        prescription.diagnosis?.toLowerCase().includes(search)
      );
    }

    // Apply date range filter
    if (this.activeFilters.dateRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter(prescription => {
        const prescriptionDate = new Date(prescription.created_at);
        
        switch (this.activeFilters.dateRange) {
          case 'today':
            return prescriptionDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 7);
            return prescriptionDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now);
            monthAgo.setMonth(now.getMonth() - 1);
            return prescriptionDate >= monthAgo;
          case 'year':
            const yearAgo = new Date(now);
            yearAgo.setFullYear(now.getFullYear() - 1);
            return prescriptionDate >= yearAgo;
          default:
            return true;
        }
      });
    }

    // Apply patient name filter
    if (this.activeFilters.patientName) {
      filtered = filtered.filter(prescription =>
        prescription.patient_name.toLowerCase().includes(this.activeFilters.patientName.toLowerCase())
      );
    }

    // Apply doctor name filter
    if (this.activeFilters.doctorName) {
      filtered = filtered.filter(prescription =>
        prescription.doctor_name.toLowerCase().includes(this.activeFilters.doctorName.toLowerCase())
      );
    }

    // Apply sorting
    filtered = this.sortPrescriptions(filtered);

    this.filteredPrescriptions = filtered;
  }

  sortPrescriptions(prescriptions: any[]): any[] {
    return [...prescriptions].sort((a, b) => {
      switch (this.sortBy) {
        case 'date_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'patient_asc':
          return a.patient_name.localeCompare(b.patient_name);
        case 'patient_desc':
          return b.patient_name.localeCompare(a.patient_name);
        default:
          return 0;
      }
    });
  }

  clearFilters() {
    this.activeFilters = {
      dateRange: 'all',
      status: 'all',
      patientName: '',
      doctorName: ''
    };
    this.searchTerm = '';
    this.sortBy = 'date_desc';
    this.applyFilters();
  }

  searchPrescriptions(event: any) {
    this.searchTerm = event.target.value.toLowerCase();
    this.applyFilters();
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'list' ? 'grid' : 'list';
  }

  viewPrescription(prescription: any) {
    this.router.navigate(['/prescription-detail', prescription.id]);
  }

  async downloadPrescription(prescription: any) {
    const loading = await this.loadingController.create({
      message: 'Generating PDF...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // In real app: await this.prescriptionService.generatePrescriptionPDF(prescription.id);
      // For now, simulate download
      setTimeout(() => {
        loading.dismiss();
        this.showAlert('Success', 'Prescription PDF downloaded successfully!');
      }, 1000);
    } catch (error) {
      await loading.dismiss();
      this.showAlert('Error', 'Failed to download prescription');
    }
  }

  async sharePrescription(prescription: any) {
    const alert = await this.alertController.create({
      header: 'Share Prescription',
      subHeader: prescription.prescription_id,
      message: 'Choose how you want to share this prescription:',
      buttons: [
        {
          text: 'WhatsApp',
          handler: () => {
            this.shareViaWhatsApp(prescription);
          }
        },
        {
          text: 'Email',
          handler: () => {
            this.shareViaEmail(prescription);
          }
        },
        {
          text: 'Copy Link',
          handler: () => {
            this.copyPrescriptionLink(prescription);
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

  async deletePrescription(prescription: any) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete prescription ${prescription.prescription_id}? This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Deleting prescription...',
              spinner: 'crescent'
            });
            await loading.present();

            try {
              // In real app: await this.prescriptionService.deletePrescription(prescription.id);
              this.prescriptions = this.prescriptions.filter(p => p.id !== prescription.id);
              this.applyFilters();
              
              await loading.dismiss();
              this.showAlert('Success', 'Prescription deleted successfully.');
            } catch (error) {
              await loading.dismiss();
              this.showAlert('Error', 'Failed to delete prescription.');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  shareViaWhatsApp(prescription: any) {
    const message = `Prescription ${prescription.prescription_id} for ${prescription.patient_name}. Download link: [Your prescription link]`;
    this.prescriptionService.shareViaWhatsApp(prescription.patient_mobile, message);
  }

  async shareViaEmail(prescription: any) {
    const alert = await this.alertController.create({
      header: 'Share via Email',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'Enter email address',
          value: prescription.patient_email || ''
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

  copyPrescriptionLink(prescription: any) {
    const link = `https://yourdomain.com/prescriptions/${prescription.id}`;
    navigator.clipboard.writeText(link).then(() => {
      this.showAlert('Link Copied', 'Prescription link copied to clipboard.');
    });
  }

  getFilterCount(): number {
    let count = 0;
    if (this.activeFilters.dateRange !== 'all') count++;
    if (this.activeFilters.status !== 'all') count++;
    if (this.activeFilters.patientName) count++;
    if (this.activeFilters.doctorName) count++;
    return count;
  }

  getPrescriptionStatus(prescription: any): string {
    const followUpDate = new Date(prescription.follow_up_date);
    const today = new Date();
    
    if (followUpDate < today) return 'overdue';
    if (followUpDate.toDateString() === today.toDateString()) return 'today';
    return 'upcoming';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'overdue': return 'danger';
      case 'today': return 'warning';
      case 'upcoming': return 'success';
      default: return 'medium';
    }
  }

  // Helper methods for statistics cards
  getUpcomingCount(): number {
    return this.prescriptions.filter(p => this.getPrescriptionStatus(p) === 'upcoming').length;
  }

  getTodayCount(): number {
    return this.prescriptions.filter(p => this.getPrescriptionStatus(p) === 'today').length;
  }

  getOverdueCount(): number {
    return this.prescriptions.filter(p => this.getPrescriptionStatus(p) === 'overdue').length;
  }

  async exportToCSV() {
    const loading = await this.loadingController.create({
      message: 'Preparing export...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const headers = ['ID', 'Patient', 'Age', 'Date', 'Complaint', 'Diagnosis', 'Follow-up', 'Status'];
      const csvData = this.filteredPrescriptions.map(p => [
        p.prescription_id,
        p.patient_name,
        p.patient_age,
        new Date(p.created_at).toLocaleDateString(),
        p.chief_complaint?.substring(0, 50) || '',
        p.diagnosis?.substring(0, 50) || '',
        p.follow_up_date ? new Date(p.follow_up_date).toLocaleDateString() : 'Not set',
        this.getPrescriptionStatus(p)
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prescriptions_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      await loading.dismiss();
      this.showAlert('Export Successful', 'Prescriptions exported to CSV file.');
    } catch (error) {
      await loading.dismiss();
      this.showAlert('Export Failed', 'Failed to export prescriptions.');
    }
  }

  // Mock data generator (remove in production)
  generateMockPrescriptions(): Promise<any[]> {
    return new Promise((resolve) => {
      const mockData = [];
      const patients = [
        'John Doe', 'Jane Smith', 'Robert Johnson', 'Sarah Williams', 
        'Michael Brown', 'Emily Davis', 'David Wilson', 'Lisa Miller'
      ];
      const complaints = [
        'Fever and cough', 'Headache', 'Stomach pain', 'Back pain',
        'Sore throat', 'Skin rash', 'Joint pain', 'Fatigue'
      ];
      const diagnoses = [
        'Upper Respiratory Infection', 'Migraine', 'Gastritis', 'Muscle Strain',
        'Pharyngitis', 'Allergic Dermatitis', 'Arthritis', 'Anemia'
      ];

      for (let i = 1; i <= 25; i++) {
        const patientIndex = i % patients.length;
        const complaintIndex = i % complaints.length;
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));
        
        mockData.push({
          id: i,
          prescription_id: `RX${1000 + i}`,
          patient_name: patients[patientIndex],
          patient_age: 20 + Math.floor(Math.random() * 50),
          patient_mobile: `98765${10000 + i}`,
          patient_email: `patient${i}@example.com`,
          chief_complaint: complaints[complaintIndex],
          diagnosis: diagnoses[complaintIndex],
          medicines_count: 1 + Math.floor(Math.random() * 5),
          created_at: date.toISOString(),
          follow_up_date: new Date(date.getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString(),
          doctor_name: 'Dr. Sharma',
          consultation_fee: 500 + Math.floor(Math.random() * 500)
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