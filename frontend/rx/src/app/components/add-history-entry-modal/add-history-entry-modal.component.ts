import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-add-history-entry-modal',
  templateUrl: './add-history-entry-modal.component.html',
  styleUrls: ['./add-history-entry-modal.component.scss']
})
export class AddHistoryEntryModalComponent {
  @Input() entry: any = {};
  @Output() save = new EventEmitter<any>();

  constructor(private modalCtrl: ModalController) {}

  dismiss() {
    this.modalCtrl.dismiss();
  }

  onSave() {
    this.save.emit(this.entry);
    this.dismiss();
  }
}
