import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateCertificatePage } from './create-certificate.page';

describe('CreateCertificatePage', () => {
  let component: CreateCertificatePage;
  let fixture: ComponentFixture<CreateCertificatePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateCertificatePage]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateCertificatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
