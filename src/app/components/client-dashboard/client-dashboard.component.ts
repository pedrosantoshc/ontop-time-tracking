import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { Client, Worker, TimeEntry, WorkerSummary } from '../../models/interfaces';

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
                (click)="exportToCSV()" 
                [disabled]="isExporting"
                class="btn-ontop-primary flex items-center space-x-2">
                <span>📤</span>
                <span>{{ isExporting ? 'Exporting...' : 'Export Report' }}</span>
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
            <div class="text-3xl font-bold text-yellow-600 mb-2">{{ pendingEntries.length }}</div>
            <div class="text-sm text-gray-600">Pending Review</div>
          </div>
          <div class="card-ontop text-center">
            <div class="text-3xl font-bold text-green-600 mb-2">{{ formatHours(totalHoursThisWeek) }}</div>
            <div class="text-sm text-gray-600">Hours This Week</div>
          </div>
          <div class="card-ontop text-center">
            <div class="text-3xl font-bold text-gray-900 mb-2">{{ activeWorkers }}</div>
            <div class="text-sm text-gray-600">Active Today</div>
          </div>
        </div>

        <!-- Filters and Controls -->
        <div class="card-ontop mb-6">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div class="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
                <select [(ngModel)]="selectedStatus" (ngModelChange)="filterEntries()" 
                        class="p-2 border border-gray-300 rounded-lg">
                  <option value="">All Entries</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Worker</label>
                <select [(ngModel)]="selectedWorker" (ngModelChange)="filterEntries()" 
                        class="p-2 border border-gray-300 rounded-lg">
                  <option value="">All Workers</option>
                  <option *ngFor="let worker of workers" [value]="worker.contractorId">
                    {{ worker.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select [(ngModel)]="selectedDateRange" (ngModelChange)="filterEntries()" 
                        class="p-2 border border-gray-300 rounded-lg">
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            </div>
            <div *ngIf="selectedEntries.length > 0" class="flex space-x-2">
              <button 
                (click)="bulkApprove()" 
                [disabled]="isProcessing"
                class="btn-ontop-primary text-sm">
                ✅ Approve Selected ({{ selectedEntries.length }})
              </button>
              <button 
                (click)="bulkReject()" 
                [disabled]="isProcessing"
                class="btn-ontop-secondary text-sm">
                ❌ Reject Selected
              </button>
            </div>
          </div>
        </div>

        <!-- Time Entries Table -->
        <div class="card-ontop">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold">Time Entries Review</h3>
            <div class="text-sm text-gray-600">
              Showing {{ filteredEntries.length }} of {{ allTimeEntries.length }} entries
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-left py-3 px-4">
                    <input 
                      type="checkbox" 
                      [checked]="allFilteredSelected"
                      (change)="toggleSelectAll($event)"
                      class="rounded">
                  </th>
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Worker</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Hours</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Proof</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let entry of filteredEntries; trackBy: trackByEntryId" 
                    class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="py-3 px-4">
                    <input 
                      type="checkbox" 
                      [checked]="selectedEntries.includes(entry.id)"
                      (change)="toggleEntrySelection(entry.id, $event)"
                      class="rounded">
                  </td>
                  <td class="py-3 px-4">
                    <div class="flex items-center space-x-2">
                      <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span class="text-xs font-medium">{{ getWorkerInitials(entry.workerId) }}</span>
                      </div>
                      <span class="font-medium">{{ getWorkerName(entry.workerId) }}</span>
                    </div>
                  </td>
                  <td class="py-3 px-4 text-gray-600">{{ formatDate(entry.date) }}</td>
                  <td class="py-3 px-4 font-medium">{{ getEntryHours(entry) }}h</td>
                  <td class="py-3 px-4">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          [class]="entry.startTime ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'">
                      {{ entry.startTime ? 'Clock' : 'Manual' }}
                    </span>
                  </td>
                  <td class="py-3 px-4 max-w-xs">
                    <div class="truncate text-gray-600" [title]="entry.description">
                      {{ entry.description || 'No description' }}
                    </div>
                    <div *ngIf="entry.startTime && entry.endTime" class="text-xs text-gray-500">
                      {{ entry.startTime }} - {{ entry.endTime }}
                    </div>
                  </td>
                  <td class="py-3 px-4">
                    <div class="flex items-center space-x-1">
                      <span *ngFor="let proof of entry.proofOfWork" 
                            class="inline-block w-6 h-6 text-center"
                            [title]="proof.type">
                        <span *ngIf="proof.type === 'screenshot'">📷</span>
                        <span *ngIf="proof.type === 'file'">📎</span>
                        <span *ngIf="proof.type === 'note'">📝</span>
                      </span>
                      <span *ngIf="entry.proofOfWork.length === 0" class="text-gray-400 text-xs">None</span>
                    </div>
                  </td>
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
                        [disabled]="isProcessing"
                        class="text-green-600 hover:text-green-800 text-sm font-medium">
                        ✅ Approve
                      </button>
                      <button 
                        *ngIf="entry.status !== 'rejected'"
                        (click)="rejectEntry(entry)" 
                        [disabled]="isProcessing"
                        class="text-red-600 hover:text-red-800 text-sm font-medium">
                        ❌ Reject
                      </button>
                      <button 
                        (click)="viewEntry(entry)"
                        class="text-ontop-blue hover:text-blue-600 text-sm font-medium">
                        👁️ View
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div *ngIf="filteredEntries.length === 0" class="text-center py-8">
            <span class="text-6xl mb-4 block">📋</span>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No Time Entries Found</h3>
            <p class="text-gray-600">
              {{ allTimeEntries.length === 0 ? 'Workers haven\'t submitted any time entries yet.' : 'No entries match your current filters.' }}
            </p>
          </div>
        </div>

      </div>
    </div>

    <!-- Entry Details Modal -->
    <div *ngIf="selectedEntryForView" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">Time Entry Details</h3>
            <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600">
              <span class="text-xl">✕</span>
            </button>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Worker</label>
                <p class="text-gray-900">{{ getWorkerName(selectedEntryForView.workerId) }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Date</label>
                <p class="text-gray-900">{{ formatDate(selectedEntryForView.date) }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Hours</label>
                <p class="text-gray-900 font-medium">{{ getEntryHours(selectedEntryForView) }}h</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Type</label>
                <p class="text-gray-900">{{ selectedEntryForView.startTime ? 'Clock In/Out' : 'Manual Entry' }}</p>
              </div>
            </div>

            <div *ngIf="selectedEntryForView.startTime && selectedEntryForView.endTime">
              <label class="block text-sm font-medium text-gray-700">Time Period</label>
              <p class="text-gray-900">{{ selectedEntryForView.startTime }} - {{ selectedEntryForView.endTime }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Description</label>
              <p class="text-gray-900">{{ selectedEntryForView.description || 'No description provided' }}</p>
            </div>

            <div *ngIf="selectedEntryForView.proofOfWork.length > 0">
              <label class="block text-sm font-medium text-gray-700 mb-2">Proof of Work</label>
              <div class="space-y-2">
                <div *ngFor="let proof of selectedEntryForView.proofOfWork" class="border rounded-lg p-3">
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-medium">{{ proof.fileName || 'Screenshot' }}</span>
                    <span class="text-sm text-gray-600">{{ formatTime(proof.timestamp) }}</span>
                  </div>
                  <div *ngIf="proof.type === 'screenshot'" class="mb-2">
                    <img [src]="proof.content" alt="Screenshot" class="max-w-full h-auto rounded border">
                  </div>
                  <p *ngIf="proof.description" class="text-sm text-gray-600">{{ proof.description }}</p>
                </div>
              </div>
            </div>

            <div *ngIf="selectedEntryForView.clientNotes">
              <label class="block text-sm font-medium text-gray-700">Client Notes</label>
              <p class="text-gray-900">{{ selectedEntryForView.clientNotes }}</p>
            </div>

            <div class="flex items-center space-x-4 pt-4 border-t">
              <button 
                *ngIf="selectedEntryForView.status !== 'approved'"
                (click)="approveEntry(selectedEntryForView); closeModal()" 
                class="btn-ontop-primary">
                ✅ Approve Entry
              </button>
              <button 
                *ngIf="selectedEntryForView.status !== 'rejected'"
                (click)="rejectEntry(selectedEntryForView); closeModal()" 
                class="btn-ontop-secondary">
                ❌ Reject Entry
              </button>
              <button (click)="closeModal()" class="text-gray-600 hover:text-gray-800">
                Cancel
              </button>
            </div>
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
    .max-w-xs { max-width: 20rem; }
    .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .z-50 { z-index: 50; }
    .fixed { position: fixed; }
    .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
    .bg-opacity-50 { background-color: rgba(0, 0, 0, 0.5); }
  `]
})
export class ClientDashboardComponent implements OnInit {
  workers: Worker[] = [];
  allTimeEntries: TimeEntry[] = [];
  filteredEntries: TimeEntry[] = [];
  pendingEntries: TimeEntry[] = [];
  
  // Filtering
  selectedStatus = '';
  selectedWorker = '';
  selectedDateRange = 'week';
  
  // Selection
  selectedEntries: string[] = [];
  allFilteredSelected = false;
  
  // Modal
  selectedEntryForView: TimeEntry | null = null;
  
  // Processing states
  isProcessing = false;
  isExporting = false;
  
  // Stats
  totalHoursThisWeek = 0;
  activeWorkers = 0;

  constructor(
    private storage: StorageService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.workers = this.storage.getWorkers();
    this.allTimeEntries = this.storage.getTimeEntries();
    this.calculateStats();
    this.filterEntries();
  }

  calculateStats() {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    // Calculate total hours this week
    this.totalHoursThisWeek = this.allTimeEntries
      .filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= weekStart && entryDate <= today;
      })
      .reduce((total, entry) => total + this.getEntryHours(entry), 0);
    
    // Calculate active workers today
    const todayString = today.toISOString().split('T')[0];
    const todayWorkers = new Set(
      this.allTimeEntries
        .filter(entry => entry.date === todayString)
        .map(entry => entry.workerId)
    );
    this.activeWorkers = todayWorkers.size;
    
    // Get pending entries
    this.pendingEntries = this.allTimeEntries.filter(entry => 
      entry.status === 'draft' || entry.status === 'submitted'
    );
  }

  filterEntries() {
    this.filteredEntries = this.allTimeEntries.filter(entry => {
      // Status filter
      if (this.selectedStatus && entry.status !== this.selectedStatus) {
        return false;
      }
      
      // Worker filter
      if (this.selectedWorker && entry.workerId !== this.selectedWorker) {
        return false;
      }
      
      // Date range filter
      const entryDate = new Date(entry.date);
      const today = new Date();
      
      switch (this.selectedDateRange) {
        case 'today':
          return entry.date === today.toISOString().split('T')[0];
        case 'week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          return entryDate >= weekStart && entryDate <= today;
        case 'month':
          return entryDate.getMonth() === today.getMonth() && 
                 entryDate.getFullYear() === today.getFullYear();
        default:
          return true;
      }
    });
    
    // Sort by date (newest first) and then by status priority
    this.filteredEntries.sort((a, b) => {
      const statusOrder = { 'submitted': 0, 'draft': 1, 'approved': 2, 'rejected': 3 };
      if (a.date !== b.date) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return statusOrder[a.status] - statusOrder[b.status];
    });
    
    // Reset selection
    this.selectedEntries = [];
    this.updateSelectAllState();
  }

  toggleSelectAll(event: any) {
    if (event.target.checked) {
      this.selectedEntries = this.filteredEntries.map(entry => entry.id);
    } else {
      this.selectedEntries = [];
    }
    this.updateSelectAllState();
  }

  toggleEntrySelection(entryId: string, event: any) {
    if (event.target.checked) {
      this.selectedEntries.push(entryId);
    } else {
      this.selectedEntries = this.selectedEntries.filter(id => id !== entryId);
    }
    this.updateSelectAllState();
  }

  updateSelectAllState() {
    this.allFilteredSelected = this.filteredEntries.length > 0 && 
      this.selectedEntries.length === this.filteredEntries.length;
  }

  async approveEntry(entry: TimeEntry) {
    entry.status = 'approved';
    entry.clientNotes = 'Approved';
    this.updateEntry(entry);
  }

  async rejectEntry(entry: TimeEntry) {
    const reason = prompt('Reason for rejection (optional):');
    entry.status = 'rejected';
    entry.clientNotes = reason || 'Rejected';
    this.updateEntry(entry);
  }

  bulkApprove() {
    this.isProcessing = true;
    const entriesToUpdate = this.allTimeEntries.filter(entry => 
      this.selectedEntries.includes(entry.id)
    );
    
    entriesToUpdate.forEach(entry => {
      entry.status = 'approved';
      entry.clientNotes = 'Bulk approved';
    });
    
    this.storage.saveTimeEntries(this.allTimeEntries);
    this.selectedEntries = [];
    this.loadData();
    this.isProcessing = false;
  }

  bulkReject() {
    const reason = prompt('Reason for rejection (optional):');
    this.isProcessing = true;
    
    const entriesToUpdate = this.allTimeEntries.filter(entry => 
      this.selectedEntries.includes(entry.id)
    );
    
    entriesToUpdate.forEach(entry => {
      entry.status = 'rejected';
      entry.clientNotes = reason || 'Bulk rejected';
    });
    
    this.storage.saveTimeEntries(this.allTimeEntries);
    this.selectedEntries = [];
    this.loadData();
    this.isProcessing = false;
  }

  updateEntry(entry: TimeEntry) {
    const index = this.allTimeEntries.findIndex(e => e.id === entry.id);
    if (index !== -1) {
      this.allTimeEntries[index] = entry;
      this.storage.saveTimeEntries(this.allTimeEntries);
      this.loadData();
    }
  }

  viewEntry(entry: TimeEntry) {
    this.selectedEntryForView = entry;
  }

  closeModal() {
    this.selectedEntryForView = null;
  }

  async exportToCSV() {
    this.isExporting = true;
    
    try {
      // Get approved entries for export
      const approvedEntries = this.allTimeEntries.filter(entry => entry.status === 'approved');
      
      if (approvedEntries.length === 0) {
        alert('No approved entries to export.');
        this.isExporting = false;
        return;
      }
      
      // Generate CSV content
      const csvContent = this.generateCSVContent(approvedEntries);
      
      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `ontop-timesheet-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      alert('Failed to export CSV. Please try again.');
    }
    
    this.isExporting = false;
  }

  generateCSVContent(entries: TimeEntry[]): string {
    const headers = [
      'contractor_id',
      'name',
      'email',
      'date',
      'hours',
      'type',
      'description',
      'start_time',
      'end_time',
      'status',
      'client_notes',
      'proof_of_work_count'
    ];
    
    const rows = entries.map(entry => {
      const worker = this.workers.find(w => w.contractorId === entry.workerId);
      return [
        entry.workerId,
        worker?.name || 'Unknown',
        worker?.email || '',
        entry.date,
        this.getEntryHours(entry).toString(),
        entry.startTime ? 'clock' : 'manual',
        entry.description ? `"${entry.description.replace(/"/g, '""')}"` : '',
        entry.startTime || '',
        entry.endTime || '',
        entry.status,
        entry.clientNotes ? `"${entry.clientNotes.replace(/"/g, '""')}"` : '',
        entry.proofOfWork.length.toString()
      ];
    });
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  goToSetup() {
    this.router.navigate(['/client/setup']);
  }

  // Utility methods
  trackByEntryId(index: number, entry: TimeEntry): string {
    return entry.id;
  }

  getWorkerName(workerId: string): string {
    const worker = this.workers.find(w => w.contractorId === workerId);
    return worker?.name || 'Unknown Worker';
  }

  getWorkerInitials(workerId: string): string {
    const name = this.getWorkerName(workerId);
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

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
