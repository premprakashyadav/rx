import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreatePrescriptionPage } from './create-prescription.page';

describe('CreatePrescriptionPage', () => {
  let component: CreatePrescriptionPage;
  let fixture: ComponentFixture<CreatePrescriptionPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreatePrescriptionPage]
    }).compileComponents();

    fixture = TestBed.createComponent(CreatePrescriptionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
