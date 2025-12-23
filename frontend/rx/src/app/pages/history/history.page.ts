import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { PrescriptionService } from '../../services/prescription.service';
import { AddHistoryEntryModalComponent } from '../../components/add-history-entry-modal/add-history-entry-modal.component';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
})
export class HistoryPage implements OnInit {
    getInitials(name: string): string {
      if (!name) return '';
      return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }

    getBarHeight(value: number, data: number[]): string {
      if (!data || data.length === 0) return '0%';
      const max = Math.max(...data);
      if (max === 0) return '0%';
      return ((value / max) * 100) + '%';
    }
  Math = Math;
  patientId: string = '';
  patient: any = null;
  history: any[] = [];
  filteredHistory: any[] = [];
  isLoading = true;
  searchTerm: string = '';
  
  // Filter state
  activeFilters = {
    dateRange: 'all',
    visitType: 'all',
    diagnosis: '',
    doctor: ''
  };
  
  // Date ranges for quick filter
  dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ];
  
  // Visit types
  visitTypes: string[] = [];
  
  // Statistics
  stats = {
    totalVisits: 0,
    thisMonth: 0,
    lastMonth: 0,
    prescriptions: 0,
    certificates: 0
  };
  
  // Timeline view
  timelineView = true;
  
  // Chart data
  chartData: any = null;
  showChart = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private prescriptionService: PrescriptionService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private modalController: ModalController
  ) {}

  async ngOnInit() {
    this.route.params.subscribe(async params => {
      this.patientId = params['patientId'];
      if (this.patientId) {
        await this.loadPatientData();
        await this.loadHistory();
      }
    });
  }

  async loadPatientData() {
    try {
      // In a real app, this would be an API call
      this.patient = await this.generateMockPatient();
    } catch (error) {
      console.error('Error loading patient data:', error);
    }
  }

  async loadHistory() {
    this.isLoading = true;
    try {
      // In a real app, this would be an API call
      this.history = await this.generateMockHistory();
      this.extractFilterOptions();
      this.calculateStats();
      this.prepareChartData();
      this.applyFilters();
    } catch (error) {
      console.error('Error loading history:', error);
      this.showAlert('Error', 'Failed to load patient history. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  async refreshData(event: any) {
    await this.loadHistory();
    event.target.complete();
  }

  extractFilterOptions() {
    // Extract unique visit types
    this.visitTypes = [...new Set(this.history
      .filter(h => h.visit_type)
      .map(h => h.visit_type)
      .sort())];
  }

  calculateStats() {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    this.stats = {
      totalVisits: this.history.length,
      thisMonth: this.history.filter(h => {
        const date = new Date(h.visit_date);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
      }).length,
      lastMonth: this.history.filter(h => {
        const date = new Date(h.visit_date);
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
      }).length,
      prescriptions: this.history.filter(h => h.prescription_id).length,
      certificates: this.history.filter(h => h.certificate_id).length
    };
  }

  prepareChartData() {
    // Group visits by month for chart
    const visitsByMonth: { [key: string]: number } = {};
    
    this.history.forEach(entry => {
      const date = new Date(entry.visit_date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      visitsByMonth[monthKey] = (visitsByMonth[monthKey] || 0) + 1;
    });
    
    // Convert to chart data format
    const sortedMonths = Object.keys(visitsByMonth).sort();
    const labels = sortedMonths.map(month => {
      const [year, monthNum] = month.split('-');
      return `${this.getMonthName(parseInt(monthNum))} ${year}`;
    });
    
    const data = sortedMonths.map(month => visitsByMonth[month]);
    
    this.chartData = {
      labels: labels,
      datasets: [{
        label: 'Visits per Month',
        data: data,
        backgroundColor: 'rgba(var(--ion-color-primary-rgb), 0.2)',
        borderColor: 'var(--ion-color-primary)',
        borderWidth: 2,
        tension: 0.4
      }]
    };
  }

  applyFilters() {
    let filtered = [...this.history];

    // Apply search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.symptoms?.toLowerCase().includes(search) ||
        entry.diagnosis?.toLowerCase().includes(search) ||
        entry.treatment?.toLowerCase().includes(search) ||
        entry.doctor_name?.toLowerCase().includes(search)
      );
    }

    // Apply date range filter
    if (this.activeFilters.dateRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter(entry => {
        const visitDate = new Date(entry.visit_date);
        
        switch (this.activeFilters.dateRange) {
          case 'today':
            return visitDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 7);
            return visitDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now);
            monthAgo.setMonth(now.getMonth() - 1);
            return visitDate >= monthAgo;
          case 'year':
            const yearAgo = new Date(now);
            yearAgo.setFullYear(now.getFullYear() - 1);
            return visitDate >= yearAgo;
          default:
            return true;
        }
      });
    }

    // Apply visit type filter
    if (this.activeFilters.visitType !== 'all') {
      filtered = filtered.filter(entry => entry.visit_type === this.activeFilters.visitType);
    }

    // Apply diagnosis filter
    if (this.activeFilters.diagnosis) {
      filtered = filtered.filter(entry =>
        entry.diagnosis?.toLowerCase().includes(this.activeFilters.diagnosis.toLowerCase())
      );
    }

    // Apply doctor filter
    if (this.activeFilters.doctor) {
      filtered = filtered.filter(entry =>
        entry.doctor_name?.toLowerCase().includes(this.activeFilters.doctor.toLowerCase())
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());

    this.filteredHistory = filtered;
  }

  clearFilters() {
    this.activeFilters = {
      dateRange: 'all',
      visitType: 'all',
      diagnosis: '',
      doctor: ''
    };
    this.searchTerm = '';
    this.applyFilters();
  }

  searchHistory(event: any) {
    this.searchTerm = event.target.value.toLowerCase();
    this.applyFilters();
  }

  toggleView() {
    this.timelineView = !this.timelineView;
  }

  toggleChart() {
    this.showChart = !this.showChart;
  }

  async addHistoryEntry() {
    const modal = await this.modalController.create({
      component: AddHistoryEntryModalComponent,
      componentProps: {
        patientId: this.patientId,
        patientName: this.patient?.full_name
      },
      cssClass: 'add-history-modal'
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data && result.data.success) {
        await this.loadHistory();
      }
    });

    await modal.present();
  }

  async editHistoryEntry(entry: any) {
    const modal = await this.modalController.create({
      component: AddHistoryEntryModalComponent,
      componentProps: {
        patientId: this.patientId,
        patientName: this.patient?.full_name,
        entry: entry,
        mode: 'edit'
      },
      cssClass: 'add-history-modal'
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data && result.data.success) {
        await this.loadHistory();
      }
    });

    await modal.present();
  }

  async deleteHistoryEntry(entry: any) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete this history entry from ${new Date(entry.visit_date).toLocaleDateString()}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Deleting history entry...',
              spinner: 'crescent'
            });
            await loading.present();

            try {
              // In real app: await this.prescriptionService.deleteHistoryEntry(entry.id);
              this.history = this.history.filter(h => h.id !== entry.id);
              this.calculateStats();
              this.prepareChartData();
              this.applyFilters();
              
              await loading.dismiss();
              this.showAlert('Success', 'History entry deleted successfully.');
            } catch (error) {
              await loading.dismiss();
              this.showAlert('Error', 'Failed to delete history entry.');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  viewPrescription(entry: any) {
    if (entry.prescription_id) {
      // In real app: this.router.navigate(['/prescription-detail', entry.prescription_id]);
      this.showAlert('Prescription', `Would view prescription ${entry.prescription_id}`);
    }
  }

  viewCertificate(entry: any) {
    if (entry.certificate_id) {
      // In real app: this.router.navigate(['/certificate-detail', entry.certificate_id]);
      this.showAlert('Certificate', `Would view certificate ${entry.certificate_id}`);
    }
  }

  createPrescription() {
    this.router.navigate(['/create-prescription'], {
      state: { patient: this.patient }
    });
  }

  createCertificate() {
    this.router.navigate(['/create-certificate'], {
      queryParams: { patientId: this.patientId }
    });
  }

  async exportHistory() {
    const loading = await this.loadingController.create({
      message: 'Preparing export...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const headers = ['Date', 'Visit Type', 'Symptoms', 'Diagnosis', 'Treatment', 'Doctor', 'Prescription', 'Certificate'];
      const csvData = this.filteredHistory.map(entry => [
        new Date(entry.visit_date).toLocaleDateString(),
        entry.visit_type || 'N/A',
        entry.symptoms || 'N/A',
        entry.diagnosis || 'N/A',
        entry.treatment || 'N/A',
        entry.doctor_name || 'N/A',
        entry.prescription_id || 'N/A',
        entry.certificate_id || 'N/A'
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `patient_history_${this.patient?.full_name?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      await loading.dismiss();
      this.showAlert('Export Successful', 'Patient history exported to CSV file.');
    } catch (error) {
      await loading.dismiss();
      this.showAlert('Export Failed', 'Failed to export patient history.');
    }
  }

  getFilterCount(): number {
    let count = 0;
    if (this.activeFilters.dateRange !== 'all') count++;
    if (this.activeFilters.visitType !== 'all') count++;
    if (this.activeFilters.diagnosis) count++;
    if (this.activeFilters.doctor) count++;
    return count;
  }

  getVisitIcon(visitType: string): string {
    const visitIcons: {[key: string]: string} = {
      'Consultation': 'medical-outline',
      'Follow-up': 'refresh-outline',
      'Emergency': 'warning-outline',
      'Routine Checkup': 'checkmark-circle-outline',
      'Vaccination': 'shield-outline',
      'Procedure': 'cut-outline',
      'Test Results': 'document-text-outline'
    };
    return visitIcons[visitType] || 'calendar-outline';
  }

  getVisitColor(visitType: string): string {
    const visitColors: {[key: string]: string} = {
      'Consultation': 'primary',
      'Follow-up': 'success',
      'Emergency': 'danger',
      'Routine Checkup': 'warning',
      'Vaccination': 'tertiary',
      'Procedure': 'secondary'
    };
    return visitColors[visitType] || 'medium';
  }

  getMonthName(month: number): string {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[month - 1] || '';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getDaysAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  // Mock data generators (remove in production)
  generateMockPatient(): Promise<any> {
    return new Promise((resolve) => {
      resolve({
        id: this.patientId,
        full_name: 'John Doe',
        age: 35,
        sex: 'male',
        mobile: '9876543210',
        email: 'john.doe@example.com',
        patient_id: 'PAT1001',
        blood_group: 'O+',
        allergies: 'Penicillin, Nuts',
        address: '123 Main Street, City, State 12345',
        created_at: '2023-01-15T10:30:00Z'
      });
    });
  }

  generateMockHistory(): Promise<any[]> {
    return new Promise((resolve) => {
      const mockData = [];
      const visitTypes = ['Consultation', 'Follow-up', 'Emergency', 'Routine Checkup', 'Test Results'];
      const symptoms = [
        'Fever and cough', 'Headache', 'Chest pain', 'Abdominal pain',
        'Shortness of breath', 'Joint pain', 'Fatigue', 'Skin rash'
      ];
      const diagnoses = [
        'Upper Respiratory Infection', 'Migraine', 'Hypertension', 'Gastritis',
        'Asthma', 'Arthritis', 'Anemia', 'Allergic Dermatitis'
      ];

      for (let i = 1; i <= 15; i++) {
        const visitDate = new Date();
        visitDate.setDate(visitDate.getDate() - Math.floor(Math.random() * 365));
        
        const visitTypeIndex = i % visitTypes.length;
        const symptomIndex = i % symptoms.length;
        
        mockData.push({
          id: i,
          patient_id: this.patientId,
          visit_date: visitDate.toISOString(),
          visit_type: visitTypes[visitTypeIndex],
          symptoms: symptoms[symptomIndex],
          diagnosis: diagnoses[symptomIndex],
          treatment: i % 3 === 0 ? 'Prescribed medication and rest' : 'Recommended tests and follow-up',
          notes: i % 4 === 0 ? 'Patient responded well to treatment' : '',
          prescription_id: i % 2 === 0 ? `RX${1000 + i}` : null,
          certificate_id: i % 5 === 0 ? `CERT${500 + i}` : null,
          doctor_name: 'Dr. Sharma',
          created_at: visitDate.toISOString()
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