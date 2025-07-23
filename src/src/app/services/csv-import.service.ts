import { Injectable } from '@angular/core';
import { Worker, OntopCSVRow } from '../models/interfaces';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class CsvImportService {

  constructor() { }

  parseOntopData(content: string | any[][]): Worker[] {
    let rows: string[][];
    
    // If content is already an array (from XLSX), use it directly
    if (Array.isArray(content)) {
      rows = content.map(row => row.map(cell => cell?.toString() || ''));
    } else {
      // Parse CSV content
      rows = this.parseCSVContent(content);
    }

    const workers: Worker[] = [];
    
    // Find header row (contains "Unit of payment")
    let headerRowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      const rowText = rows[i].join(',').toLowerCase();
      if (rowText.includes('unit of payment')) {
        headerRowIndex = i;
        break;
      }
    }
    
    if (headerRowIndex === -1) {
      throw new Error('Invalid file format: Header row with "Unit of payment" not found');
    }
    
    // Parse data rows
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      
      if (!row || row.length < 13) continue; // Skip incomplete rows
      
      const unitOfPayment = row[12]?.toLowerCase().trim();
      
      if (unitOfPayment === 'per hour') {
        // Enhanced validation for contractor data
        const contractorId = row[0]?.trim() || '';
        const name = row[3]?.trim() || '';
        const email = row[4]?.trim() || '';
        
        // Skip invalid rows with missing critical data
        if (!contractorId || !name || contractorId === 'Unknown' || name === 'Unknown') {
          console.warn('Skipping invalid contractor row:', { contractorId, name, email });
          continue;
        }
        
        // Ensure contractor ID is clean and valid
        const cleanContractorId = contractorId.replace(/[^\w\-]/g, '');
        if (!cleanContractorId) {
          console.warn('Skipping contractor with invalid ID:', contractorId);
          continue;
        }
        
        workers.push({
          contractorId: cleanContractorId,
          name: name,
          email: email,
          inviteToken: this.generateInviteToken(),
          isActive: false, // Workers start inactive and become active when they access their link
          trackingMode: 'clock' // Default to clock in/out mode
        });
      }
    }
    
    // Final validation and deduplication
    const validatedWorkers = this.validateAndCleanWorkers(workers);
    
    if (validatedWorkers.length === 0) {
      throw new Error('No valid hourly workers found in the file. Please check data format.');
    }
    
    console.log(`Successfully imported ${validatedWorkers.length} hourly workers`);
    return validatedWorkers;
  }

  /**
   * Validate and clean worker data to prevent issues
   */
  private validateAndCleanWorkers(workers: Worker[]): Worker[] {
    const seenIds = new Set<string>();
    const validWorkers: Worker[] = [];
    
    for (const worker of workers) {
      // Check for duplicate contractor IDs
      if (seenIds.has(worker.contractorId)) {
        console.warn('Duplicate contractor ID found, skipping:', worker.contractorId);
        continue;
      }
      
      // Final validation
      if (this.isValidWorker(worker)) {
        seenIds.add(worker.contractorId);
        validWorkers.push(worker);
      } else {
        console.warn('Invalid worker data, skipping:', worker);
      }
    }
    
    return validWorkers;
  }

  /**
   * Check if worker data is valid
   */
  private isValidWorker(worker: Worker): boolean {
    return !!(
      worker.contractorId && 
      worker.name && 
      worker.contractorId.trim().length > 0 && 
      worker.name.trim().length > 0 &&
      worker.name !== 'Unknown' &&
      worker.contractorId !== 'Unknown' &&
      /^[\w\-]+$/.test(worker.contractorId) // Only allow alphanumeric and hyphens
    );
  }

  // Legacy method for backward compatibility
  parseOntopCSV(csvContent: string): Worker[] {
    return this.parseOntopData(csvContent);
  }

  private parseCSVContent(csvContent: string): string[][] {
    const lines = csvContent.split('\n');
    const rows: string[][] = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      rows.push(this.parseCSVRow(line));
    }
    
    return rows;
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

  validateFile(file: File): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const fileName = file.name.toLowerCase();
      
      // Check file type
      if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx')) {
        reject(new Error('Please upload a CSV or XLSX file'));
        return;
      }

      // Check file size (max 10MB for Excel files)
      if (file.size > 10 * 1024 * 1024) {
        reject(new Error('File too large. Maximum size is 10MB'));
        return;
      }

      // For XLSX files, we'll validate structure after reading
      if (fileName.endsWith('.xlsx')) {
        resolve(true);
        return;
      }

      // For CSV files, read and validate structure
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        
        // Basic validation - check if it contains expected headers
        if (!content.includes('Unit of payment') || !content.includes('Contractor ID')) {
          reject(new Error('Invalid file format. Missing required columns: "Unit of payment" and "Contractor ID".'));
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

  // Legacy method for backward compatibility
  validateCSVFile(file: File): Promise<boolean> {
    return this.validateFile(file);
  }

  readFile(file: File): Promise<string | any[][]> {
    return new Promise((resolve, reject) => {
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.xlsx')) {
        // Read XLSX file
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Get the first worksheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convert to array of arrays
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
            
            // Validate structure
            const hasRequiredHeaders = jsonData.some((row: any) => {
              const rowText = row.join(',').toLowerCase();
              return rowText.includes('unit of payment') && rowText.includes('contractor id');
            });
            
            if (!hasRequiredHeaders) {
              reject(new Error('Invalid Excel file format. Missing required columns: "Unit of payment" and "Contractor ID".'));
              return;
            }
            
            resolve(jsonData as any[][]);
          } catch (error) {
            reject(new Error('Failed to parse Excel file. Please ensure it\'s a valid .xlsx file.'));
          }
        };
        
        reader.onerror = () => {
          reject(new Error('Failed to read Excel file'));
        };
        
        reader.readAsArrayBuffer(file);
      } else {
        // Read CSV file
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.onerror = () => {
          reject(new Error('Failed to read CSV file'));
        };
        reader.readAsText(file);
      }
    });
  }

  // Legacy method for backward compatibility
  readCSVFile(file: File): Promise<string> {
    return this.readFile(file) as Promise<string>;
  }
} 