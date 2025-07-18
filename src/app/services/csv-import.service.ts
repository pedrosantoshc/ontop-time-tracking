import { Injectable } from '@angular/core';
import { Worker, OntopCSVRow } from '../models/interfaces';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class CsvImportService {

  constructor() { }

  parseOntopCSV(csvContent: string): Worker[] {
    const lines = csvContent.split('\n');
    const workers: Worker[] = [];
    
    // Find header row (contains "Unit of payment")
    let headerRowIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Unit of payment')) {
        headerRowIndex = i;
        break;
      }
    }
    
    if (headerRowIndex === -1) {
      throw new Error('Invalid CSV format: Header row not found');
    }
    
    // Parse data rows
    for (let i = headerRowIndex + 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // Skip empty lines
      
      const row = this.parseCSVRow(lines[i]);
      
      if (row.length < 13) continue; // Skip incomplete rows
      
      const unitOfPayment = row[12]?.toLowerCase().trim();
      
      if (unitOfPayment === 'per hour') {
        workers.push({
          contractorId: row[1] || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: row[3] || 'Unknown',
          email: row[4] || '',
          inviteToken: this.generateInviteToken(),
          isActive: true
        });
      }
    }
    
    return workers;
  }

  private parseCSVRow(row: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  generateInviteToken(): string {
    const timestamp = Date.now().toString(36);
    const random = uuidv4().replace(/-/g, '').substring(0, 8);
    return `${timestamp}-${random}`.toUpperCase();
    // Example: "LKJ8H9X2-A1B2C3D4"
  }

  validateCSVFile(file: File): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Check file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        reject(new Error('Please upload a CSV file'));
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error('File too large. Maximum size is 5MB'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        
        // Basic validation - check if it contains expected headers
        if (!content.includes('Unit of payment') || !content.includes('Contractor ID')) {
          reject(new Error('Invalid Ontop CSV format. Missing required columns.'));
          return;
        }

        resolve(true);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  readCSVFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsText(file);
    });
  }
} 