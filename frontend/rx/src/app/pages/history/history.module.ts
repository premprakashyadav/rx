import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HistoryPageRoutingModule } from './history-routing.module';


import { AddHistoryEntryModalComponent } from '../../components/add-history-entry-modal/add-history-entry-modal.component';
import { HistoryPage } from './history.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    HistoryPageRoutingModule
  ],
  declarations: [HistoryPage, AddHistoryEntryModalComponent]
})
export class HistoryPageModule { }
