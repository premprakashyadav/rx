import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { DoctorProfilePageRoutingModule } from './doctor-profile-routing.module';
import { DoctorProfilePage } from './doctor-profile.page';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    DoctorProfilePageRoutingModule
  ],
  declarations: [DoctorProfilePage]
})
export class DoctorProfilePageModule { }
