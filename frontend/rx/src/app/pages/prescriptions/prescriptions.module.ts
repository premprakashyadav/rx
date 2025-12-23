import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PrescriptionsPageRoutingModule } from './prescriptions-routing.module';
import { FilterPrescriptionsModalComponent } from '../../components/filter-prescriptions-modal/filter-prescriptions-modal.component';

import { PrescriptionsPage } from './prescriptions.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    PrescriptionsPageRoutingModule
  ],
  declarations: [PrescriptionsPage, FilterPrescriptionsModalComponent]
})
export class PrescriptionsPageModule { }
