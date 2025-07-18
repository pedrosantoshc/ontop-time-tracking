import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { Worker, TimeEntry, ProofOfWork } from '../../models/interfaces';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-worker-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-ontop-gray p-4">
      <div class="max-w-4xl mx-auto">
        
        <!-- Worker Header -->
        <div class="card-ontop mb-6" *ngIf="worker">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Good {{ getTimeOfDay() }}, {{ worker.name }}! 👋</h1>
              <p class="text-gray-600">Track your time and manage your work sessions</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-gray-600">Today's Total</p>
              <p class="text-2xl font-bold text-ontop-blue">{{ formatHours(todayTotal) }}h</p>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div *ngIf="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div class="flex items-center space-x-2">
            <span class="text-red-600">⚠️</span>
            <p class="text-red-800">{{ errorMessage }}</p>
          </div>
        </div>

        <!-- Invalid Token Message -->
        <div *ngIf="!worker && !isLoading" class="card-ontop text-center">
          <div class="py-8">
            <span class="text-6xl">🔒</span>
            <h2 class="text-xl font-semibold mt-4 mb-2">Invalid Invite Token</h2>
            <p class="text-gray-600">The invite link you used is not valid or has expired.</p>
          </div>
        </div>

        <!-- Time Tracking Interface -->
        <div *ngIf="worker" class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          <!-- Clock In/Out Panel -->
          <div class="card-ontop">
            <h3 class="text-lg font-semibold mb-4">⏰ Clock In/Out</h3>
            
            <div class="text-center mb-6">
              <div class="text-4xl font-mono font-bold text-gray-900 mb-2">
                {{ formatTimer(currentSessionTime) }}
              </div>
              <p class="text-sm text-gray-600" *ngIf="isClocked">
                Started at {{ currentEntry?.startTime }}
              </p>
            </div>

            <div class="space-y-4">
              <button 
                *ngIf="!isClocked" 
                (click)="clockIn()" 
                [disabled]="isProcessing"
                class="btn-ontop-primary w-full text-lg py-3">
                🟢 CLOCK IN
              </button>
              
              <button 
                *ngIf="isClocked" 
                (click)="clockOut()" 
                [disabled]="isProcessing"
                class="btn-ontop-secondary w-full text-lg py-3">
                🔴 CLOCK OUT
              </button>
            </div>

            <div *ngIf="isClocked" class="mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                What are you working on?
              </label>
              <textarea 
                [(ngModel)]="currentEntry.description"
                class="w-full p-3 border border-gray-300 rounded-lg resize-none"
                rows="2"
                placeholder="Describe your current task...">
              </textarea>
            </div>
          </div>

          <!-- Manual Entry Panel -->
          <div class="card-ontop">
            <h3 class="text-lg font-semibold mb-4">✏️ Manual Entry</h3>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input 
                  type="date" 
                  [(ngModel)]="manualEntry.date"
                  [max]="today"
                  class="w-full p-3 border border-gray-300 rounded-lg">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Hours Worked</label>
                <input 
                  type="number" 
                  [(ngModel)]="manualEntry.manualHours"
                  min="0.25"
                  max="12"
                  step="0.25"
                  class="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="e.g., 4.5">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea 
                  [(ngModel)]="manualEntry.description"
                  class="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows="3"
                  placeholder="Describe what you worked on...">
                </textarea>
              </div>
              
              <button 
                (click)="submitManualEntry()" 
                [disabled]="!isManualEntryValid() || isProcessing"
                class="btn-ontop-primary w-full">
                Submit Manual Entry
              </button>
            </div>
          </div>
        </div>

        <!-- Proof of Work Panel -->
        <div *ngIf="worker" class="card-ontop mb-6">
          <h3 class="text-lg font-semibold mb-4">📸 Proof of Work</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <button 
              (click)="captureScreenshot()" 
              [disabled]="isProcessing"
              class="btn-ontop-primary flex items-center justify-center space-x-2 py-3">
              <span>📷</span>
              <span>Take Screenshot</span>
            </button>
            
            <div class="relative">
              <input 
                type="file" 
                (change)="onFileSelected($event)"
                accept="image/*,.pdf,.doc,.docx"
                class="hidden" 
                #fileInput>
              <button 
                (click)="fileInput.click()" 
                [disabled]="isProcessing"
                class="btn-ontop-secondary w-full flex items-center justify-center space-x-2 py-3">
                <span>📎</span>
                <span>Upload File</span>
              </button>
            </div>
          </div>

          <!-- Proof of Work List -->
          <div *ngIf="todayProofOfWork.length > 0" class="space-y-3">
            <h4 class="font-medium text-gray-900">Today's Proof of Work:</h4>
            <div *ngFor="let proof of todayProofOfWork" class="bg-gray-50 rounded-lg p-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <span *ngIf="proof.type === 'screenshot'">📷</span>
                  <span *ngIf="proof.type === 'file'">📎</span>
                  <span *ngIf="proof.type === 'note'">📝</span>
                  <div>
                    <p class="font-medium">{{ proof.fileName || 'Screenshot' }}</p>
                    <p class="text-sm text-gray-600">{{ formatTime(proof.timestamp) }}</p>
                  </div>
                </div>
                <button 
                  (click)="removeProofOfWork(proof.id)"
                  class="text-ontop-red hover:text-red-600">
                  ✕
                </button>
              </div>
              <p *ngIf="proof.description" class="text-sm text-gray-600 mt-2">{{ proof.description }}</p>
            </div>
          </div>
        </div>

        <!-- Today's Time Entries -->
        <div *ngIf="worker && todayEntries.length > 0" class="card-ontop">
          <h3 class="text-lg font-semibold mb-4">📋 Today's Time Entries</h3>
          
          <div class="space-y-3">
            <div *ngFor="let entry of todayEntries" class="bg-gray-50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-3">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        [class]="getStatusClass(entry.status)">
                    {{ entry.status }}
                  </span>
                  <span class="font-medium">{{ getEntryHours(entry) }}h</span>
                </div>
                <div class="text-sm text-gray-600">
                  {{ entry.startTime ? entry.startTime + ' - ' + (entry.endTime || 'Active') : 'Manual Entry' }}
                </div>
              </div>
              <p class="text-sm text-gray-700">{{ entry.description }}</p>
              <div *ngIf="entry.proofOfWork.length > 0" class="mt-2">
                <span class="text-xs text-gray-500">{{ entry.proofOfWork.length }} proof(s) of work attached</span>
              </div>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t border-gray-200">
            <div class="flex justify-between items-center">
              <span class="font-medium">Today's Total:</span>
              <span class="text-lg font-bold text-ontop-blue">{{ formatHours(todayTotal) }}h</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: []
})
export class WorkerTrackingComponent implements OnInit, OnDestroy {
  worker: Worker | null = null;
  inviteToken = '';
  isLoading = true;
  errorMessage = '';
  isProcessing = false;

