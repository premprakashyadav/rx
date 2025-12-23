import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./pages/register/register.module').then(m => m.RegisterPageModule)
  },
  {
    path: 'forgot-password',
    loadChildren: () => import('./pages/forgot-password/forgot-password.module').then(m => m.ForgotPasswordPageModule)
  },
  {
    path: 'reset-password',
    loadChildren: () => import('./pages/reset-password/reset-password.module').then(m => m.ResetPasswordPageModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./pages/dashboard/dashboard.module').then(m => m.DashboardPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'doctor-profile',
    loadChildren: () => import('./pages/doctor-profile/doctor-profile.module').then(m => m.DoctorProfilePageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'patients',
    loadChildren: () => import('./pages/patients/patients.module').then(m => m.PatientsPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'create-prescription',
    loadChildren: () => import('./pages/create-prescription/create-prescription.module').then(m => m.CreatePrescriptionPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'prescriptions',
    loadChildren: () => import('./pages/prescriptions/prescriptions.module').then(m => m.PrescriptionsPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'create-certificate',
    loadChildren: () => import('./pages/create-certificate/create-certificate.module').then(m => m.CreateCertificatePageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'certificates',
    loadChildren: () => import('./pages/certificates/certificates.module').then(m => m.CertificatesPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'history/:patientId',
    loadChildren: () => import('./pages/history/history.module').then(m => m.HistoryPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'medicines',
    loadChildren: () => import('./pages/medicines/medicines.module').then(m => m.MedicinesPageModule),
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}