import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { Client, Worker, TimeEntry } from '../../models/interfaces';

interface WorkerReport {
  reference: string;       // Worker ID
  workerName: string;      // Worker name
  email: string;           // Worker email  
  totalHours: number;      // Consolidated total hours
  approvedHours: number;   // Only approved hours
  pendingHours: number;    // Pending approval hours
  rejectedHours: number;   // Rejected hours
  lastActivity: string;    // Last time entry date
  status: string;          // Overall status
}

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-ontop-gray p-4">
      <div class="max-w-6xl mx-auto">
        
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-ontop-blue rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-lg">🏢</span>
              </div>
              <div>
                <h1 class="text-2xl font-bold text-gray-900">ontop</h1>
                <p class="text-gray-600">Time Tracking Dashboard</p>
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <button 
                (click)="exportConsolidatedReport()" 
                [disabled]="isExporting"
                class="btn-ontop-primary flex items-center space-x-2">
                <span>📤</span>
                <span>{{ isExporting ? 'Exporting...' : 'Export Consolidated Report' }}</span>
              </button>
              <button 
                (click)="goToSetup()"
                class="btn-ontop-secondary flex items-center space-x-2">
                <span>⚙️</span>
                <span>Setup</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Summary Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div class="card-ontop text-center">
            <div class="text-3xl font-bold text-ontop-blue mb-2">{{ workers.length }}</div>
            <div class="text-sm text-gray-600">Total Workers</div>
          </div>
          <div class="card-ontop text-center">
            <div class="text-3xl font-bold text-yellow-600 mb-2">{{ getTotalPendingHours() }}</div>
            <div class="text-sm text-gray-600">Pending Hours</div>
          </div>
          <div class="card-ontop text-center">
            <div class="text-3xl font-bold text-green-600 mb-2">{{ getTotalApprovedHours() }}</div>
            <div class="text-sm text-gray-600">Approved Hours</div>
          </div>
          <div class="card-ontop text-center">
            <div class="text-3xl font-bold text-gray-900 mb-2">{{ getActiveWorkersCount() }}</div>
            <div class="text-sm text-gray-600">Active Workers</div>
          </div>
        </div>

        <!-- Filters -->
        <div class="card-ontop mb-6">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div class="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Period</label>
                <select [(ngModel)]="selectedPeriod" (ngModelChange)="generateWorkerReports()" 
                        class="p-2 border border-gray-300 rounded-lg">
                  <option value="thisWeek">This Week</option>
                  <option value="lastWeek">Last Week</option>
                  <option value="thisMonth">This Month</option>
                  <option value="lastMonth">Last Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              <div *ngIf="selectedPeriod === 'custom'" class="flex space-x-2">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <input type="date" [(ngModel)]="customStartDate" (ngModelChange)="generateWorkerReports()"
                         class="p-2 border border-gray-300 rounded-lg">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <input type="date" [(ngModel)]="customEndDate" (ngModelChange)="generateWorkerReports()"
                         class="p-2 border border-gray-300 rounded-lg">
                </div>
              </div>
            </div>
            <div class="text-sm text-gray-600">
              {{ getCurrentPeriodText() }}
            </div>
          </div>
        </div>

        <!-- Worker Reports Table (Consolidated) -->
        <div class="card-ontop">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold">Worker Hours Summary</h3>
            <div class="text-sm text-gray-600">
              {{ workerReports.length }} workers • {{ getTotalHours() }} total hours
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Reference</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Worker Name</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Approved Hours</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Pending Hours</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Total Hours</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Last Activity</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let report of workerReports" class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="py-3 px-4 font-mono text-sm">{{ report.reference }}</td>
                  <td class="py-3 px-4">
                    <div class="flex items-center space-x-2">
                      <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span class="text-xs font-medium">{{ getWorkerInitials(report.workerName) }}</span>
                      </div>
                      <span class="font-medium">{{ report.workerName }}</span>
                    </div>
                  </td>
                  <td class="py-3 px-4 text-gray-600">{{ report.email }}</td>
                  <td class="py-3 px-4">
                    <span class="font-medium text-green-600">{{ formatHours(report.approvedHours) }}h</span>
                  </td>
                  <td class="py-3 px-4">
                    <span class="font-medium text-yellow-600">{{ formatHours(report.pendingHours) }}h</span>
                  </td>
                  <td class="py-3 px-4">
                    <span class="font-bold text-gray-900">{{ formatHours(report.totalHours) }}h</span>
                  </td>
                  <td class="py-3 px-4 text-gray-600">{{ formatDate(report.lastActivity) }}</td>
                  <td class="py-3 px-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          [class]="getWorkerStatusClass(report)">
                      {{ report.status }}
                    </span>
                  </td>
                  <td class="py-3 px-4">
                    <button 
                      (click)="viewWorkerDetails(report.reference)"
                      class="text-ontop-blue hover:text-blue-600 text-sm font-medium">
                      👁️ View Entries
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div *ngIf="workerReports.length === 0" class="text-center py-8">
            <span class="text-6xl mb-4 block">📊</span>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No Time Data</h3>
            <p class="text-gray-600">No time entries found for the selected period.</p>
          </div>
        </div>

        <!-- Individual Entries (when viewing worker details) -->
        <div *ngIf="selectedWorkerEntries.length > 0" class="card-ontop mt-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">Individual Time Entries - {{ getSelectedWorkerName() }}</h3>
            <button (click)="clearWorkerSelection()" class="text-gray-600 hover:text-gray-800">
              ✕ Close
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Hours</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let entry of selectedWorkerEntries" class="border-b border-gray-100">
                  <td class="py-3 px-4">{{ formatDate(entry.date) }}</td>
                  <td class="py-3 px-4 font-medium">{{ getEntryHours(entry) }}h</td>
                  <td class="py-3 px-4">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          [class]="entry.startTime ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'">
                      {{ entry.startTime ? 'Clock' : 'Manual' }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-gray-600">{{ entry.description || 'No description' }}</td>
                  <td class="py-3 px-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          [class]="getStatusClass(entry.status)">
                      {{ entry.status }}
                    </span>
                  </td>
                  <td class="py-3 px-4">
                    <div class="flex items-center space-x-2">
                      <button 
                        *ngIf="entry.status !== 'approved'"
                        (click)="approveEntry(entry)" 
                        class="text-green-600 hover:text-green-800 text-sm">
                        ✅
                      </button>
                      <button 
                        *ngIf="entry.status !== 'rejected'"
                        (click)="rejectEntry(entry)" 
                        class="text-red-600 hover:text-red-800 text-sm">
                        ❌
                      </button>
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
  styles: [`
    .max-w-6xl { max-width: 72rem; }
    .w-10 { width: 2.5rem; }
    .h-10 { height: 2.5rem; }
    .text-yellow-600 { color: #d97706; }
    .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
  `]
})
export class ClientDashboardComponent implements OnInit {
  workers: Worker[] = [];
  allTimeEntries: TimeEntry[] = [];
  workerReports: WorkerReport[] = [];
  selectedWorkerEntries: TimeEntry[] = [];
  selectedWorkerId = '';
  
