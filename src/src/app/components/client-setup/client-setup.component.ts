import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CsvImportService } from '../../services/csv-import.service';
import { StorageService } from '../../services/storage.service';
import { Client, Worker } from '../../models/interfaces';
// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { ButtonComponent } from '../shared/button/button.component';

@Component({
  selector: 'app-client-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, ButtonComponent],
  template: `
    <div class="min-h-screen bg-ontop-gray p-4">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-ontop-blue rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-sm">🏢</span>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">ontop</h1>
              <p class="text-gray-600">Time Tracking Setup</p>
            </div>
          </div>
        </div>

        <!-- Setup Form -->
        <div class="card-ontop mb-6">
          <h2 class="text-xl font-semibold mb-4">Import Your Hourly Workers</h2>
          <p class="text-gray-600 mb-6">Upload your Ontop contracts file (CSV or Excel format) to automatically import hourly workers and start tracking time.</p>

          <!-- File Upload -->
          <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6" 
               [class.border-ontop-blue]="isDragOver"
               (dragover)="onDragOver($event)" 
               (dragleave)="onDragLeave($event)" 
               (drop)="onDrop($event)">
            
            <div *ngIf="!selectedFile">
              <div class="mx-auto w-12 h-12 text-gray-400 mb-4">
                📄
              </div>
              <p class="text-lg font-medium text-gray-900 mb-2">Upload Ontop Contracts File</p>
              <p class="text-gray-600 mb-4">Drag and drop your CSV or Excel file here, or click to browse</p>
              <input type="file" 
                     accept=".csv,.xlsx" 
                     (change)="onFileSelected($event)" 
                     class="hidden" 
                     #fileInput>
              <button mat-raised-button color="primary" (click)="fileInput.click()">
                Browse Files
              </button>
            </div>

            <div *ngIf="selectedFile" class="text-left">
              <div class="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                <div class="flex items-center space-x-3">
                  <span class="text-2xl">📄</span>
                  <div>
                    <p class="font-medium">{{ selectedFile.name }}</p>
                    <p class="text-sm text-gray-600">{{ formatFileSize(selectedFile.size) }}</p>
                  </div>
                </div>
                <button (click)="removeFile()" class="text-ontop-red hover:text-red-600">
                  ✕
                </button>
              </div>
              
              <button mat-raised-button color="primary" (click)="processFile()" 
                      [disabled]="isProcessing" 
                      class="w-full mt-4">
                <span *ngIf="!isProcessing">Process File</span>
                <span *ngIf="isProcessing">Processing...</span>
              </button>
            </div>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div class="flex items-center space-x-2">
              <span class="text-red-600">⚠️</span>
              <p class="text-red-800">{{ errorMessage }}</p>
            </div>
          </div>

          <!-- Success Message -->
          <div *ngIf="successMessage" class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div class="flex items-center space-x-2">
              <span class="text-green-600">✅</span>
              <p class="text-green-800">{{ successMessage }}</p>
            </div>
          </div>
        </div>

        <!-- Workers List -->
        <div *ngIf="workers.length > 0" class="card-ontop">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">Imported Hourly Workers ({{ workers.length }})</h3>
            <button mat-raised-button color="primary" (click)="proceedToDashboard()">
              Continue to Dashboard
            </button>
          </div>

          <!-- Tracking Mode Explanation -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 class="font-medium text-blue-900 mb-2">📋 Choose Tracking Mode for Each Worker</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <span class="font-medium">⏰ Clock In/Out:</span> Workers use start/stop buttons with optional time adjustment requests
              </div>
              <div>
                <span class="font-medium">📊 Timesheet:</span> Workers report daily hours manually with required proof of work
              </div>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Name</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Contractor ID</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Tracking Mode</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Invite Link</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let worker of workers" class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="py-3 px-4">
                    <div class="flex items-center space-x-2">
                      <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span class="text-xs font-medium">{{ getWorkerInitials(worker.name) }}</span>
                      </div>
                      <span class="font-medium">{{ worker.name }}</span>
                    </div>
                  </td>
                  <td class="py-3 px-4 text-gray-600">{{ worker.email }}</td>
                  <td class="py-3 px-4 text-gray-600 font-mono">{{ worker.contractorId }}</td>
                  <td class="py-3 px-4">
                    <select 
                      [(ngModel)]="worker.trackingMode"
                      (ngModelChange)="updateWorkerTrackingMode(worker)"
                      class="p-2 border border-gray-300 rounded-lg text-sm w-full">
                      <option value="clock">Clock In/Out</option>
                      <option value="timesheet">Timesheet</option>
                    </select>
                  </td>
                  <td class="py-3 px-4">
                    <app-button 
                      variant="secondary" 
                      size="small" 
                      icon="link" 
                      (click)="copyInviteLink(worker.inviteToken)">
                      Copy Link
                    </app-button>
                  </td>
                  <td class="py-3 px-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          [class]="worker.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                      {{ worker.isActive ? 'Active' : 'Invited' }}
                    </span>
                    <div *ngIf="worker.joinedAt" class="text-xs text-gray-500 mt-1">
                      Joined: {{ formatDate(worker.joinedAt) }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ClientSetupComponent {
  selectedFile: File | null = null;
  workers: Worker[] = [];
  isProcessing = false;
  isDragOver = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private csvService: CsvImportService,
    private storage: StorageService,
    private router: Router
  ) {}

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.errorMessage = '';
    this.successMessage = '';
  }

  async processFile() {
    if (!this.selectedFile) return;

    this.isProcessing = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      // Validate file
      await this.csvService.validateFile(this.selectedFile);
      
      // Read and parse file (CSV or XLSX)
      const fileContent = await this.csvService.readFile(this.selectedFile);
      this.workers = this.csvService.parseOntopData(fileContent);

      if (this.workers.length === 0) {
        throw new Error('No hourly workers found in the file. Make sure workers have "Per hour" as payment unit.');
      }

      // Save to storage
      this.storage.saveWorkers(this.workers);
      
      // Create client data (only if it doesn't exist)
      let clientData = this.storage.getClientData();
      if (!clientData) {
        clientData = {
          id: 'client_' + Date.now(),
          name: 'Company Client',
          email: 'client@company.com',
          trackingPreferences: {
            allowClockInOut: true,
            allowManualEntry: true,
            requireProofOfWork: true,
            screenshotFrequency: 'manual'
          },
          workers: this.workers
        };
      } else {
        // Update existing client data with new workers
        clientData.workers = [...(clientData.workers || []), ...this.workers];
      }
      this.storage.saveClientData(clientData);

      this.successMessage = `Successfully imported ${this.workers.length} hourly workers!`;
      
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to process file';
    } finally {
      this.isProcessing = false;
    }
  }

  copyInviteLink(token: string) {
    const link = `${window.location.origin}/worker/${token}`;
    navigator.clipboard.writeText(link).then(() => {
      // Could add a toast notification here
      console.log('Invite link copied:', link);
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  updateWorkerTrackingMode(worker: Worker) {
    // Update the worker in storage immediately
    this.storage.saveWorkers(this.workers);
    
    // Update client data
    const clientData = this.storage.getClientData();
    if (clientData) {
      clientData.workers = this.workers;
      this.storage.saveClientData(clientData);
    }
  }

  getWorkerInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  proceedToDashboard() {
    this.router.navigate(['/client/dashboard']);
  }
} 