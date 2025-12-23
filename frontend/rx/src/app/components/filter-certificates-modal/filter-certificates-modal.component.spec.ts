import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterCertificatesModalComponent } from './filter-certificates-modal.component';

describe('FilterCertificatesModalComponent', () => {
  let component: FilterCertificatesModalComponent;
  let fixture: ComponentFixture<FilterCertificatesModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FilterCertificatesModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FilterCertificatesModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
