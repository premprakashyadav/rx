import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MedicinesPageRoutingModule } from './medicines-routing.module';
import { AddEditMedicineModalComponent } from '../../components/add-edit-medicine-modal/add-edit-medicine-modal.component';
import { ImportMedicinesModalComponent } from '../../components/import-medicines-modal/import-medicines-modal.component';

import { MedicinesPage } from './medicines.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    MedicinesPageRoutingModule
  ],
  declarations: [MedicinesPage, AddEditMedicineModalComponent, ImportMedicinesModalComponent]
})
export class MedicinesPageModule { }
