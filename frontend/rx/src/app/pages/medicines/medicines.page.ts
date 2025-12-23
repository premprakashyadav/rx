import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { PrescriptionService } from '../../services/prescription.service';
import { AddEditMedicineModalComponent } from '../../components/add-edit-medicine-modal/add-edit-medicine-modal.component';
import { ImportMedicinesModalComponent } from '../../components/import-medicines-modal/import-medicines-modal.component';

@Component({
  selector: 'app-medicines',
  templateUrl: './medicines.page.html',
  styleUrls: ['./medicines.page.scss'],
})
export class MedicinesPage implements OnInit {
  Math = Math; // Make Math available in template
  medicines: any[] = [];
  filteredMedicines: any[] = [];
  isLoading = true;
  searchTerm: string = '';
  viewMode: 'list' | 'grid' = 'list';
  
  // Filter state
  activeFilters = {
    form: 'all',
    schedule: 'all',
    manufacturer: 'all',
    status: 'all'
  };
  
  // Filter options
  medicineForms: string[] = [];
  schedules: string[] = [];
  manufacturers: string[] = [];
  
  // Sort options
  sortBy = 'name_asc';
  sortOptions = [
    { value: 'name_asc', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' },
    { value: 'generic_asc', label: 'Generic Name (A-Z)' },
    { value: 'brand_asc', label: 'Brand (A-Z)' },
    { value: 'recent', label: 'Recently Added' },
    { value: 'frequently_used', label: 'Frequently Used' }
  ];
  
  // Statistics
  stats = {
    total: 0,
    active: 0,
    schedule_h: 0,
    schedule_x: 0,
    otc: 0
  };

  constructor(
    private prescriptionService: PrescriptionService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private modalController: ModalController,
    private fb: FormBuilder
  ) {}

  async ngOnInit() {
    await this.loadMedicines();
  }

  async loadMedicines() {
    this.isLoading = true;
    try {
      // In a real app, this would be an API call
      this.medicines = await this.generateMockMedicines();
      this.extractFilterOptions();
      this.calculateStats();
      this.applyFilters();
    } catch (error) {
      console.error('Error loading medicines:', error);
      this.showAlert('Error', 'Failed to load medicines. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  async refreshData(event: any) {
    await this.loadMedicines();
    event.target.complete();
  }

  extractFilterOptions() {
    // Extract unique forms
    this.medicineForms = [...new Set(this.medicines
      .filter(m => m.form)
      .map(m => m.form)
      .sort())];
    
    // Extract unique schedules
    this.schedules = [...new Set(this.medicines
      .filter(m => m.schedule)
      .map(m => m.schedule)
      .sort())];
    
    // Extract unique manufacturers
    this.manufacturers = [...new Set(this.medicines
      .filter(m => m.manufacturer)
      .map(m => m.manufacturer)
      .sort())];
  }

  calculateStats() {
    this.stats = {
      total: this.medicines.length,
      active: this.medicines.filter(m => m.is_active).length,
      schedule_h: this.medicines.filter(m => m.schedule === 'H' || m.schedule === 'H1').length,
      schedule_x: this.medicines.filter(m => m.schedule === 'X').length,
      otc: this.medicines.filter(m => !m.schedule || m.schedule === 'OTC').length
    };
  }

  applyFilters() {
    let filtered = [...this.medicines];

    // Apply search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(medicine =>
        medicine.name.toLowerCase().includes(search) ||
        medicine.generic_name?.toLowerCase().includes(search) ||
        medicine.brand?.toLowerCase().includes(search) ||
        medicine.manufacturer?.toLowerCase().includes(search)
      );
    }

    // Apply form filter
    if (this.activeFilters.form !== 'all') {
      filtered = filtered.filter(medicine => medicine.form === this.activeFilters.form);
    }

    // Apply schedule filter
    if (this.activeFilters.schedule !== 'all') {
      filtered = filtered.filter(medicine => medicine.schedule === this.activeFilters.schedule);
    }

    // Apply manufacturer filter
    if (this.activeFilters.manufacturer !== 'all') {
      filtered = filtered.filter(medicine => medicine.manufacturer === this.activeFilters.manufacturer);
    }

    // Apply status filter
    if (this.activeFilters.status !== 'all') {
      const isActive = this.activeFilters.status === 'active';
      filtered = filtered.filter(medicine => medicine.is_active === isActive);
    }

    // Apply sorting
    filtered = this.sortMedicines(filtered);

    this.filteredMedicines = filtered;
  }

  sortMedicines(medicines: any[]): any[] {
    return [...medicines].sort((a, b) => {
      switch (this.sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'generic_asc':
          return (a.generic_name || '').localeCompare(b.generic_name || '');
        case 'brand_asc':
          return (a.brand || '').localeCompare(b.brand || '');
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'frequently_used':
          return (b.usage_count || 0) - (a.usage_count || 0);
        default:
          return 0;
      }
    });
  }

  async addMedicine() {
    const modal = await this.modalController.create({
      component: AddEditMedicineModalComponent,
      componentProps: {
        mode: 'add'
      },
      cssClass: 'medicine-modal'
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data && result.data.success) {
        await this.loadMedicines();
      }
    });

    await modal.present();
  }

