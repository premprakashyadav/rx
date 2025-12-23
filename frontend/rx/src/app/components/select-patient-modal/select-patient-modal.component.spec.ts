import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectPatientModalComponent } from './select-patient-modal.component';

describe('SelectPatientModalComponent', () => {
  let component: SelectPatientModalComponent;
  let fixture: ComponentFixture<SelectPatientModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SelectPatientModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SelectPatientModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
