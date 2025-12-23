import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(
    private platform: Platform,
    private storage: Storage,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.initializeApp();
  }

  async ngOnInit() {
    await this.storage.create();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Check authentication status
      this.checkAuthStatus();
      
      // Handle back button
  this.platform.backButton.subscribeWithPriority(10, () => {
    const url = this.router.url;
    if (url === '/login' || url === '/dashboard') {
      // Type assertion for Cordova/Capacitor
      (navigator as any)['app'].exitApp();
    } else {
      window.history.back();
    }
  });
    });
  }

  async checkAuthStatus() {
    const token = await this.storage.get('token');
    if (token) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}