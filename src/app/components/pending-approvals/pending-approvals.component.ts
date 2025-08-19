import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApprovalService } from '../../services/approval.service';
import { TimeEntry, Worker } from '../../models/interfaces';
import { StorageService } from '../../services/storage.service';
import { getInitials, formatDate, formatHours } from '../../utils/helpers';
import { ProofViewerModalComponent } from '../shared/proof-viewer-modal';
import type { ProofViewerConfig } from '../shared/proof-viewer-modal';

@Component({
  selector: 'app-pending-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, ProofViewerModalComponent],
  template: `
    <div class="card-ontop mt-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Pending Approvals ({{ pendingEntries.length }})</h3>
        <div class="space-x-2">
          <button mat-raised-button color="primary" size="small" (click)="bulkApprove()">Approve All</button>
          <button mat-stroked-button color="warn" size="small" (click)="bulkReject()">Reject All</button>
          <button mat-icon-button (click)="close.emit()" aria-label="Close">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 font-medium text-gray-900">Worker</th>
              <th class="text-left py-3 px-4 font-medium text-gray-900">Date</th>
              <th class="text-left py-3 px-4 font-medium text-gray-900">Hours</th>
              <th class="text-left py-3 px-4 font-medium text-gray-900">Type</th>
              <th class="text-left py-3 px-4 font-medium text-gray-900">Description</th>
              <th class="text-left py-3 px-4 font-medium text-gray-900">Proof</th>
              <th class="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let entry of pendingEntries" class="border-b border-gray-100 hover:bg-gray-50">
              <td class="py-3 px-4">
                <div class="flex items-center space-x-2" *ngIf="getWorker(entry.workerId) as worker">
                  <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span class="text-xs font-medium">{{ getInitials(worker.name) }}</span>
                  </div>
                  <span class="font-medium">{{ worker.name }}</span>
                </div>
              </td>
              <td class="py-3 px-4">{{ formatDate(entry.date) }}</td>
              <td class="py-3 px-4">{{ formatHours(getEntryHours(entry)) }}h</td>
              <td class="py-3 px-4">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      [class]="entry.startTime ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'">
                  {{ entry.startTime ? 'Clock' : 'Manual' }}
                </span>
              </td>
              <td class="py-3 px-4 text-gray-600 max-w-xs truncate">{{ entry.description || '—' }}</td>
              <td class="py-3 px-4">
                <button *ngIf="entry.proofOfWork.length > 0" 
                        (click)="viewProofOfWork(entry)"
                        mat-stroked-button
                        class="text-sm flex items-center space-x-1">
                  <mat-icon>visibility</mat-icon>
                  <span>View Proof ({{ entry.proofOfWork.length }})</span>
                </button>
                <span *ngIf="entry.proofOfWork.length === 0" class="text-gray-400 text-xs">No proof</span>
              </td>
              <td class="py-3 px-4 space-x-2">
                <button (click)="approve(entry)" 
                        mat-raised-button 
                        color="primary" 
                        class="text-sm mr-2">
                  <mat-icon>check</mat-icon>
                  Approve
                </button>
                <button (click)="reject(entry)" 
                        mat-stroked-button 
                        color="warn" 
                        class="text-sm">
                  <mat-icon>close</mat-icon>
                  Reject
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="pendingEntries.length === 0" class="text-center py-8 text-gray-600">
          No pending entries. 🎉
        </div>
      </div>
    </div>

    <!-- New Proof Viewer Modal -->
    <app-proof-viewer-modal
      [config]="proofViewerConfig"
      [isVisible]="showProofModal"
      (isVisibleChange)="onProofModalVisibilityChange($event)">
    </app-proof-viewer-modal>
  `,
  styles: []
})
export class PendingApprovalsComponent {
  @Output() close = new EventEmitter<void>();
  pendingEntries: TimeEntry[] = [];
  private workers: Worker[] = [];
  
  // Modal state
  showProofModal = false;
  proofViewerConfig: ProofViewerConfig | null = null;

  constructor(private approval: ApprovalService, private storage: StorageService) {
    this.refresh();
  }

  refresh() {
    this.pendingEntries = this.approval.getPendingEntries();
    this.workers = this.storage.getWorkers();
  }

  getWorker(id: string): Worker | undefined {
    return this.workers.find(w => w.contractorId === id);
  }

  approve(entry: TimeEntry) {
    this.approval.approveEntry(entry);
    this.refresh();
  }

  reject(entry: TimeEntry) {
    const reason = prompt('Reason for rejection (optional):');
    this.approval.rejectEntry(entry, reason || undefined);
    this.refresh();
  }

  bulkApprove() {
    if (!confirm('Approve ALL pending entries?')) return;
    this.approval.approveAll(this.pendingEntries);
    this.refresh();
  }

  bulkReject() {
    if (!confirm('Reject ALL pending entries?')) return;
    const reason = prompt('Reason for rejection (optional):');
    this.approval.rejectAll(this.pendingEntries, reason || undefined);
    this.refresh();
  }

  getInitials = getInitials;
  formatDate = formatDate;
  formatHours = formatHours;

  getEntryHours(entry: TimeEntry): number {
    if (entry.manualHours) return entry.manualHours;
    if (entry.startTime && entry.endTime) {
      const start = new Date(`2000-01-01T${entry.startTime}`);
      const end = new Date(`2000-01-01T${entry.endTime}`);
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }
    return 0;
  }

  // Proof of Work Modal Methods
  viewProofOfWork(entry: TimeEntry) {
    this.proofViewerConfig = {
      timeEntry: entry,
      onApprove: () => {
        this.approval.approveEntry(entry);
        this.refresh();
      },
      onReject: (notes: string) => {
        this.approval.rejectEntry(entry, notes);
        this.refresh();
      },
      onClose: () => {
        this.closeProofModal();
      }
    };
    this.showProofModal = true;
  }

  closeProofModal() {
    this.showProofModal = false;
    this.proofViewerConfig = null;
  }

  onProofModalVisibilityChange(isVisible: boolean) {
    this.showProofModal = isVisible;
    if (!isVisible) {
      this.proofViewerConfig = null;
    }
  }


} 