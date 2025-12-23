import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PrescriptionsPage } from './prescriptions.page';

const routes: Routes = [
  {
    path: '',
    component: PrescriptionsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PrescriptionsPageRoutingModule { }
