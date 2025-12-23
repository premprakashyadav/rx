import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { PrescriptionService } from '../../services/prescription.service';

@Component({
  selector: 'app-add-patient-modal',
  templateUrl: './add-patient-modal.component.html',
  styleUrls: ['./add-patient-modal.component.scss'],
})
export class AddPatientModalComponent implements OnInit {
  @Input() patient: any = null;
  patientForm: FormGroup;
  isEditing = false;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private modalController: ModalController,
    private prescriptionService: PrescriptionService
  ) {
    this.patientForm = this.createForm();
  }

  ngOnInit() {
    if (this.patient) {
      this.isEditing = true;
      this.patientForm.patchValue(this.patient);
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      full_name: ['', [Validators.required]],
      age: ['', [Validators.required, Validators.min(0), Validators.max(150)]],
      sex: ['', [Validators.required]],
      mobile: [''],
      email: ['', [Validators.email]],
      address: [''],
      blood_group: [''],
      allergies: ['']
    });
  }

  async submit() {
    if (this.patientForm.invalid) {
      this.markFormGroupTouched(this.patientForm);
      return;
    }

    this.isLoading = true;
    try {
      const formData = this.patientForm.value;
      
      if (this.isEditing) {
        // Update patient - you would call update API here
        // For now, we'll just close the modal
        this.modalController.dismiss({ success: true, patient: formData });
      } else {
        // Add new patient
        await this.prescriptionService.addPatient(formData);
        this.modalController.dismiss({ success: true });
      }
    } catch (error) {
      console.error('Error saving patient:', error);
    } finally {
      this.isLoading = false;
    }
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  dismiss() {
    this.modalController.dismiss();
  }
}