  // Time tracking
  isClocked = false;
  currentEntry: Partial<TimeEntry> = {};
  currentSessionTime = 0;
  todayTotal = 0;
  today = new Date().toISOString().split('T')[0];
  
  // Manual entry
  manualEntry: Partial<TimeEntry> = {
    date: this.today,
    manualHours: undefined,
    description: ''
  };

  // Time entries and proof
  todayEntries: TimeEntry[] = [];
  todayProofOfWork: ProofOfWork[] = [];

  // Timer
  private timerInterval: any;

  constructor(
    private route: ActivatedRoute,
    private storage: StorageService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.inviteToken = params['inviteToken'];
      this.loadWorkerData();
    });
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  loadWorkerData() {
    const workers = this.storage.getWorkers();
    this.worker = workers.find(w => w.inviteToken === this.inviteToken) || null;
    
    if (this.worker) {
      this.loadTodayData();
      this.checkCurrentSession();
    }
    
    this.isLoading = false;
  }

  loadTodayData() {
    const allEntries = this.storage.getTimeEntries();
    this.todayEntries = allEntries.filter(entry => 
      entry.workerId === this.worker?.contractorId && 
      entry.date === this.today
    );

    this.todayTotal = this.todayEntries.reduce((total, entry) => {
      return total + this.getEntryHours(entry);
    }, 0);

    // Load today's proof of work
    this.todayProofOfWork = [];
    this.todayEntries.forEach(entry => {
      this.todayProofOfWork.push(...entry.proofOfWork);
    });
  }

  checkCurrentSession() {
    const activeEntry = this.todayEntries.find(entry => 
      entry.startTime && !entry.endTime
    );
    
    if (activeEntry) {
      this.isClocked = true;
      this.currentEntry = activeEntry;
      this.startTimer();
    }
  }

  clockIn() {
    if (!this.worker) return;

    this.currentEntry = {
      id: uuidv4(),
      workerId: this.worker.contractorId,
      date: this.today,
      startTime: new Date().toLocaleTimeString('en-US', { hour12: false }),
      description: '',
      proofOfWork: [],
      status: 'draft'
    };

    this.isClocked = true;
    this.currentSessionTime = 0;
    this.startTimer();
  }

  clockOut() {
    if (!this.currentEntry.id) return;

    this.currentEntry.endTime = new Date().toLocaleTimeString('en-US', { hour12: false });
    
    // Save the entry
    const timeEntries = this.storage.getTimeEntries();
    const existingIndex = timeEntries.findIndex(e => e.id === this.currentEntry.id);
    
    if (existingIndex >= 0) {
      timeEntries[existingIndex] = this.currentEntry as TimeEntry;
    } else {
      timeEntries.push(this.currentEntry as TimeEntry);
    }
    
    this.storage.saveTimeEntries(timeEntries);
    
    this.isClocked = false;
    this.stopTimer();
    this.currentEntry = {};
    this.loadTodayData();
  }

  startTimer() {
    if (this.currentEntry.startTime) {
      const startTime = new Date(`2000-01-01T${this.currentEntry.startTime}`);
      
      this.timerInterval = setInterval(() => {
        const now = new Date();
        const currentTime = new Date(`2000-01-01T${now.toLocaleTimeString('en-US', { hour12: false })}`);
        this.currentSessionTime = (currentTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        
        // Auto-save current entry every minute
        if (this.currentEntry.id) {
          this.saveCurrentEntry();
        }
      }, 1000);
    }
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  saveCurrentEntry() {
    if (!this.currentEntry.id) return;
    
    const timeEntries = this.storage.getTimeEntries();
    const existingIndex = timeEntries.findIndex(e => e.id === this.currentEntry.id);
    
    if (existingIndex >= 0) {
      timeEntries[existingIndex] = { ...timeEntries[existingIndex], ...this.currentEntry };
    } else {
      timeEntries.push(this.currentEntry as TimeEntry);
    }
    
    this.storage.saveTimeEntries(timeEntries);
  }

  submitManualEntry() {
    if (!this.worker || !this.isManualEntryValid()) return;

    const entry: TimeEntry = {
      id: uuidv4(),
      workerId: this.worker.contractorId,
      date: this.manualEntry.date!,
      manualHours: this.manualEntry.manualHours!,
      description: this.manualEntry.description || '',
      proofOfWork: [],
      status: 'draft'
    };

    const timeEntries = this.storage.getTimeEntries();
    timeEntries.push(entry);
    this.storage.saveTimeEntries(timeEntries);

    // Reset form
    this.manualEntry = {
      date: this.today,
      manualHours: undefined,
      description: ''
    };

    this.loadTodayData();
  }

  async captureScreenshot() {
    this.isProcessing = true;
    this.errorMessage = '';

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);

        stream.getTracks().forEach(track => track.stop());

        const base64 = canvas.toDataURL('image/jpeg', 0.7);
        
        if (base64.length > 2 * 1024 * 1024) {
          this.errorMessage = 'Screenshot too large. Please try again.';
          this.isProcessing = false;
          return;
        }

        this.addProofOfWork('screenshot', base64, 'Screenshot');
        this.isProcessing = false;
      };
    } catch (error) {
      this.errorMessage = 'Failed to capture screenshot. Please check permissions.';
      this.isProcessing = false;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'File too large. Maximum size is 5MB.';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.addProofOfWork('file', e.target?.result as string, file.name, file.size);
    };
    reader.readAsDataURL(file);
  }

  addProofOfWork(type: 'screenshot' | 'file', content: string, fileName?: string, fileSize?: number) {
    const proof: ProofOfWork = {
      id: uuidv4(),
      type,
      timestamp: new Date().toISOString(),
      content,
      fileName,
      fileSize
    };

    // Add to current session if clocked in
    if (this.isClocked && this.currentEntry.id) {
      if (!this.currentEntry.proofOfWork) {
        this.currentEntry.proofOfWork = [];
      }
      this.currentEntry.proofOfWork.push(proof);
      this.saveCurrentEntry();
    }

    this.todayProofOfWork.push(proof);
  }

  removeProofOfWork(proofId: string) {
    this.todayProofOfWork = this.todayProofOfWork.filter(p => p.id !== proofId);
    
    // Remove from current entry if exists
    if (this.currentEntry.proofOfWork) {
      this.currentEntry.proofOfWork = this.currentEntry.proofOfWork.filter(p => p.id !== proofId);
      this.saveCurrentEntry();
    }

    // Remove from saved entries
    const timeEntries = this.storage.getTimeEntries();
    timeEntries.forEach(entry => {
      entry.proofOfWork = entry.proofOfWork.filter(p => p.id !== proofId);
    });
    this.storage.saveTimeEntries(timeEntries);
  }

  // Utility methods
  getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  formatTimer(hours: number): string {
    const totalMinutes = Math.floor(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const s = Math.floor((hours * 3600) % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  formatHours(hours: number): string {
    return hours.toFixed(2);
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString();
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

  getStatusClass(status: string): string {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  isManualEntryValid(): boolean {
    return !!(
      this.manualEntry.date &&
      this.manualEntry.manualHours &&
      this.manualEntry.manualHours >= 0.25 &&
      this.manualEntry.manualHours <= 12 &&
      this.manualEntry.description?.trim()
    );
  }
}
