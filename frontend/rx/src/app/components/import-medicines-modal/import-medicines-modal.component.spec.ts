import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImportMedicinesModalComponent } from './import-medicines-modal.component';

describe('ImportMedicinesModalComponent', () => {
  let component: ImportMedicinesModalComponent;
  let fixture: ComponentFixture<ImportMedicinesModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImportMedicinesModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ImportMedicinesModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
