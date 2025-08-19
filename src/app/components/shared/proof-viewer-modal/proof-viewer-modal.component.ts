import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TimeEntry, ProofOfWork } from '../../../models/interfaces';

export interface ProofViewerConfig {
  timeEntry: TimeEntry;
  onApprove?: () => void;
  onReject?: (notes: string) => void;
  onClose?: () => void;
}

@Component({
  selector: 'app-proof-viewer-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './proof-viewer-modal.component.html',
  styleUrls: ['./proof-viewer-modal.component.css']
})
export class ProofViewerModalComponent implements OnInit {
  @Input() config: ProofViewerConfig | null = null;
  @Input() isVisible: boolean = false;
  @Output() configChange = new EventEmitter<ProofViewerConfig | null>();
  @Output() isVisibleChange = new EventEmitter<boolean>();

  currentProofIndex = 0;
  rejectNotes = '';
  showRejectForm = false;
  isProcessing = false;

  get timeEntry(): TimeEntry | null {
    return this.config?.timeEntry || null;
  }

  get currentProof(): ProofOfWork | null {
    if (!this.timeEntry?.proofOfWork.length) return null;
    return this.timeEntry.proofOfWork[this.currentProofIndex] || null;
  }

  get hasMultipleProofs(): boolean {
    return (this.timeEntry?.proofOfWork.length || 0) > 1;
  }

  get isFirstProof(): boolean {
    return this.currentProofIndex === 0;
  }

  get isLastProof(): boolean {
    return this.currentProofIndex === (this.timeEntry?.proofOfWork.length || 1) - 1;
  }

  ngOnInit() {
    this.resetModalState();
  }

  resetModalState() {
    this.currentProofIndex = 0;
    this.rejectNotes = '';
    this.showRejectForm = false;
    this.isProcessing = false;
  }

  closeModal() {
    this.isVisibleChange.emit(false);
    this.resetModalState();
    if (this.config?.onClose) {
      this.config.onClose();
    }
  }

  previousProof() {
    if (!this.isFirstProof) {
      this.currentProofIndex--;
    }
  }

  nextProof() {
    if (!this.isLastProof) {
      this.currentProofIndex++;
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  calculateHours(): string {
    if (!this.timeEntry) return '0.0';
    
    if (this.timeEntry.manualHours) {
      return this.timeEntry.manualHours.toFixed(1);
    }
    
    if (this.timeEntry.startTime && this.timeEntry.endTime) {
      const start = new Date(`${this.timeEntry.date}T${this.timeEntry.startTime}`);
      const end = new Date(`${this.timeEntry.date}T${this.timeEntry.endTime}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return hours.toFixed(1);
    }
    
    return '0.0';
  }

  getProofTypeLabel(type: string): string {
    const labels = {
      screenshot: 'Screenshot',
      file: 'File Upload',
      note: 'Note'
    };
    return labels[type as keyof typeof labels] || 'Unknown';
  }

  getFileExtension(fileName?: string): string {
    if (!fileName) return '';
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';
  }

  isImageFile(proof: ProofOfWork): boolean {
    if (proof.type === 'screenshot') return true;
    if (!proof.fileName) return false;
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const extension = proof.fileName.split('.').pop()?.toLowerCase();
    return imageExtensions.includes(extension || '');
  }

  downloadFile(proof: ProofOfWork) {
    if (!proof.content) return;
    
    try {
      const link = document.createElement('a');
      link.href = proof.content;
      link.download = proof.fileName || `proof-${proof.id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  }

  showRejectModal() {
    this.showRejectForm = true;
    this.rejectNotes = '';
  }

  hideRejectModal() {
    this.showRejectForm = false;
    this.rejectNotes = '';
  }

  approveEntry() {
    if (this.config?.onApprove && !this.isProcessing) {
      this.isProcessing = true;
      this.config.onApprove();
      this.closeModal();
    }
  }

  rejectEntry() {
    if (this.config?.onReject && this.rejectNotes.trim() && !this.isProcessing) {
      this.isProcessing = true;
      this.config.onReject(this.rejectNotes.trim());
      this.closeModal();
    }
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMSA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDMgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
    }
  }
}