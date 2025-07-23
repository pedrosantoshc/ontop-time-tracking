import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { CsvImportService } from '../../services/csv-import.service';
import { Client, Worker } from '../../models/interfaces';
import { v4 as uuidv4 } from 'uuid';
import { MainLayoutComponent } from '../shared/main-layout/main-layout.component';
import { ButtonComponent } from '../shared/button/button.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@Component({
  selector: 'app-client-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, ButtonComponent, MatFormFieldModule, MatInputModule, MatButtonToggleModule],
  template: `
    <app-main-layout>
      
      <!-- Settings Actions Toolbar -->
      <div slot="toolbar" class="settings-actions">
        <app-button 
          variant="warn" 
          icon="delete" 
          (click)="resetAllData()">
          Reset All Data
        </app-button>
        <app-button 
          variant="secondary" 
          icon="arrow_back" 
          (click)="goToDashboard()">
          Back to Dashboard
        </app-button>
      </div>

      <!-- Settings Content -->
      <div class="settings-content">
        
        <!-- Page Header -->
        <div class="settings-header section--compact">
          <h1 class="settings-title">Settings</h1>
          <p class="settings-subtitle">Manage workers and tracking preferences</p>
        </div>

        <!-- Navigation Tabs -->
        <mat-button-toggle-group [(ngModel)]="activeTab" class="mb-6" appearance="legacy">
          <mat-button-toggle value="workers">Workers Management</mat-button-toggle>
          <mat-button-toggle value="import">Import Workers</mat-button-toggle>
        </mat-button-toggle-group>

        <!-- Workers Management Tab -->
        <div *ngIf="activeTab === 'workers'" class="space-y-6">
          
          <!-- Add Worker Form -->
          <div class="card-ontop">
            <h3 class="text-lg font-semibold mb-4">Add New Worker</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input 
                  type="text" 
                  [(ngModel)]="newWorker.name"
                  class="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="Worker name">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  [(ngModel)]="newWorker.email"
                  class="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="worker@example.com">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Contractor ID</label>
                <input 
                  type="text" 
                  [(ngModel)]="newWorker.contractorId"
                  class="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="CA12345">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tracking Mode</label>
                <select 
                  [(ngModel)]="newWorker.trackingMode"
                  class="w-full p-2 border border-gray-300 rounded-lg">
                  <option value="clock">Clock In/Out</option>
                  <option value="timesheet">Timesheet</option>
                </select>
              </div>
            </div>
            
            <div class="flex justify-end">
              <app-button 
                variant="primary"
                icon="person_add"
                (click)="addWorker()"
                [disabled]="!isNewWorkerValid()">
                Add Worker
              </app-button>
            </div>

            <!-- Error Message -->
            <div *ngIf="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <div class="flex items-center space-x-2">
                <span class="text-red-600">⚠️</span>
                <p class="text-red-800">{{ errorMessage }}</p>
              </div>
            </div>
          </div>

          <!-- Workers List -->
          <div class="card-ontop">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-semibold">Workers ({{ workers.length }})</h3>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-gray-200">
                    <th class="text-left py-3 px-4 font-medium text-gray-900">Name</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-900">Contractor ID</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-900">Tracking Mode</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-900">Invite Link</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
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
                        (ngModelChange)="updateWorker(worker)"
                        class="p-1 border border-gray-300 rounded text-sm">
                        <option value="clock">Clock In/Out</option>
                        <option value="timesheet">Timesheet</option>
                      </select>
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
                      <app-button 
                        variant="warn" 
                        size="small"
                        icon="delete"
                        (click)="deleteWorker(worker.contractorId)">
                        Delete
                      </app-button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div *ngIf="workers.length === 0" class="text-center py-8">
              <span class="text-6xl mb-4 block">👥</span>
              <h3 class="text-lg font-medium text-gray-900 mb-2">No Workers</h3>
              <p class="text-gray-600">Add workers manually or import from a CSV/Excel file.</p>
            </div>
          </div>
        </div>

        <!-- Import Workers Tab -->
        <div *ngIf="activeTab === 'import'" class="space-y-6">
          <div class="card-ontop">
            <h3 class="text-lg font-semibold mb-4">Import Workers from File</h3>
            <p class="text-gray-600 mb-6">Upload your Ontop contracts file (CSV or Excel format) to automatically import hourly workers.</p>

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
                <app-button 
                  variant="primary"
                  icon="upload_file"
                  (click)="fileInput.click()">
                  Browse Files
                </app-button>
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
                  <app-button 
                    variant="ghost" 
                    size="small"
                    icon="close"
                    (click)="removeFile()">
                  </app-button>
                </div>
                
                <app-button 
                  variant="primary"
                  icon="cloud_upload"
                  [fullWidth]="true"
                  [loading]="isProcessing"
                  [disabled]="isProcessing"
                  (click)="processFile()" 
                  class="mt-4">
                  <span *ngIf="!isProcessing">Import Workers</span>
                  <span *ngIf="isProcessing">Processing...</span>
                </app-button>
              </div>
            </div>

            <!-- Success Message -->
            <div *ngIf="successMessage" class="bg-green-50 border border-green-200 rounded-lg p-4">
              <div class="flex items-center space-x-2">
                <span class="text-green-600">✅</span>
                <p class="text-green-800">{{ successMessage }}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
      
    </app-main-layout>
  `,
  styles: [`
    /* Settings Header Styles */
    .settings-header {
      margin-bottom: var(--spacing-xl);
    }

    .settings-title {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      margin: 0 0 var(--spacing-xs) 0;
      line-height: var(--line-height-tight);
    }

    .settings-subtitle {
      font-size: var(--font-size-lg);
      color: var(--color-text-secondary);
      margin: 0;
      line-height: var(--line-height-relaxed);
    }

    /* Settings Actions in Toolbar */
    .settings-actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .max-w-6xl { 
      max-width: 72rem; 
    }
    .w-10 { 
      width: 2.5rem; 
    }
    .h-10 { 
      height: 2.5rem; 
    }
  `]
})
export class ClientSettingsComponent implements OnInit {
  activeTab = 'workers';
  workers: Worker[] = [];
  client: Client | null = null;
  
