import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TimeEntry, EditRecord } from '../../../models/interfaces';
import { EditTrackingService } from '../../../services/edit-tracking.service';

export interface TimeEntryEditorConfig {
  timeEntry: TimeEntry;
  readOnly?: boolean;
  onSave?: (editedEntry: TimeEntry) => void;
  onCancel?: () => void;
  onClose?: () => void;
}

@Component({
  selector: 'app-time-entry-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './time-entry-editor.component.html',
  styleUrls: ['./time-entry-editor.component.css']
})
export class TimeEntryEditorComponent implements OnInit, OnChanges {
  @Input() config: TimeEntryEditorConfig | null = null;
  @Input() isVisible: boolean = false;
  @Output() configChange = new EventEmitter<TimeEntryEditorConfig | null>();
  @Output() isVisibleChange = new EventEmitter<boolean>();

  editedEntry: TimeEntry | null = null;
  originalEntry: TimeEntry | null = null;
  isProcessing = false;
  errorMessage = '';
  hasChanges = false;
  editPermissions: { canEdit: boolean; reason?: string } = { canEdit: true };

  // Form validation
  validationErrors: { [key: string]: string } = {};

  constructor(private editTrackingService: EditTrackingService) {}

  ngOnInit() {
    this.initializeEditor();
  }

  ngOnChanges() {
    if (this.config?.timeEntry) {
      this.initializeEditor();
    }
  }

  initializeEditor() {
    if (this.config?.timeEntry) {
      this.originalEntry = { ...this.config.timeEntry };
      this.editedEntry = { ...this.config.timeEntry };
      this.editPermissions = this.editTrackingService.validateEditPermissions(this.editedEntry);
      this.hasChanges = false;
      this.errorMessage = '';
      this.validationErrors = {};
    }
  }

  get canEdit(): boolean {
    return !this.config?.readOnly && this.editPermissions.canEdit;
  }

  get isClockEntry(): boolean {
    return !!(this.editedEntry?.startTime && this.editedEntry?.endTime);
  }

  get isManualEntry(): boolean {
    return !!this.editedEntry?.manualHours;
  }

  onFieldChange(field: string, newValue: any) {
    if (!this.editedEntry || !this.originalEntry) return;

    (this.editedEntry as any)[field] = newValue;
    this.checkForChanges();
    this.validateForm();
  }

  checkForChanges() {
    if (!this.editedEntry || !this.originalEntry) return;

    const fieldsToCompare = ['date', 'startTime', 'endTime', 'manualHours', 'description'];
    
    this.hasChanges = fieldsToCompare.some(field => {
      return (this.editedEntry as any)[field] !== (this.originalEntry as any)[field];
    });
  }

  validateForm(): boolean {
    this.validationErrors = {};

    if (!this.editedEntry) return false;

    // Validate date
    if (!this.editedEntry.date) {
      this.validationErrors['date'] = 'Date is required';
    }

    // Validate manual hours
    if (this.isManualEntry) {
      if (!this.editedEntry.manualHours || this.editedEntry.manualHours <= 0) {
        this.validationErrors['manualHours'] = 'Hours must be greater than 0';
      }
      if (this.editedEntry.manualHours && this.editedEntry.manualHours > 24) {
        this.validationErrors['manualHours'] = 'Hours cannot exceed 24 per day';
      }
    }

    // Validate description
    if (!this.editedEntry.description || this.editedEntry.description.trim().length === 0) {
      this.validationErrors['description'] = 'Description is required';
    }

    // Validate date is not in the future
    const entryDate = new Date(this.editedEntry.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    if (entryDate > today) {
      this.validationErrors['date'] = 'Date cannot be in the future';
    }

    return Object.keys(this.validationErrors).length === 0;
  }

  saveEntry() {
    if (!this.editedEntry || !this.originalEntry || !this.validateForm()) {
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';

    try {
      // Track all changes
      const changes = this.editTrackingService.compareEntries(this.originalEntry, this.editedEntry);
      
      changes.forEach(change => {
        this.editTrackingService.trackEdit(
          this.editedEntry!,
          change.field,
          change.oldValue,
          change.newValue,
          'User edit'
        );
      });

      if (this.config?.onSave) {
        this.config.onSave(this.editedEntry);
      }

      this.closeModal();
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to save entry';
    } finally {
      this.isProcessing = false;
    }
  }

  cancelEdit() {
    if (this.hasChanges) {
      const confirmed = confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmed) return;
    }

    if (this.config?.onCancel) {
      this.config.onCancel();
    }

    this.closeModal();
  }

  closeModal() {
    this.isVisibleChange.emit(false);
    this.initializeEditor();

    if (this.config?.onClose) {
      this.config.onClose();
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

  formatTime(timeString?: string): string {
    if (!timeString) return 'N/A';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  calculateHours(): string {
    if (!this.editedEntry) return '0.0';
    
    if (this.editedEntry.manualHours) {
      return this.editedEntry.manualHours.toFixed(1);
    }
    
    if (this.editedEntry.startTime && this.editedEntry.endTime) {
      const start = new Date(`${this.editedEntry.date}T${this.editedEntry.startTime}`);
      const end = new Date(`${this.editedEntry.date}T${this.editedEntry.endTime}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return hours.toFixed(1);
    }
    
    return '0.0';
  }

  getEditHistory(): EditRecord[] {
    return this.editedEntry ? this.editTrackingService.getEditHistory(this.editedEntry) : [];
  }

  getEntryTypeLabel(): string {
    if (this.isClockEntry) {
      return 'Clock In/Out Entry';
    } else if (this.isManualEntry) {
      return 'Manual Time Entry';
    }
    return 'Time Entry';
  }

  getStatusBadgeClass(): string {
    if (!this.editedEntry) return '';
    
    switch (this.editedEntry.status) {
      case 'draft': return 'status-draft';
      case 'submitted': return 'status-submitted';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return 'status-draft';
    }
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.cancelEdit();
    }
  }

  getCurrentDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  hasValidationErrors(): boolean {
    return Object.keys(this.validationErrors).length > 0;
  }
}