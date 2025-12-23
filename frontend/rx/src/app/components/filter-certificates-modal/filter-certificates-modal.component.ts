import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-filter-certificates-modal',
  templateUrl: './filter-certificates-modal.component.html',
  styleUrls: ['./filter-certificates-modal.component.scss'],
})
export class FilterCertificatesModalComponent implements OnInit {
  @Input() activeFilters: any = {};
  @Input() certificateTypes: any[] = [];
  
  filters = {
    certificateType: 'all',
    dateRange: 'all',
    status: 'all',
    patientName: ''
  };
  
  statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'valid', label: 'Valid' },
    { value: 'expiring', label: 'Expiring Soon' },
    { value: 'expired', label: 'Expired' }
  ];
  
  dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    this.filters = { ...this.activeFilters };
  }

  applyFilters() {
    this.modalController.dismiss(this.filters);
  }

  resetFilters() {
    this.filters = {
      certificateType: 'all',
      dateRange: 'all',
      status: 'all',
      patientName: ''
    };
  }

  dismiss() {
    this.modalController.dismiss();
  }
}