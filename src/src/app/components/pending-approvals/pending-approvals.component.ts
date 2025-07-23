import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApprovalService } from '../../services/approval.service';
import { TimeEntry, Worker } from '../../models/interfaces';
import { StorageService } from '../../services/storage.service';
import { getInitials, formatDate, formatHours } from '../../utils/helpers';

@Component({
  selector: 'app-pending-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
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
                        class="text-ontop-blue hover:text-blue-600 text-sm flex items-center space-x-1">
                  <span>📎</span>
                  <span>{{ entry.proofOfWork.length }}</span>
                </button>
                <span *ngIf="entry.proofOfWork.length === 0" class="text-gray-400 text-xs">No proof</span>
              </td>
              <td class="py-3 px-4 space-x-2">
                <button (click)="approve(entry)" class="text-green-600 hover:text-green-800 text-sm">✅</button>
                <button (click)="reject(entry)" class="text-red-600 hover:text-red-800 text-sm">❌</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="pendingEntries.length === 0" class="text-center py-8 text-gray-600">
          No pending entries. 🎉
        </div>
      </div>
    </div>

    <!-- Proof of Work Modal -->
    <div *ngIf="showProofModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
         (click)="closeProofModal()">
      <div class="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden" 
           (click)="$event.stopPropagation()">
        
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Proof of Work</h3>
            <p class="text-sm text-gray-600" *ngIf="selectedEntry">
              {{ getWorker(selectedEntry.workerId)?.name }} - {{ formatDate(selectedEntry.date) }}
            </p>
          </div>
          <button (click)="closeProofModal()" 
                  class="text-gray-400 hover:text-gray-600 text-xl font-bold">
            ✕
          </button>
        </div>

        <!-- Modal Content -->
        <div class="p-6 overflow-y-auto max-h-[70vh]">
          <div *ngIf="selectedEntry" class="space-y-6">
            
            <!-- Entry Details -->
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span class="font-medium text-gray-700">Hours:</span>
                  <span class="ml-2">{{ formatHours(getEntryHours(selectedEntry)) }}h</span>
                </div>
                <div>
                  <span class="font-medium text-gray-700">Type:</span>
                  <span class="ml-2">{{ selectedEntry.startTime ? 'Clock In/Out' : 'Manual Entry' }}</span>
                </div>
                <div>
                  <span class="font-medium text-gray-700">Status:</span>
                  <span class="ml-2 capitalize">{{ selectedEntry.status }}</span>
                </div>
              </div>
              <div class="mt-3" *ngIf="selectedEntry.description">
                <span class="font-medium text-gray-700">Description:</span>
                <p class="mt-1 text-gray-800">{{ selectedEntry.description }}</p>
              </div>
            </div>

            <!-- Proof of Work Items -->
            <div class="space-y-4">
              <h4 class="font-medium text-gray-900">Attached Proof ({{ selectedEntry.proofOfWork.length }} items)</h4>
              
              <div *ngFor="let proof of selectedEntry.proofOfWork; trackBy: trackByProofId" 
                   class="border border-gray-200 rounded-lg p-4">
                
                <!-- Proof Header -->
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center space-x-2">
                    <span class="text-lg">
                      {{ proof.type === 'screenshot' ? '📷' : proof.type === 'file' ? '📄' : '📝' }}
                    </span>
                    <div>
                      <p class="font-medium text-gray-900">
                        {{ proof.fileName || (proof.type === 'screenshot' ? 'Screenshot' : 'Note') }}
                      </p>
                      <p class="text-sm text-gray-600">{{ formatTime(proof.timestamp) }}</p>
                    </div>
                  </div>
                  <div *ngIf="proof.fileSize" class="text-xs text-gray-500">
                    {{ formatFileSize(proof.fileSize) }}
                  </div>
                </div>

                <!-- Proof Description -->
                <div *ngIf="proof.description" class="mb-3">
                  <p class="text-sm text-gray-700">{{ proof.description }}</p>
                </div>

                <!-- Proof Content -->
                <div class="proof-content">
                  <!-- Screenshot Display -->
                  <div *ngIf="proof.type === 'screenshot'" class="text-center">
                    <img [src]="proof.content" 
                         alt="Screenshot proof"
                         class="max-w-full max-h-96 mx-auto rounded-lg border border-gray-300 cursor-pointer"
                         (click)="openImageFullscreen(proof.content)">
                    <p class="text-xs text-gray-500 mt-2">Click to view full size</p>
                  </div>

                  <!-- File Download -->
                  <div *ngIf="proof.type === 'file'" class="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
                    <button mat-raised-button color="primary" (click)="downloadFile(proof)" 
                            class="flex items-center space-x-2">
                      <span>⬇️</span>
                      <span>Download {{ proof.fileName }}</span>
                    </button>
                  </div>

                  <!-- Text Note -->
                  <div *ngIf="proof.type === 'note'" class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p class="text-gray-800">{{ proof.content }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div class="text-sm text-gray-600">
            Review the proof of work before making approval decisions
          </div>
          <div class="flex space-x-3">
            <button mat-stroked-button (click)="closeProofModal()">
              Close
            </button>
            <button *ngIf="selectedEntry" mat-raised-button color="primary" 
                    (click)="approveFromModal(selectedEntry)">
              ✅ Approve
            </button>
            <button *ngIf="selectedEntry" mat-stroked-button color="warn" 
                    (click)="rejectFromModal(selectedEntry)">
              ❌ Reject
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Fullscreen Image Modal -->
    <div *ngIf="fullscreenImage" class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-60" 
         (click)="closeFullscreenImage()">
      <img [src]="fullscreenImage" 
           alt="Fullscreen view"
           class="max-w-full max-h-full object-contain"
           (click)="$event.stopPropagation()">
      <button (click)="closeFullscreenImage()" 
              class="absolute top-4 right-4 text-white text-2xl font-bold bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center">
        ✕
      </button>
    </div>
  `,
  styles: []
})
export class PendingApprovalsComponent {
  @Output() close = new EventEmitter<void>();
  pendingEntries: TimeEntry[] = [];
  private workers: Worker[] = [];
  
  // Modal state
  showProofModal = false;
  selectedEntry: TimeEntry | null = null;
  fullscreenImage: string | null = null;

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
    this.selectedEntry = entry;
    this.showProofModal = true;
  }

  closeProofModal() {
    this.showProofModal = false;
    this.selectedEntry = null;
  }

  approveFromModal(entry: TimeEntry) {
    this.approve(entry);
    this.closeProofModal();
  }

  rejectFromModal(entry: TimeEntry) {
    this.reject(entry);
    this.closeProofModal();
  }

  openImageFullscreen(imageData: string) {
    this.fullscreenImage = imageData;
  }

  closeFullscreenImage() {
    this.fullscreenImage = null;
  }

  downloadFile(proof: any) {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(proof.content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray]);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = proof.fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error downloading file');
    }
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  trackByProofId(index: number, proof: any): string {
    return proof.id;
  }
} 