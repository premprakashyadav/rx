import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CreateCertificatePage } from './create-certificate.page';

const routes: Routes = [
  {
    path: '',
    component: CreateCertificatePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CreateCertificatePageRoutingModule { }
