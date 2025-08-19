import { Injectable } from '@angular/core';
import { TimeEntry, EditRecord } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class EditTrackingService {

  constructor() { }

  canEdit(entry: TimeEntry): boolean {
    // Allow editing for draft and submitted entries only
    return entry.status === 'draft' || entry.status === 'submitted';
  }

  trackEdit(entry: TimeEntry, field: string, oldValue: any, newValue: any, reason?: string): void {
    if (!entry.editHistory) {
      entry.editHistory = [];
    }

    const editRecord: EditRecord = {
      timestamp: new Date().toISOString(),
      field: field,
      oldValue: oldValue,
      newValue: newValue,
      reason: reason
    };

    entry.editHistory.push(editRecord);
    entry.lastModified = new Date().toISOString();
    
    // If entry was submitted, reset to draft status
    if (entry.status === 'submitted') {
      entry.status = 'draft';
      this.trackEdit(entry, 'status', 'submitted', 'draft', 'Entry modified after submission');
    }
  }

  getEditHistory(entry: TimeEntry): EditRecord[] {
    return entry.editHistory || [];
  }

  getLastEditTime(entry: TimeEntry): string | null {
    return entry.lastModified || null;
  }

  hasBeenEdited(entry: TimeEntry): boolean {
    return (entry.editHistory && entry.editHistory.length > 0) || false;
  }

  compareEntries(original: TimeEntry, modified: TimeEntry): EditRecord[] {
    const changes: EditRecord[] = [];

    // Compare fields
    const fieldsToCompare = ['date', 'startTime', 'endTime', 'manualHours', 'description'];
    
    for (const field of fieldsToCompare) {
      const oldValue = (original as any)[field];
      const newValue = (modified as any)[field];
      
      if (oldValue !== newValue) {
        changes.push({
          timestamp: new Date().toISOString(),
          field: field,
          oldValue: oldValue,
          newValue: newValue
        });
      }
    }

    return changes;
  }

  validateEditPermissions(entry: TimeEntry): { canEdit: boolean; reason?: string } {
    if (entry.status === 'approved') {
      return { canEdit: false, reason: 'Cannot edit approved entries' };
    }
    
    if (entry.status === 'rejected') {
      return { canEdit: false, reason: 'Cannot edit rejected entries. Please create a new entry.' };
    }

    // Check if entry is too old (optional business rule)
    const entryDate = new Date(entry.date);
    const daysDiff = Math.floor((Date.now() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 30) {
      return { canEdit: false, reason: 'Cannot edit entries older than 30 days' };
    }

    return { canEdit: true };
  }

  formatEditSummary(entry: TimeEntry): string {
    const history = this.getEditHistory(entry);
    if (history.length === 0) {
      return 'No edits made';
    }

    const lastEdit = history[history.length - 1];
    const timeSince = this.getTimeSinceEdit(lastEdit.timestamp);
    
    return `Last edited ${timeSince} ago (${history.length} total edits)`;
  }

  private getTimeSinceEdit(timestamp: string): string {
    const editTime = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - editTime.getTime();
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    }
  }
}