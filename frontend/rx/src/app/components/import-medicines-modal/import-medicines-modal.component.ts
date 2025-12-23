import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-import-medicines-modal',
  templateUrl: './import-medicines-modal.component.html',
  styleUrls: ['./import-medicines-modal.component.scss'],
})

export class ImportMedicinesModalComponent implements OnInit {
  importMethod: 'csv' | 'manual' | 'api' = 'csv';
  csvData: string = '';
  isLoading = false;

  // Properties for template compatibility
  showPreview = false;
  selectedFile: File | null = null;
  isProcessing = false;
  importProgress = 0;
  validMedicines: any[] = [];
  invalidRecords: any[] = [];


  constructor(private modalController: ModalController) {}


  ngOnInit() {}

  // File selection handler
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const content = e.target.result;
        if (file.name.endsWith('.csv')) {
          this.csvData = content;
          this.parseCSV(content);
        } else if (file.name.endsWith('.json')) {
          this.parseJSON(content);
        }
        this.showPreview = true;
      };
      reader.readAsText(file);
    }
  }

  clearSelection() {
    this.selectedFile = null;
    this.csvData = '';
    this.validMedicines = [];
    this.invalidRecords = [];
    this.showPreview = false;
    this.importProgress = 0;
  }

  // CSV parsing for preview
  parseCSV(content: string) {
    const lines = content.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) {
      this.validMedicines = [];
      this.invalidRecords = [];
      return;
    }
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const valid: any[] = [];
    const invalid: any[] = [];
    lines.slice(1).forEach((line, idx) => {
      const values = line.split(',').map(v => v.trim());
      const medicine: any = {};
      headers.forEach((header, i) => {
        medicine[header] = values[i] || '';
      });
      // Simple validation: must have name, manufacturer, strength, form
      const errors = [];
      if (!medicine.name) errors.push('Missing name');
      if (!medicine.manufacturer) errors.push('Missing manufacturer');
      if (!medicine.strength) errors.push('Missing strength');
      if (!medicine.form) errors.push('Missing form');
      if (errors.length) {
        invalid.push({ row: idx + 2, errors });
      } else {
        valid.push(medicine);
      }
    });
    this.validMedicines = valid;
    this.invalidRecords = invalid;
  }

  // JSON parsing for preview
  parseJSON(content: string) {
    try {
      const arr = JSON.parse(content);
      if (Array.isArray(arr)) {
        const valid: any[] = [];
        const invalid: any[] = [];
        arr.forEach((medicine, idx) => {
          const errors = [];
          if (!medicine.name) errors.push('Missing name');
          if (!medicine.manufacturer) errors.push('Missing manufacturer');
          if (!medicine.strength) errors.push('Missing strength');
          if (!medicine.form) errors.push('Missing form');
          if (errors.length) {
            invalid.push({ row: idx + 1, errors });
          } else {
            valid.push(medicine);
          }
        });
        this.validMedicines = valid;
        this.invalidRecords = invalid;
      } else {
        this.validMedicines = [];
        this.invalidRecords = [{ row: 1, errors: ['Invalid JSON format'] }];
      }
    } catch (e) {
      this.validMedicines = [];
      this.invalidRecords = [{ row: 1, errors: ['Invalid JSON'] }];
    }
  }

  // Import medicines (simulate progress)
  importMedicines() {
    if (!this.validMedicines.length) return;
    this.isProcessing = true;
    this.importProgress = 0;
    const total = this.validMedicines.length;
    const step = 100 / total;
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      this.importProgress = Math.min(100, Math.round(idx * step));
      if (idx >= total) {
        clearInterval(interval);
        this.isProcessing = false;
        this.showSuccessMessage(total);
      }
    }, 200);
  }

  // Cancel import
  cancelImport() {
    this.dismiss();
  }

  async processCSV() {
    if (!this.csvData.trim()) {
      return;
    }

    this.isLoading = true;
    
    try {
      // Parse CSV data
      const lines = this.csvData.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const medicines = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const medicine: any = {};
        
        headers.forEach((header, index) => {
          if (values[index]) {
            medicine[header] = values[index];
          }
        });
        
        return medicine;
      }).filter(m => m.name); // Filter out empty rows
      
      // In real app, you would save these medicines
      console.log('Parsed medicines:', medicines);
      
      setTimeout(() => {
        this.isLoading = false;
        this.showSuccessMessage(medicines.length);
      }, 1500);
      
    } catch (error) {
      this.isLoading = false;
      console.error('Error parsing CSV:', error);
    }
  }

  showSuccessMessage(count: number) {
    // In real app, show alert
    console.log(`Successfully imported ${count} medicines`);
    this.modalController.dismiss({ success: true, count });
  }

  downloadTemplate() {
    const template = `name,generic_name,brand,strength,form,manufacturer,schedule
Paracetamol,Paracetamol,Crocin,500mg,Tablet,GSK,OTC
Ibuprofen,Ibuprofen,Brufen,400mg,Tablet,Abbott,OTC
Amoxicillin,Amoxicillin,Mox,500mg,Capsule,Sun Pharma,H`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'medicine_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  dismiss() {
    this.modalController.dismiss();
  }
}