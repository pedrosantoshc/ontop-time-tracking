import { Injectable } from '@angular/core';
import { Client, Worker, TimeEntry, ProofOfWork } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  private readonly STORAGE_KEYS = {
    CLIENT_DATA: 'ontop_time_client',
    WORKERS: 'ontop_time_workers',
    TIME_ENTRIES: 'ontop_time_entries',
    PROOF_OF_WORK: 'ontop_time_proof'
  };

  constructor() { }

  // Client Data
  saveClientData(client: Client): void {
    localStorage.setItem(this.STORAGE_KEYS.CLIENT_DATA, JSON.stringify(client));
  }

  getClientData(): Client | null {
    const data = localStorage.getItem(this.STORAGE_KEYS.CLIENT_DATA);
    return data ? JSON.parse(data) : null;
  }

  // Workers
  saveWorkers(workers: Worker[]): void {
    localStorage.setItem(this.STORAGE_KEYS.WORKERS, JSON.stringify(workers));
  }

  getWorkers(): Worker[] {
    const data = localStorage.getItem(this.STORAGE_KEYS.WORKERS);
    return data ? JSON.parse(data) : [];
  }

  addWorker(worker: Worker): void {
    const workers = this.getWorkers();
    workers.push(worker);
    this.saveWorkers(workers);
  }

  updateWorker(updatedWorker: Worker): void {
    const workers = this.getWorkers();
    const index = workers.findIndex(w => w.contractorId === updatedWorker.contractorId);
    if (index !== -1) {
      workers[index] = updatedWorker;
      this.saveWorkers(workers);
    }
  }

  getWorkerByToken(token: string): Worker | null {
    const workers = this.getWorkers();
    return workers.find(w => w.inviteToken === token) || null;
  }

  // Time Entries
  saveTimeEntries(entries: TimeEntry[]): void {
    localStorage.setItem(this.STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(entries));
  }

  getTimeEntries(): TimeEntry[] {
    const data = localStorage.getItem(this.STORAGE_KEYS.TIME_ENTRIES);
    return data ? JSON.parse(data) : [];
  }

  addTimeEntry(entry: TimeEntry): void {
    const entries = this.getTimeEntries();
    entries.push(entry);
    this.saveTimeEntries(entries);
  }

  updateTimeEntry(updatedEntry: TimeEntry): void {
    const entries = this.getTimeEntries();
    const index = entries.findIndex(e => e.id === updatedEntry.id);
    if (index !== -1) {
      entries[index] = updatedEntry;
      this.saveTimeEntries(entries);
    }
  }

  deleteTimeEntry(entryId: string): void {
    const entries = this.getTimeEntries();
    const filteredEntries = entries.filter(e => e.id !== entryId);
    this.saveTimeEntries(filteredEntries);
  }

  getTimeEntriesByWorker(workerId: string): TimeEntry[] {
    const entries = this.getTimeEntries();
    return entries.filter(e => e.workerId === workerId);
  }

  getTimeEntriesByStatus(status: 'draft' | 'submitted' | 'approved' | 'rejected'): TimeEntry[] {
    const entries = this.getTimeEntries();
    return entries.filter(e => e.status === status);
  }

  getTimeEntriesByDateRange(startDate: string, endDate: string): TimeEntry[] {
    const entries = this.getTimeEntries();
    return entries.filter(e => e.date >= startDate && e.date <= endDate);
  }

  // Proof of Work
  saveProofOfWork(proofItems: ProofOfWork[]): void {
    localStorage.setItem(this.STORAGE_KEYS.PROOF_OF_WORK, JSON.stringify(proofItems));
  }

  getProofOfWork(): ProofOfWork[] {
    const data = localStorage.getItem(this.STORAGE_KEYS.PROOF_OF_WORK);
    return data ? JSON.parse(data) : [];
  }

  addProofOfWork(proof: ProofOfWork): void {
    const proofItems = this.getProofOfWork();
    proofItems.push(proof);
    this.saveProofOfWork(proofItems);
  }

  // Utility methods
  clearAllData(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  exportData(): string {
    const data = {
      client: this.getClientData(),
      workers: this.getWorkers(),
      timeEntries: this.getTimeEntries(),
      proofOfWork: this.getProofOfWork(),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.client) this.saveClientData(data.client);
      if (data.workers) this.saveWorkers(data.workers);
      if (data.timeEntries) this.saveTimeEntries(data.timeEntries);
      if (data.proofOfWork) this.saveProofOfWork(data.proofOfWork);
      
    } catch (error) {
      throw new Error('Invalid data format');
    }
  }

  getStorageUsage(): { used: number; total: number; percentage: number } {
    let used = 0;
    Object.values(this.STORAGE_KEYS).forEach(key => {
      const data = localStorage.getItem(key);
      if (data) used += new Blob([data]).size;
    });
    
    const total = 5 * 1024 * 1024; // 5MB typical localStorage limit
    return {
      used,
      total,
      percentage: (used / total) * 100
    };
  }
} 