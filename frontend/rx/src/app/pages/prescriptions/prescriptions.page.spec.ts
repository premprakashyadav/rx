import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrescriptionsPage } from './prescriptions.page';

describe('PrescriptionsPage', () => {
  let component: PrescriptionsPage;
  let fixture: ComponentFixture<PrescriptionsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PrescriptionsPage]
    }).compileComponents();

    fixture = TestBed.createComponent(PrescriptionsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
