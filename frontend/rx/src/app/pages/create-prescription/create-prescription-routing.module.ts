import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreatePrescriptionPage } from './create-prescription.page';

const routes: Routes = [
  {
    path: '',
    component: CreatePrescriptionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CreatePrescriptionPageRoutingModule { }
