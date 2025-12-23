import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CertificatesPageRoutingModule } from './certificates-routing.module';
import { FilterCertificatesModalComponent } from '../../components/filter-certificates-modal/filter-certificates-modal.component';

import { CertificatesPage } from './certificates.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    CertificatesPageRoutingModule
  ],
  declarations: [CertificatesPage, FilterCertificatesModalComponent]
})
export class CertificatesPageModule { }
