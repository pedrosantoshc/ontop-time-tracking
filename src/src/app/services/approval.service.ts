import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { TimeEntry } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class ApprovalService {
  constructor(private storage: StorageService) {}

  /** Return all entries that are pending approval (draft or submitted) */
  getPendingEntries(): TimeEntry[] {
    return this.storage
      .getTimeEntries()
      .filter(e => e.status === 'draft' || e.status === 'submitted');
  }

  /** Approve a single entry */
  approveEntry(entry: TimeEntry) {
    entry.status = 'approved';
    this._save(entry);
  }

  /** Reject a single entry */
  rejectEntry(entry: TimeEntry, notes?: string) {
    entry.status = 'rejected';
    if (notes) entry.clientNotes = notes;
    this._save(entry);
  }

  approveAll(entries: TimeEntry[]) {
    entries.forEach(e => (e.status = 'approved'));
    this.storage.saveTimeEntries(this._merge(entries));
  }

  rejectAll(entries: TimeEntry[], notes?: string) {
    entries.forEach(e => {
      e.status = 'rejected';
      if (notes) e.clientNotes = notes;
    });
    this.storage.saveTimeEntries(this._merge(entries));
  }

  private _save(updated: TimeEntry) {
    const all = this.storage.getTimeEntries();
    const idx = all.findIndex(e => e.id === updated.id);
    if (idx >= 0) {
      all[idx] = updated;
      this.storage.saveTimeEntries(all);
    }
  }

  private _merge(updated: TimeEntry[]): TimeEntry[] {
    const map = new Map<string, TimeEntry>();
    updated.forEach(e => map.set(e.id, e));
    return this.storage.getTimeEntries().map(e => map.get(e.id) || e);
  }
} 