import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, ToastController } from '@ionic/angular';

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  duration?: string;
}

@Component({
  selector: 'app-add-medicine-modal',
  templateUrl: './add-medicine-modal.component.html',
  styleUrls: ['./add-medicine-modal.component.scss'],
})
export class AddMedicineModalComponent implements OnInit {
  medicineForm!: FormGroup;
  isLoading = false;
  frequencyOptions = [
    { label: 'Once daily', value: 'once-daily' },
    { label: 'Twice daily', value: 'twice-daily' },
    { label: 'Three times daily', value: 'three-times-daily' },
    { label: 'Four times daily', value: 'four-times-daily' },
    { label: 'Every 4 hours', value: 'every-4h' },
    { label: 'Every 6 hours', value: 'every-6h' },
    { label: 'Every 8 hours', value: 'every-8h' },
    { label: 'Every 12 hours', value: 'every-12h' },
  ];

  durationOptions = [
    { label: '3 days', value: '3d' },
    { label: '5 days', value: '5d' },
    { label: '7 days', value: '7d' },
    { label: '10 days', value: '10d' },
    { label: '14 days', value: '14d' },
    { label: '21 days', value: '21d' },
    { label: '30 days', value: '30d' },
    { label: 'As needed', value: 'as-needed' },
  ];

  commonDosages = [
    '250mg',
    '500mg',
    '1000mg',
    '5ml',
    '10ml',
    '2 tablets',
    '1 tablet',
    '1 capsule',
  ];

  constructor(
    private formBuilder: FormBuilder,
    private modalController: ModalController,
    private toastController: ToastController
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.medicineForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      dosage: ['', Validators.required],
      frequency: ['', Validators.required],
      instructions: [''],
      duration: [''],
    });
  }

  async addMedicine(): Promise<void> {
    if (this.medicineForm.invalid) {
      await this.showToast('Please fill in all required fields', 'warning');
      return;
    }

    this.isLoading = true;
    try {
      const medicineData: Medication = this.medicineForm.value;
      await this.modalController.dismiss({
        data: medicineData,
      });
    } catch (error) {
      await this.showToast('Error adding medicine', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  cancel(): void {
    this.modalController.dismiss();
  }

  private async showToast(
    message: string,
    color: string = 'success'
  ): Promise<void> {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 2000,
      position: 'bottom',
    });
    await toast.present();
  }
}