  async editMedicine(medicine: any) {
    const modal = await this.modalController.create({
      component: AddEditMedicineModalComponent,
      componentProps: {
        mode: 'edit',
        medicine: medicine
      },
      cssClass: 'medicine-modal'
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data && result.data.success) {
        await this.loadMedicines();
      }
    });

    await modal.present();
  }

  async toggleMedicineStatus(medicine: any) {
    const newStatus = !medicine.is_active;
    const action = newStatus ? 'activate' : 'deactivate';
    
    const alert = await this.alertController.create({
      header: 'Confirm Status Change',
      message: `Are you sure you want to ${action} ${medicine.name}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Confirm',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Updating medicine...',
              spinner: 'crescent'
            });
            await loading.present();

            try {
              // In real app: await this.prescriptionService.updateMedicineStatus(medicine.id, newStatus);
              medicine.is_active = newStatus;
              this.calculateStats();
              this.applyFilters();
              
              await loading.dismiss();
              this.showAlert('Success', `Medicine ${action}d successfully.`);
            } catch (error) {
              await loading.dismiss();
              this.showAlert('Error', 'Failed to update medicine status.');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async deleteMedicine(medicine: any) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete ${medicine.name}? This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Deleting medicine...',
              spinner: 'crescent'
            });
            await loading.present();

            try {
              // In real app: await this.prescriptionService.deleteMedicine(medicine.id);
              this.medicines = this.medicines.filter(m => m.id !== medicine.id);
              this.calculateStats();
              this.applyFilters();
              
              await loading.dismiss();
              this.showAlert('Success', 'Medicine deleted successfully.');
            } catch (error) {
              await loading.dismiss();
              this.showAlert('Error', 'Failed to delete medicine.');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async searchExternalMedicines() {
    const alert = await this.alertController.create({
      header: 'Search External Database',
      inputs: [
        {
          name: 'searchTerm',
          type: 'text',
          placeholder: 'Enter medicine name'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Search',
          handler: async (data) => {
            if (data.searchTerm) {
              const loading = await this.loadingController.create({
                message: 'Searching external database...',
                spinner: 'crescent'
              });
              await loading.present();

              try {
                const results = await this.prescriptionService.searchExternalMedicines(data.searchTerm);
                await loading.dismiss();
                await this.showExternalSearchResults(results);
              } catch (error) {
                await loading.dismiss();
                this.showAlert('Error', 'Failed to search external database.');
              }
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async showExternalSearchResults(results: any[]) {
    if (results.length === 0) {
      this.showAlert('No Results', 'No medicines found in external database.');
      return;
    }

    const alert = await this.alertController.create({
      header: 'External Medicines Found',
      message: `Found ${results.length} medicines. Select medicines to import:`,
      inputs: results.map((medicine, index) => ({
        type: 'checkbox',
        label: `${medicine.name}${medicine.generic_name ? ` (${medicine.generic_name})` : ''}`,
        value: medicine,
        checked: false
      })),
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Import Selected',
          handler: async (selectedMedicines) => {
            if (selectedMedicines && selectedMedicines.length > 0) {
              await this.importMedicines(selectedMedicines);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async importMedicines(medicines: any[]) {
    const loading = await this.loadingController.create({
      message: `Importing ${medicines.length} medicines...`,
      spinner: 'crescent'
    });
    await loading.present();

    try {
      let importedCount = 0;
      for (const medicine of medicines) {
        try {
          await this.prescriptionService.addMedicine(medicine);
          importedCount++;
        } catch (error) {
          console.error('Failed to import medicine:', medicine.name, error);
        }
      }
      
      await loading.dismiss();
      await this.loadMedicines();
      this.showAlert('Import Complete', `Successfully imported ${importedCount} out of ${medicines.length} medicines.`);
    } catch (error) {
      await loading.dismiss();
      this.showAlert('Import Error', 'Failed to import medicines.');
    }
  }

  async bulkImportMedicines() {
    const modal = await this.modalController.create({
      component: ImportMedicinesModalComponent,
      cssClass: 'import-modal'
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data && result.data.success) {
        await this.loadMedicines();
      }
    });

    await modal.present();
  }

  async exportMedicines() {
    const loading = await this.loadingController.create({
      message: 'Preparing export...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const headers = ['Name', 'Generic Name', 'Brand', 'Strength', 'Form', 'Manufacturer', 'Schedule', 'Status'];
      const csvData = this.filteredMedicines.map(medicine => [
        medicine.name,
        medicine.generic_name || '',
        medicine.brand || '',
        medicine.strength || '',
        medicine.form || '',
        medicine.manufacturer || '',
        medicine.schedule || '',
        medicine.is_active ? 'Active' : 'Inactive'
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `medicines_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      await loading.dismiss();
      this.showAlert('Export Successful', 'Medicines exported to CSV file.');
    } catch (error) {
      await loading.dismiss();
      this.showAlert('Export Failed', 'Failed to export medicines.');
    }
  }

  clearFilters() {
    this.activeFilters = {
      form: 'all',
      schedule: 'all',
      manufacturer: 'all',
      status: 'all'
    };
    this.searchTerm = '';
    this.sortBy = 'name_asc';
    this.applyFilters();
  }

  searchMedicines(event: any) {
    this.searchTerm = event.target.value.toLowerCase();
    this.applyFilters();
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'list' ? 'grid' : 'list';
  }

  getFilterCount(): number {
    let count = 0;
    if (this.activeFilters.form !== 'all') count++;
    if (this.activeFilters.schedule !== 'all') count++;
    if (this.activeFilters.manufacturer !== 'all') count++;
    if (this.activeFilters.status !== 'all') count++;
    return count;
  }

  getMedicineFormIcon(form: string): string {
    const formIcons: {[key: string]: string} = {
      'Tablet': 'tablet-portrait-outline',
      'Capsule': 'ellipse-outline',
      'Syrup': 'water-outline',
      'Injection': 'medical-outline',
      'Ointment': 'color-palette-outline',
      'Cream': 'color-wand-outline',
      'Drop': 'eyedrop-outline',
      'Inhaler': 'cloud-outline',
      'Powder': 'flask-outline',
      'Suspension': 'beaker-outline'
    };
    return formIcons[form] || 'medical-outline';
  }

  getScheduleColor(schedule: string): string {
    const scheduleColors: {[key: string]: string} = {
      'H': 'danger',
      'H1': 'warning',
      'X': 'danger',
      'OTC': 'success',
      '': 'medium'
    };
    return scheduleColors[schedule] || 'medium';
  }

  getScheduleLabel(schedule: string): string {
    const scheduleLabels: {[key: string]: string} = {
      'H': 'Schedule H',
      'H1': 'Schedule H1',
      'X': 'Schedule X',
      'OTC': 'Over-the-Counter',
      '': 'Not Specified'
    };
    return scheduleLabels[schedule] || schedule;
  }

  // Mock data generator (remove in production)
  generateMockMedicines(): Promise<any[]> {
    return new Promise((resolve) => {
      const mockData = [];
      const forms = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Cream', 'Drop'];
      const schedules = ['H', 'H1', 'X', 'OTC', ''];
      const manufacturers = ['Sun Pharma', 'Cipla', 'Dr. Reddy\'s', 'GlaxoSmithKline', 'Pfizer', 'Novartis', 'Abbott'];
      
      const commonMedicines = [
        { name: 'Paracetamol', generic: 'Paracetamol', brand: 'Crocin', strength: '500mg' },
        { name: 'Ibuprofen', generic: 'Ibuprofen', brand: 'Brufen', strength: '400mg' },
        { name: 'Amoxicillin', generic: 'Amoxicillin', brand: 'Mox', strength: '500mg' },
        { name: 'Cetirizine', generic: 'Cetirizine', brand: 'Alatrol', strength: '10mg' },
        { name: 'Omeprazole', generic: 'Omeprazole', brand: 'Omez', strength: '20mg' },
        { name: 'Atorvastatin', generic: 'Atorvastatin', brand: 'Atorva', strength: '10mg' },
        { name: 'Metformin', generic: 'Metformin', brand: 'Glycomet', strength: '500mg' },
        { name: 'Losartan', generic: 'Losartan', brand: 'Losar', strength: '50mg' },
        { name: 'Levothyroxine', generic: 'Levothyroxine', brand: 'Thyronorm', strength: '50mcg' },
        { name: 'Ambroxol', generic: 'Ambroxol', brand: 'Mucolite', strength: '30mg' }
      ];

      for (let i = 0; i < commonMedicines.length; i++) {
        const med = commonMedicines[i];
        const formIndex = i % forms.length;
        const scheduleIndex = i % schedules.length;
        const manufacturerIndex = i % manufacturers.length;
        
        mockData.push({
          id: i + 1,
          name: med.name,
          generic_name: med.generic,
          brand: med.brand,
          strength: med.strength,
          form: forms[formIndex],
          manufacturer: manufacturers[manufacturerIndex],
          schedule: schedules[scheduleIndex],
          is_active: true,
          usage_count: Math.floor(Math.random() * 100),
          created_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 1
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