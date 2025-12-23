import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-select-patient-modal',
  templateUrl: './select-patient-modal.component.html',
  styleUrls: ['./select-patient-modal.component.scss'],
})
export class SelectPatientModalComponent implements OnInit {
  @Input() patients: any[] = [];
  filteredPatients: any[] = [];
  searchTerm: string = '';

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    this.filteredPatients = [...this.patients];
  }

  searchPatients(event: any) {
    this.searchTerm = event.target.value.toLowerCase();
    this.filteredPatients = this.patients.filter(patient =>
      patient.full_name.toLowerCase().includes(this.searchTerm) ||
      patient.mobile?.toLowerCase().includes(this.searchTerm) ||
      patient.patient_id?.toLowerCase().includes(this.searchTerm)
    );
  }

  selectPatient(patient: any) {
    this.modalController.dismiss({ patient });
  }

  dismiss() {
    this.modalController.dismiss();
  }

  getPatientInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }
}