  // New worker form
  newWorker = {
    name: '',
    email: '',
    contractorId: '',
    trackingMode: 'clock' as 'clock' | 'timesheet'
  };

  // File import
  selectedFile: File | null = null;
  isProcessing = false;
  isDragOver = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private storage: StorageService,
    private csvService: CsvImportService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.workers = this.storage.getWorkers();
    this.client = this.storage.getClientData();
  }

  isNewWorkerValid(): boolean {
    return !!(
      this.newWorker.name.trim() &&
      this.newWorker.email.trim() &&
      this.newWorker.contractorId.trim() &&
      !this.workers.some(w => w.contractorId === this.newWorker.contractorId || w.email === this.newWorker.email)
    );
  }

  addWorker() {
    if (!this.isNewWorkerValid()) return;

    const worker: Worker = {
      contractorId: this.newWorker.contractorId.trim(),
      name: this.newWorker.name.trim(),
      email: this.newWorker.email.trim(),
      inviteToken: this.csvService.generateInviteToken(),
      isActive: false,
      trackingMode: this.newWorker.trackingMode
    };

    this.workers.push(worker);
    this.storage.saveWorkers(this.workers);

    // Update client data
    if (this.client) {
      this.client.workers = this.workers;
      this.storage.saveClientData(this.client);
    }

    // Reset form
    this.newWorker = {
      name: '',
      email: '',
      contractorId: '',
      trackingMode: 'clock'
    };

    this.errorMessage = '';
  }

  updateWorker(worker: Worker) {
    this.storage.saveWorkers(this.workers);
    
    // Update client data
    if (this.client) {
      this.client.workers = this.workers;
      this.storage.saveClientData(this.client);
    }
  }

  deleteWorker(contractorId: string) {
    if (!confirm('Are you sure you want to delete this worker? This will also remove all their time entries.')) {
      return;
    }

    this.workers = this.workers.filter(w => w.contractorId !== contractorId);
    this.storage.saveWorkers(this.workers);

    // Update client data
    if (this.client) {
      this.client.workers = this.workers;
      this.storage.saveClientData(this.client);
    }

    // Remove worker's time entries
    const allEntries = this.storage.getTimeEntries();
    const filteredEntries = allEntries.filter(entry => entry.workerId !== contractorId);
    this.storage.saveTimeEntries(filteredEntries);
  }

  copyInviteLink(token: string) {
    const link = `${window.location.origin}/worker/${token}`;
    navigator.clipboard.writeText(link).then(() => {
      // Could add a toast notification here
      console.log('Invite link copied:', link);
    });
  }

  // File import methods
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
      const newWorkers = this.csvService.parseOntopData(fileContent);

      if (newWorkers.length === 0) {
        throw new Error('No hourly workers found in the file. Make sure workers have "Per hour" as payment unit.');
      }

      // Filter out existing workers (by contractor ID or email)
      const existingIds = new Set(this.workers.map(w => w.contractorId));
      const existingEmails = new Set(this.workers.map(w => w.email));
      
      const uniqueWorkers = newWorkers.filter(worker => 
        !existingIds.has(worker.contractorId) && !existingEmails.has(worker.email)
      );

      if (uniqueWorkers.length === 0) {
        throw new Error('All workers from the file already exist in your system.');
      }

      // Add new workers to existing list
      this.workers.push(...uniqueWorkers);
      this.storage.saveWorkers(this.workers);
      
      // Update client data
      if (this.client) {
        this.client.workers = this.workers;
        this.storage.saveClientData(this.client);
      }

      this.successMessage = `Successfully imported ${uniqueWorkers.length} new workers!`;
      this.selectedFile = null;
      
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to process file';
    } finally {
      this.isProcessing = false;
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  getWorkerInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  goToDashboard() {
    this.router.navigate(['/client/dashboard']);
  }

  resetAllData() {
    if (confirm('⚠️ WARNING: This will delete ALL data including workers, time entries, and settings. This cannot be undone. Are you sure?')) {
      // Clear all storage
      localStorage.clear();
      alert('All data has been reset. You will be redirected to the setup page.');
      this.router.navigate(['/client/setup']);
    }
  }
} 