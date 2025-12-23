import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-filter-prescriptions-modal',
  templateUrl: './filter-prescriptions-modal.component.html',
  styleUrls: ['./filter-prescriptions-modal.component.scss'],
})
export class FilterPrescriptionsModalComponent implements OnInit {
  @Input() activeFilters: any = {};
  
  filters = {
    dateRange: 'all',
    status: 'all',
    patientName: '',
    doctorName: ''
  };
  
  statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'today', label: 'Today' },
    { value: 'overdue', label: 'Overdue' }
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
      dateRange: 'all',
      status: 'all',
      patientName: '',
      doctorName: ''
    };
  }

  dismiss() {
    this.modalController.dismiss();
  }
}