import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddEditMedicineModalComponent } from './add-edit-medicine-modal.component';

describe('AddEditMedicineModalComponent', () => {
  let component: AddEditMedicineModalComponent;
  let fixture: ComponentFixture<AddEditMedicineModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddEditMedicineModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditMedicineModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
