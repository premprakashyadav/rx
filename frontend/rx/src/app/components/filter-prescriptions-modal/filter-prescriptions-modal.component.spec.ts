import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterPrescriptionsModalComponent } from './filter-prescriptions-modal.component';

describe('FilterPrescriptionsModalComponent', () => {
  let component: FilterPrescriptionsModalComponent;
  let fixture: ComponentFixture<FilterPrescriptionsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FilterPrescriptionsModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FilterPrescriptionsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
