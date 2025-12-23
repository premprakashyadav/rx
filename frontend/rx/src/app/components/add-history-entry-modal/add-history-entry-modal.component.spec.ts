import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { AddHistoryEntryModalComponent } from './add-history-entry-modal.component';

describe('AddHistoryEntryModalComponent', () => {
  let component: AddHistoryEntryModalComponent;
  let fixture: ComponentFixture<AddHistoryEntryModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddHistoryEntryModalComponent],
      imports: [IonicModule.forRoot(), FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(AddHistoryEntryModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
