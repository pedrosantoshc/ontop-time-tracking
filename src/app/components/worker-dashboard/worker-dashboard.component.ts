import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { StorageService } from '../../services/storage.service';
import { Worker, WorkerDashboardEntry, WorkerStats, StatusFilter, TimeEntry } from '../../models/interfaces';
import { TimeEntryEditorComponent } from '../shared/time-entry-editor';
import type { TimeEntryEditorConfig } from '../shared/time-entry-editor';
import { EditTrackingService } from '../../services/edit-tracking.service';

@Component({
  selector: 'app-worker-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressBarModule,
    TimeEntryEditorComponent
  ],
  templateUrl: './worker-dashboard.component.html',
  styleUrls: ['./worker-dashboard.component.css']
})
export class WorkerDashboardComponent implements OnInit {
  worker: Worker | null = null;
  entries: WorkerDashboardEntry[] = [];
  filteredEntries: WorkerDashboardEntry[] = [];
  stats: WorkerStats = {
    totalHours: 0,
    approvedHours: 0,
    pendingHours: 0,
    rejectedHours: 0,
    entriesCount: { total: 0, approved: 0, pending: 0, rejected: 0 },
    thisWeekHours: 0,
    thisMonthHours: 0
  };
  
  activeFilter = 'all';
  
  statusFilters: StatusFilter[] = [
    { key: 'all', label: 'All', color: 'text-gray-600', icon: 'list' },
    { key: 'approved', label: 'Approved', color: 'text-green-600', icon: 'check_circle' },
    { key: 'pending', label: 'Pending', color: 'text-yellow-600', icon: 'schedule' },
    { key: 'rejected', label: 'Rejected', color: 'text-red-600', icon: 'cancel' }
  ];

  // Editor modal state
  showEditModal = false;
  editModalConfig: TimeEntryEditorConfig | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storage: StorageService,
    private editTrackingService: EditTrackingService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.loadWorkerData(token);
      }
    });
  }

  loadWorkerData(token: string) {
    this.worker = this.storage.getWorkerByToken(token);
    if (this.worker) {
      this.entries = this.storage.getWorkerEntryHistory(this.worker.contractorId);
      this.stats = this.storage.getWorkerStats(this.worker.contractorId);
      this.applyFilter();
    }
  }

  setActiveFilter(filter: string) {
    this.activeFilter = filter;
    this.applyFilter();
  }

  applyFilter() {
    switch (this.activeFilter) {
      case 'approved':
        this.filteredEntries = this.entries.filter(e => e.timeEntry.status === 'approved');
        break;
      case 'pending':
        this.filteredEntries = this.entries.filter(e => 
          e.timeEntry.status === 'draft' || e.timeEntry.status === 'submitted'
        );
        break;
      case 'rejected':
        this.filteredEntries = this.entries.filter(e => e.timeEntry.status === 'rejected');
        break;
      default:
        this.filteredEntries = [...this.entries];
    }
    
    // Sort by date descending
    this.filteredEntries.sort((a, b) => 
      new Date(b.timeEntry.date).getTime() - new Date(a.timeEntry.date).getTime()
    );
  }

  getCountForFilter(filter: string): number {
    switch (filter) {
      case 'approved': return this.stats.entriesCount.approved;
      case 'pending': return this.stats.entriesCount.pending;
      case 'rejected': return this.stats.entriesCount.rejected;
      default: return this.stats.entriesCount.total;
    }
  }

  getFilterTabClass(filter: string): string {
    return filter === this.activeFilter ? 'filter-tab-active' : 'filter-tab-inactive';
  }

  getStatusChipClass(status: string): string {
    const classes = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return classes[status as keyof typeof classes] || classes.draft;
  }

  getProofIcon(type: string): string {
    const icons = {
      screenshot: 'photo_camera',
      file: 'attach_file',
      note: 'note'
    };
    return icons[type as keyof typeof icons] || 'attachment';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatHours(hours: number): string {
    return hours.toFixed(1);
  }

  calculateEntryHours(entry: any): number {
    if (entry.manualHours) return entry.manualHours;
    if (entry.startTime && entry.endTime) {
      const start = new Date(`${entry.date}T${entry.startTime}`);
      const end = new Date(`${entry.date}T${entry.endTime}`);
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }
    return 0;
  }

  navigateToTracking() {
    if (this.worker) {
      this.router.navigate(['/worker', this.worker.inviteToken]);
    }
  }

  editEntry(entry: TimeEntry) {
    const canEdit = this.editTrackingService.canEdit(entry);
    
    this.editModalConfig = {
      timeEntry: entry,
      readOnly: !canEdit,
      onSave: (editedEntry: TimeEntry) => {
        this.storage.updateTimeEntry(editedEntry);
        this.loadWorkerData(this.worker!.inviteToken);
      },
      onCancel: () => {
        this.closeEditModal();
      },
      onClose: () => {
        this.closeEditModal();
      }
    };
    this.showEditModal = true;
  }

  resubmitEntry(entry: TimeEntry) {
    // For rejected entries, allow worker to edit and resubmit
    this.editEntry(entry);
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editModalConfig = null;
  }

  onEditModalVisibilityChange(isVisible: boolean) {
    this.showEditModal = isVisible;
    if (!isVisible) {
      this.editModalConfig = null;
    }
  }
}