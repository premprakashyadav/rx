import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MedicinesPage } from './medicines.page';

describe('MedicinesPage', () => {
  let component: MedicinesPage;
  let fixture: ComponentFixture<MedicinesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MedicinesPage]
    }).compileComponents();

    fixture = TestBed.createComponent(MedicinesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
