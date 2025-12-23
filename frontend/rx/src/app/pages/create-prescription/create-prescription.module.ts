import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { CreatePrescriptionPageRoutingModule } from './create-prescription-routing.module';
import { CreatePrescriptionPage } from './create-prescription.page';
import { SelectPatientModalComponent } from '../../components/select-patient-modal/select-patient-modal.component';
import { AddMedicineModalComponent } from '../../components/add-medicine-modal/add-medicine-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    CreatePrescriptionPageRoutingModule
  ],
  declarations: [CreatePrescriptionPage,
     AddMedicineModalComponent]
})
export class CreatePrescriptionPageModule { }
