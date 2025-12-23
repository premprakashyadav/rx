import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, MenuController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { PrescriptionService } from '../../services/prescription.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  user: any = null;
  profile: any = null;
  stats = {
    patients: 0,
    prescriptions: 0,
    certificates: 0
  };
  recentPrescriptions: any[] = [];
  quickActions = [
    { icon: 'document-text-outline', label: 'New Prescription', route: '/create-prescription' },
    { icon: 'person-add-outline', label: 'Add Patient', route: '/patients' },
    { icon: 'ribbon-outline', label: 'Certificate', route: '/create-certificate' },
    { icon: 'medical-outline', label: 'Medicines', route: '/medicines' }
  ];
  isLoading = true;

  constructor(
    private authService: AuthService,
    private prescriptionService: PrescriptionService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private menuController: MenuController
  ) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    
    try {
      this.user = await this.authService.getUser();
      this.profile = await this.authService.getProfile();
      
      if (!this.profile) {
        this.profile = await this.prescriptionService.getDoctorProfile();
        await this.authService.updateProfile(this.profile);
      }

      // Load stats and recent data
      await this.loadStats();
      await this.loadRecentPrescriptions();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadStats() {
    try {
      // This would be API calls in a real implementation
      // For now, we'll use mock data
      const patients = await this.prescriptionService.getPatients();
      this.stats.patients = patients?.length || 0;
      
      // Similar for prescriptions and certificates
      this.stats.prescriptions = 0; // Would be from API
      this.stats.certificates = 0; // Would be from API
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async loadRecentPrescriptions() {
    try {
      // This would be API call in real implementation
      this.recentPrescriptions = [
        // Mock data for now
      ];
    } catch (error) {
      console.error('Error loading recent prescriptions:', error);
    }
  }

  async refreshData(event: any) {
    await this.loadData();
    event.target.complete();
  }

  openMenu() {
    this.menuController.open();
  }

  navigateTo(page: string) {
    this.router.navigate([`/${page}`]);
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Confirm Logout',
      message: 'Are you sure you want to logout?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Logout',
          handler: async () => {
            await this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  ionViewWillEnter() {
    this.menuController.enable(true);
  }
}