import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { PrescriptionService } from '../../services/prescription.service';

@Component({
  selector: 'app-add-edit-medicine-modal',
  templateUrl: './add-edit-medicine-modal.component.html',
  styleUrls: ['./add-edit-medicine-modal.component.scss'],
})
export class AddEditMedicineModalComponent implements OnInit {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() medicine: any = null;
  
  medicineForm: FormGroup;
  isLoading = false;
  
  // Common medicine forms
  medicineForms = [
    'Tablet',
    'Capsule',
    'Syrup',
    'Injection',
    'Ointment',
    'Cream',
    'Drop',
    'Inhaler',
    'Powder',
    'Suspension',
    'Solution',
    'Spray',
    'Patch',
    'Suppository'
  ];
  
  // Schedule categories
  schedules = [
    { value: '', label: 'Not Specified' },
    { value: 'OTC', label: 'Over-the-Counter' },
    { value: 'H', label: 'Schedule H' },
    { value: 'H1', label: 'Schedule H1' },
    { value: 'X', label: 'Schedule X' },
    { value: 'N', label: 'Schedule N' }
  ];

  constructor(
    private fb: FormBuilder,
    private modalController: ModalController,
    private prescriptionService: PrescriptionService
  ) {
    this.medicineForm = this.createForm();
  }

  ngOnInit() {
    if (this.mode === 'edit' && this.medicine) {
      this.medicineForm.patchValue(this.medicine);
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(200)]],
      generic_name: ['', [Validators.maxLength(200)]],
      brand: ['', [Validators.maxLength(100)]],
      strength: ['', [Validators.maxLength(50)]],
      form: [''],
      manufacturer: ['', [Validators.maxLength(200)]],
      schedule: [''],
      is_active: [true]
    });
  }

  async submit() {
    if (this.medicineForm.invalid) {
      this.markFormGroupTouched(this.medicineForm);
      return;
    }

    this.isLoading = true;
    try {
      const formData = this.medicineForm.value;
      
      if (this.mode === 'add') {
        await this.prescriptionService.addMedicine(formData);
        this.modalController.dismiss({ success: true });
      } else {
        // In real app: await this.prescriptionService.updateMedicine(this.medicine.id, formData);
        this.modalController.dismiss({ success: true, medicine: formData });
      }
    } catch (error) {
      console.error('Error saving medicine:', error);
      // Handle error
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