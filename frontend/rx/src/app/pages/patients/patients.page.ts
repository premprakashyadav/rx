import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { PrescriptionService } from '../../services/prescription.service';
import { AddPatientModalComponent } from '../../components/add-patient-modal/add-patient-modal.component';

@Component({
  selector: 'app-patients',
  templateUrl: './patients.page.html',
  styleUrls: ['./patients.page.scss'],
})
export class PatientsPage implements OnInit {
  patients: any[] = [];
  filteredPatients: any[] = [];
  searchTerm: string = '';
  isLoading = true;
  viewMode: 'grid' | 'list' = 'list';
  
  // Filter options
  filters = {
    ageRange: 'all',
    sex: 'all',
    hasMobile: 'all'
  };

  constructor(
    private prescriptionService: PrescriptionService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private modalController: ModalController,
    private fb: FormBuilder
  ) {}

  async ngOnInit() {
    await this.loadPatients();
  }

  async loadPatients() {
    this.isLoading = true;
    try {
      this.patients = await this.prescriptionService.getPatients();
      this.applyFilters();
    } catch (error) {
      console.error('Error loading patients:', error);
      this.showAlert('Error', 'Failed to load patients. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  async refreshData(event: any) {
    await this.loadPatients();
    event.target.complete();
  }

  async addPatient() {
    const modal = await this.modalController.create({
      component: AddPatientModalComponent,
      componentProps: {},
      cssClass: 'add-patient-modal'
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data && result.data.success) {
        await this.loadPatients();
      }
    });

    await modal.present();
  }

  async editPatient(patient: any) {
    const modal = await this.modalController.create({
      component: AddPatientModalComponent,
      componentProps: { patient },
      cssClass: 'add-patient-modal'
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data && result.data.success) {
        await this.loadPatients();
      }
    });

    await modal.present();
  }

  async deletePatient(patient: any) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete ${patient.full_name}? This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: async () => {
            // In a real app, you would call an API to delete
            // For now, we'll just remove from the array
            this.patients = this.patients.filter(p => p.id !== patient.id);
            this.applyFilters();
            this.showAlert('Success', 'Patient deleted successfully.');
          }
        }
      ]
    });
    await alert.present();
  }

  viewPatient(patient: any) {
    this.router.navigate(['/patient-detail', patient.patient_id], {
      state: { patient }
    });
  }

  createPrescriptionForPatient(patient: any) {
    this.router.navigate(['/create-prescription'], {
      state: { patient }
    });
  }

  searchPatients(event: any) {
    this.searchTerm = event.target.value.toLowerCase();
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.patients];

    // Apply search filter
    if (this.searchTerm) {
      filtered = filtered.filter(patient =>
        patient.full_name.toLowerCase().includes(this.searchTerm) ||
        patient.mobile?.toLowerCase().includes(this.searchTerm) ||
        patient.patient_id?.toLowerCase().includes(this.searchTerm)
      );
    }

    // Apply age filter
    if (this.filters.ageRange !== 'all') {
      filtered = filtered.filter(patient => {
        const age = patient.age || 0;
        switch (this.filters.ageRange) {
          case 'child': return age <= 12;
          case 'teen': return age > 12 && age <= 19;
          case 'adult': return age > 19 && age <= 60;
          case 'senior': return age > 60;
          default: return true;
        }
      });
    }

    // Apply sex filter
    if (this.filters.sex !== 'all') {
      filtered = filtered.filter(patient => patient.sex === this.filters.sex);
    }

    // Apply mobile filter
    if (this.filters.hasMobile !== 'all') {
      filtered = filtered.filter(patient => {
        const hasMobile = patient.mobile && patient.mobile.trim() !== '';
        return this.filters.hasMobile === 'hasMobile' ? hasMobile : !hasMobile;
      });
    }

    this.filteredPatients = filtered;
  }

  clearFilters() {
    this.filters = {
      ageRange: 'all',
      sex: 'all',
      hasMobile: 'all'
    };
    this.searchTerm = '';
    this.applyFilters();
  }

  getAgeGroup(age: number): string {
    if (age <= 12) return 'Child';
    if (age <= 19) return 'Teen';
    if (age <= 60) return 'Adult';
    return 'Senior';
  }

  getPatientInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  // Helper methods for statistics
  getMaleCount(): number {
    return this.patients.filter(p => p.sex === 'male').length;
  }

  getFemaleCount(): number {
    return this.patients.filter(p => p.sex === 'female').length;
  }

  getActivePatientCount(): number {
    return this.patients.filter(p => p.prescription_count > 0).length;
  }

  getAvatarColor(patient: any): string {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#fee140'];
    const index = patient.patient_id?.charCodeAt(0) || 0;
    return colors[index % colors.length];
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'list' ? 'grid' : 'list';
  }

  async exportPatients() {
    const loading = await this.loadingController.create({
      message: 'Preparing export...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Create CSV content
      const headers = ['Patient ID', 'Name', 'Age', 'Sex', 'Mobile', 'Email', 'Last Visit', 'Total Visits'];
      const csvData = this.filteredPatients.map(patient => [
        patient.patient_id || 'N/A',
        patient.full_name,
        patient.age || 'N/A',
        patient.sex || 'N/A',
        patient.mobile || 'N/A',
        patient.email || 'N/A',
        patient.last_visit ? new Date(patient.last_visit).toLocaleDateString() : 'Never',
        patient.prescription_count || '0'
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `patients_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      await loading.dismiss();
      this.showAlert('Export Successful', 'Patient data has been exported to CSV.');
    } catch (error) {
      await loading.dismiss();
      this.showAlert('Export Failed', 'Failed to export patient data. Please try again.');
    }
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