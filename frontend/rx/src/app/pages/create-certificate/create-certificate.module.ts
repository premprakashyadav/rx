import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CreateCertificatePageRoutingModule } from './create-certificate-routing.module';
import { SelectPatientModalComponent } from '../../components/select-patient-modal/select-patient-modal.component';

import { CreateCertificatePage } from './create-certificate.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    CreateCertificatePageRoutingModule
  ],
  declarations: [CreateCertificatePage]
})
export class CreateCertificatePageModule { }