  // Filtering
  selectedPeriod = 'thisWeek';
  customStartDate = '';
  customEndDate = '';
  
  // Processing states
  isExporting = false;

  constructor(
    private storage: StorageService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();
    this.generateWorkerReports();
  }

  loadData() {
    this.workers = this.storage.getWorkers();
    this.allTimeEntries = this.storage.getTimeEntries();
  }

  generateWorkerReports() {
    const { startDate, endDate } = this.getDateRange();
    
    // Filter entries by date range
    const filteredEntries = this.allTimeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });

    // Group by worker and calculate totals
    this.workerReports = this.workers.map(worker => {
      const workerEntries = filteredEntries.filter(entry => entry.workerId === worker.contractorId);
      
      const approvedHours = workerEntries
        .filter(entry => entry.status === 'approved')
        .reduce((sum, entry) => sum + this.getEntryHours(entry), 0);
      
      const pendingHours = workerEntries
        .filter(entry => entry.status === 'draft' || entry.status === 'submitted')
        .reduce((sum, entry) => sum + this.getEntryHours(entry), 0);
      
      const rejectedHours = workerEntries
        .filter(entry => entry.status === 'rejected')
        .reduce((sum, entry) => sum + this.getEntryHours(entry), 0);

      const totalHours = approvedHours + pendingHours + rejectedHours;
      
      // Find last activity date
      const lastEntry = workerEntries
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      // Determine overall status
      let status = 'No Activity';
      if (pendingHours > 0) status = 'Pending Review';
      else if (approvedHours > 0) status = 'Up to Date';
      
      return {
        reference: worker.contractorId,
        workerName: worker.name,
        email: worker.email,
        totalHours,
        approvedHours,
        pendingHours,
        rejectedHours,
        lastActivity: lastEntry ? lastEntry.date : '',
        status
      };
    }).filter(report => report.totalHours > 0); // Only show workers with hours
  }

  getDateRange() {
    const today = new Date();
    let startDate: Date;
    let endDate = new Date(today);

    switch (this.selectedPeriod) {
      case 'thisWeek':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay());
        break;
      case 'lastWeek':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay() - 7);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'custom':
        startDate = this.customStartDate ? new Date(this.customStartDate) : new Date(today);
        endDate = this.customEndDate ? new Date(this.customEndDate) : new Date(today);
        break;
      default:
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay());
    }

    return { startDate, endDate };
  }

  async exportConsolidatedReport() {
    this.isExporting = true;
    
    try {
      // Generate consolidated CSV matching Ontop format
      const csvContent = this.generateConsolidatedCSV();
      
      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const periodText = this.getCurrentPeriodText().replace(/[^a-zA-Z0-9]/g, '-');
      link.setAttribute('download', `ontop-timesheet-consolidated-${periodText}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      alert('Failed to export CSV. Please try again.');
    }
    
    this.isExporting = false;
  }

  generateConsolidatedCSV(): string {
    // Headers matching Ontop format
    const headers = [
      'Reference',      // Worker ID
      'Worker name',    // Worker name
      'Email',          // Worker email
      'Total Hours',    // Consolidated hours
      'Approved Hours', // Approved hours only
      'Pending Hours',  // Pending approval
      'Status',         // Overall status
      'Period',         // Reporting period
      'Last Activity'   // Last entry date
    ];
    
    const rows = this.workerReports.map(report => [
      report.reference,
      `"${report.workerName}"`,
      report.email,
      report.totalHours.toFixed(2),
      report.approvedHours.toFixed(2),
      report.pendingHours.toFixed(2),
      report.status,
      this.getCurrentPeriodText(),
      report.lastActivity
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  viewWorkerDetails(workerId: string) {
    this.selectedWorkerId = workerId;
    const { startDate, endDate } = this.getDateRange();
    
    this.selectedWorkerEntries = this.allTimeEntries
      .filter(entry => {
        const entryDate = new Date(entry.date);
        return entry.workerId === workerId && 
               entryDate >= startDate && 
               entryDate <= endDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  clearWorkerSelection() {
    this.selectedWorkerId = '';
    this.selectedWorkerEntries = [];
  }

  approveEntry(entry: TimeEntry) {
    entry.status = 'approved';
    this.updateEntry(entry);
  }

  rejectEntry(entry: TimeEntry) {
    const reason = prompt('Reason for rejection (optional):');
    entry.status = 'rejected';
    entry.clientNotes = reason || 'Rejected';
    this.updateEntry(entry);
  }

  updateEntry(entry: TimeEntry) {
    const index = this.allTimeEntries.findIndex(e => e.id === entry.id);
    if (index !== -1) {
      this.allTimeEntries[index] = entry;
      this.storage.saveTimeEntries(this.allTimeEntries);
      this.generateWorkerReports();
    }
  }

  goToSetup() {
    this.router.navigate(['/client/setup']);
  }

  // Utility methods
  getCurrentPeriodText(): string {
    const { startDate, endDate } = this.getDateRange();
    return `${this.formatDate(startDate.toISOString())} - ${this.formatDate(endDate.toISOString())}`;
  }

  getSelectedWorkerName(): string {
    const worker = this.workers.find(w => w.contractorId === this.selectedWorkerId);
    return worker?.name || 'Unknown Worker';
  }

  getTotalHours(): string {
    const total = this.workerReports.reduce((sum, report) => sum + report.totalHours, 0);
    return total.toFixed(1);
  }

  getTotalApprovedHours(): string {
    const total = this.workerReports.reduce((sum, report) => sum + report.approvedHours, 0);
    return total.toFixed(1);
  }

  getTotalPendingHours(): string {
    const total = this.workerReports.reduce((sum, report) => sum + report.pendingHours, 0);
    return total.toFixed(1);
  }

  getActiveWorkersCount(): number {
    return this.workerReports.filter(report => report.totalHours > 0).length;
  }

  getWorkerInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getEntryHours(entry: TimeEntry): number {
    if (entry.manualHours) {
      return entry.manualHours;
    }
    
    if (entry.startTime && entry.endTime) {
      const start = new Date(`2000-01-01T${entry.startTime}`);
      const end = new Date(`2000-01-01T${entry.endTime}`);
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }
    
    return 0;
  }

  formatHours(hours: number): string {
    return hours.toFixed(1);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getWorkerStatusClass(report: WorkerReport): string {
    switch (report.status) {
      case 'Up to Date': return 'bg-green-100 text-green-800';
      case 'Pending Review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
