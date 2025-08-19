import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { Worker, TimeEntry, ProofOfWork } from '../../models/interfaces';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-worker-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-ontop-gray p-4">
      <div class="max-w-4xl mx-auto">
        
        <!-- Worker Header -->
        <div class="card-ontop mb-6" *ngIf="worker">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Good {{ getTimeOfDay() }}, {{ worker.name }}! <mat-icon class="inline-icon">waving_hand</mat-icon></h1>
              <p class="text-gray-600">Track your time and manage your work sessions</p>
            </div>
            <div class="text-right">
              <button mat-stroked-button (click)="navigateToDashboard()" class="mb-2 flex items-center space-x-2">
                <mat-icon>dashboard</mat-icon>
                <span>My Dashboard</span>
              </button>
              <p class="text-sm text-gray-600">Today's Total</p>
              <p class="text-2xl font-bold text-ontop-blue">{{ formatHours(todayTotal) }}h</p>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div *ngIf="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div class="flex items-center space-x-2">
            <mat-icon class="text-red-600">warning</mat-icon>
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
          
          <!-- Clock In/Out Panel (Only for 'clock' mode) -->
          <div *ngIf="worker.trackingMode === 'clock'" class="card-ontop">
            <h3 class="text-lg font-semibold mb-4"><mat-icon class="inline-icon">schedule</mat-icon> Clock In/Out</h3>
            
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
                mat-raised-button color="primary" class="w-full text-lg py-3">
                <mat-icon>play_arrow</mat-icon> CLOCK IN
              </button>
              
              <button 
                *ngIf="isClocked" 
                (click)="clockOut()" 
                [disabled]="isProcessing"
                mat-stroked-button class="w-full text-lg py-3">
                <mat-icon>stop</mat-icon> CLOCK OUT
              </button>
              
              <!-- Request Adjustment Button -->
              <button 
                (click)="requestAdjustment()" 
                mat-stroked-button class="w-full text-sm py-2 border border-gray-300">
                <mat-icon>edit</mat-icon> Request Time Adjustment
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

          <!-- Request Adjustment Panel (For clock mode when showing adjustment form) -->
          <div *ngIf="worker.trackingMode === 'clock' && showAdjustmentForm" class="card-ontop">
            <h3 class="text-lg font-semibold mb-4"><mat-icon class="inline-icon">edit</mat-icon> Request Time Adjustment</h3>
            <p class="text-sm text-gray-600 mb-4">Submit a manual entry that requires client approval.</p>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input 
                  type="date" 
                  [(ngModel)]="adjustmentEntry.date"
                  [max]="today"
                  class="w-full p-3 border border-gray-300 rounded-lg">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Hours Worked</label>
                <input 
                  type="number" 
                  [(ngModel)]="adjustmentEntry.manualHours"
                  min="0.25"
                  max="12"
                  step="0.25"
                  class="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="e.g., 4.5">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Reason for Adjustment</label>
                <textarea 
                  [(ngModel)]="adjustmentEntry.description"
                  class="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows="3"
                  placeholder="Explain why you need this time adjustment..."
                  required>
                </textarea>
              </div>
              
              <div class="flex space-x-2">
                <button 
                  (click)="submitAdjustment()" 
                  [disabled]="!isAdjustmentEntryValid() || isProcessing"
                  mat-raised-button color="primary" class="flex-1">
                  Submit Request
                </button>
                <button 
                  (click)="cancelAdjustment()" 
                  mat-stroked-button class="px-4">
                  Cancel
                </button>
              </div>
            </div>
          </div>

          <!-- Daily Hours Entry Panel (Only for 'timesheet' mode) -->
          <div *ngIf="worker.trackingMode === 'timesheet'" class="card-ontop lg:col-span-2">
            <h3 class="text-lg font-semibold mb-4"><mat-icon class="inline-icon">assignment</mat-icon> Register Daily Hours</h3>
            <p class="text-sm text-gray-600 mb-4">Enter your daily hours with required proof of work.</p>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <label class="block text-sm font-medium text-gray-700 mb-2">Hours Worked *</label>
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
                  <label class="block text-sm font-medium text-gray-700 mb-2">Work Description *</label>
                  <textarea 
                    [(ngModel)]="manualEntry.description"
                    class="w-full p-3 border border-gray-300 rounded-lg resize-none"
                    rows="4"
                    placeholder="Describe what you worked on..."
                    required>
                  </textarea>
                </div>
              </div>
              
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Proof of Work * (Required)</label>
                  <p class="text-xs text-gray-500 mb-3">Upload screenshots, files, or take photos of your work</p>
                  
                  <div class="grid grid-cols-1 gap-2">
                    <button 
                      (click)="captureScreenshot()" 
                      [disabled]="isProcessing"
                      mat-raised-button color="primary" class="flex items-center justify-center space-x-2 py-2">
                      <mat-icon>camera_alt</mat-icon>
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
                        mat-stroked-button class="w-full flex items-center justify-center space-x-2 py-2">
                        <mat-icon>attach_file</mat-icon>
                        <span>Upload File</span>
                      </button>
                    </div>
                  </div>
                  
                  <!-- Today's proof of work for this entry -->
                  <div *ngIf="manualEntryProof.length > 0" class="mt-3 space-y-2">
                    <p class="text-sm font-medium text-gray-700">Attached Proof:</p>
                    <div *ngFor="let proof of manualEntryProof" class="bg-gray-50 rounded-lg p-2 text-sm">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                          <span *ngIf="proof.type === 'screenshot'">📷</span>
                          <mat-icon *ngIf="proof.type === 'file'">attach_file</mat-icon>
                          <span>{{ proof.fileName || 'Screenshot' }}</span>
                        </div>
                        <button 
                          (click)="removeManualEntryProof(proof.id)"
                          class="text-ontop-red hover:text-red-600">
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button 
                  (click)="submitManualEntry()" 
                  [disabled]="!isTimesheetEntryValid() || isProcessing"
                  mat-raised-button color="primary" class="w-full">
                  Submit Daily Hours
                </button>
                
                <div *ngIf="!isTimesheetEntryValid()" class="text-xs text-gray-500">
                  * Hours, description, and proof of work are required
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Proof of Work Panel (Only for clock mode) -->
        <div *ngIf="worker && worker.trackingMode === 'clock'" class="card-ontop mb-6">
          <h3 class="text-lg font-semibold mb-4"><mat-icon class="inline-icon">photo_camera</mat-icon> Proof of Work</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <button 
              (click)="captureScreenshot()" 
              [disabled]="isProcessing"
              mat-raised-button color="primary" class="flex items-center justify-center space-x-2 py-3">
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
                mat-stroked-button class="w-full flex items-center justify-center space-x-2 py-3">
                <mat-icon>attach_file</mat-icon>
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
                  <mat-icon *ngIf="proof.type === 'file'">attach_file</mat-icon>
                  <mat-icon *ngIf="proof.type === 'note'">note</mat-icon>
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
          <h3 class="text-lg font-semibold mb-4"><mat-icon class="inline-icon">today</mat-icon> Today's Time Entries</h3>
          
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

        <!-- Timesheet History Section -->
        <div *ngIf="worker" class="card-ontop">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold"><mat-icon class="inline-icon">analytics</mat-icon> My Timesheet History</h3>
            <div class="flex items-center space-x-2">
              <select [(ngModel)]="historyFilter" (ngModelChange)="filterHistory()" 
                      class="p-2 border border-gray-300 rounded-lg text-sm">
                <option value="all">All Entries</option>
                <option value="approved">Approved</option>
                <option value="submitted">Pending Review</option>
                <option value="rejected">Rejected</option>
                <option value="draft">Drafts</option>
              </select>
            </div>
          </div>

          <!-- History Stats -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-green-50 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-green-800">{{ historyStats.approved }}</div>
              <div class="text-sm text-green-600">Approved</div>
            </div>
            <div class="bg-yellow-100 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-yellow-800">{{ historyStats.submitted }}</div>
              <div class="text-sm text-yellow-600">Pending Review</div>
            </div>
            <div class="bg-red-100 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-red-800">{{ historyStats.rejected }}</div>
              <div class="text-sm text-red-600">Rejected</div>
            </div>
            <div class="bg-gray-100 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-gray-800">{{ historyStats.draft }}</div>
              <div class="text-sm text-gray-600">Drafts</div>
            </div>
          </div>

          <!-- History Entries -->
          <div *ngIf="filteredHistoryEntries.length > 0" class="space-y-4">
            <div *ngFor="let entry of filteredHistoryEntries" class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center space-x-3">
                  <span class="text-lg font-medium">{{ formatDate(entry.date) }}</span>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        [class]="getStatusClass(entry.status)">
                    {{ entry.status | titlecase }}
                  </span>
                </div>
                <div class="text-right">
                  <div class="text-lg font-bold text-gray-900">{{ getEntryHours(entry) }}h</div>
                  <div class="text-sm text-gray-500">
                    {{ entry.startTime ? entry.startTime + ' - ' + (entry.endTime || 'Active') : 'Manual Entry' }}
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <p class="text-gray-700">{{ entry.description || 'No description provided' }}</p>
              </div>

              <!-- Proof of Work Indicator -->
              <div *ngIf="entry.proofOfWork.length > 0" class="mb-3">
                <div class="flex items-center space-x-2 text-sm text-gray-600">
                  <mat-icon>attach_file</mat-icon>
                  <span>{{ entry.proofOfWork.length }} proof(s) of work attached</span>
                </div>
              </div>

              <!-- Client Notes (for rejected entries) -->
              <div *ngIf="entry.status === 'rejected' && entry.clientNotes" 
                   class="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                <div class="flex items-start space-x-2">
                  <span class="text-red-600 mt-0.5">💬</span>
                  <div>
                    <p class="font-medium text-red-800 text-sm">Feedback from Client:</p>
                    <p class="text-red-700 text-sm mt-1">{{ entry.clientNotes }}</p>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div *ngIf="entry.status === 'draft' || entry.status === 'submitted'" 
                   class="flex justify-end space-x-2 mt-3 pt-3 border-t border-gray-200">
                <button *ngIf="entry.status === 'draft' || entry.status === 'submitted'"
                        (click)="editTimeEntry(entry)"
                        class="text-ontop-blue hover:text-blue-600 text-sm font-medium">
                  ✏️ Edit Entry
                </button>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="filteredHistoryEntries.length === 0" class="text-center py-8">
            <span class="text-4xl">📊</span>
            <h4 class="text-lg font-medium text-gray-900 mt-2">No entries found</h4>
            <p class="text-gray-600">
              {{ historyFilter === 'all' ? 'You haven\'t logged any time yet.' : 'No entries match the selected filter.' }}
            </p>
          </div>
        </div>

        <!-- Edit Time Entry Modal -->
        <div *ngIf="showEditModal && editingEntry" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
             (click)="closeEditModal()">
          <div class="bg-white rounded-lg max-w-lg w-full mx-4 overflow-hidden" 
               (click)="$event.stopPropagation()">
            
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">Edit Time Entry</h3>
                <p class="text-sm text-gray-600">{{ formatDate(editingEntry.date) }}</p>
              </div>
              <button (click)="closeEditModal()" 
                      class="text-gray-400 hover:text-gray-600 text-xl font-bold">
                ✕
              </button>
            </div>

            <!-- Modal Content -->
            <div class="p-6">
              <form (ngSubmit)="saveEditedEntry()" #editForm="ngForm">
                
                <!-- Entry Type Display -->
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Entry Type</label>
                  <div class="flex items-center space-x-2">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                          [class]="editingEntry.startTime ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'">
                      {{ editingEntry.startTime ? 'Clock In/Out' : 'Manual Entry' }}
                    </span>
                    <span class="text-sm text-gray-600">
                      ({{ editingEntry.startTime ? 'Cannot change clock times' : 'Can edit hours' }})
                    </span>
                  </div>
                </div>

                <!-- Date Field -->
                <div class="mb-4">
                  <label for="edit-date" class="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input type="date" 
                         id="edit-date"
                         [(ngModel)]="editingEntry.date" 
                         name="date"
                         required
                         class="w-full p-3 border border-gray-300 rounded-lg">
                </div>

                <!-- Hours Field (only for manual entries) -->
                <div *ngIf="!editingEntry.startTime" class="mb-4">
                  <label for="edit-hours" class="block text-sm font-medium text-gray-700 mb-2">Hours Worked</label>
                  <input type="number" 
                         id="edit-hours"
                         [(ngModel)]="editingEntry.manualHours" 
                         name="hours"
                         min="0.25" 
                         max="12" 
                         step="0.25"
                         required
                         class="w-full p-3 border border-gray-300 rounded-lg">
                  <p class="text-xs text-gray-500 mt-1">Between 0.25 and 12 hours</p>
                </div>

                <!-- Time Display (for clock entries) -->
                <div *ngIf="editingEntry.startTime" class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
                  <div class="bg-gray-50 p-3 rounded-lg">
                    <p class="text-sm text-gray-800">
                      {{ editingEntry.startTime }} - {{ editingEntry.endTime || 'Active' }}
                    </p>
                    <p class="text-xs text-gray-600 mt-1">
                      Clock times cannot be edited. Contact your manager if correction is needed.
                    </p>
                  </div>
                </div>

                <!-- Description Field -->
                <div class="mb-6">
                  <label for="edit-description" class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea id="edit-description"
                            [(ngModel)]="editingEntry.description" 
                            name="description"
                            required
                            rows="3"
                            placeholder="Describe what you worked on..."
                            class="w-full p-3 border border-gray-300 rounded-lg resize-none"></textarea>
                </div>

                <!-- Proof of Work Display -->
                <div *ngIf="editingEntry.proofOfWork.length > 0" class="mb-6">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Attached Proof of Work</label>
                  <div class="space-y-2">
                    <div *ngFor="let proof of editingEntry.proofOfWork" 
                         class="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div class="flex items-center space-x-2">
                        <span>{{ proof.type === 'screenshot' ? '📷' : proof.type === 'file' ? '📄' : '📝' }}</span>
                        <span class="text-sm font-medium">{{ proof.fileName || 'Screenshot' }}</span>
                      </div>
                      <span class="text-xs text-gray-500">{{ formatTime(proof.timestamp) }}</span>
                    </div>
                  </div>
                  <p class="text-xs text-gray-500 mt-2">
                    Proof of work cannot be modified after submission. Contact your manager if changes are needed.
                  </p>
                </div>

                <!-- Status Warning -->
                <div *ngIf="editingEntry.status === 'submitted'" class="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div class="flex items-start space-x-2">
                    <span class="text-yellow-600">⚠️</span>
                    <div>
                      <p class="text-sm font-medium text-yellow-800">Entry Already Submitted</p>
                      <p class="text-xs text-yellow-700 mt-1">
                        Changes to submitted entries will reset the status to "draft" and require re-submission.
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Modal Footer -->
                <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button type="button" 
                          (click)="closeEditModal()" 
                          mat-stroked-button>
                    Cancel
                  </button>
                  <button type="submit" 
                          [disabled]="!editForm.valid || isProcessing"
                          mat-raised-button color="primary">
                    {{ isProcessing ? 'Saving...' : 'Save Changes' }}
                  </button>
                </div>
              </form>
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

  // Adjustment request (for clock mode)
  showAdjustmentForm = false;
  adjustmentEntry: Partial<TimeEntry> = {
    date: this.today,
    manualHours: undefined,
    description: ''
  };

  // Time entries and proof
  todayEntries: TimeEntry[] = [];
  todayProofOfWork: ProofOfWork[] = [];
  manualEntryProof: ProofOfWork[] = []; // For timesheet mode

  // History functionality
  allHistoryEntries: TimeEntry[] = [];
  filteredHistoryEntries: TimeEntry[] = [];
  historyFilter: string = 'all';
  historyStats = {
    approved: 0,
    submitted: 0,
    rejected: 0,
    draft: 0
  };

  // Edit functionality
  showEditModal = false;
  editingEntry: TimeEntry | null = null;

  // Timer
  private timerInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
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
      // Activate worker if this is their first time accessing the link
      if (!this.worker.isActive) {
        this.worker.isActive = true;
        this.worker.joinedAt = new Date().toISOString();
        
        // Update worker in storage
        const updatedWorkers = workers.map(w => 
          w.inviteToken === this.inviteToken ? this.worker! : w
        );
        this.storage.saveWorkers(updatedWorkers);
        
        // Update client data
        const clientData = this.storage.getClientData();
        if (clientData) {
          clientData.workers = updatedWorkers;
          this.storage.saveClientData(clientData);
        }
      }
      
      this.loadTodayData();
      this.loadHistoryData();
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
    if (!this.worker) return;
    
    // For timesheet mode, require proof of work
    if (this.worker.trackingMode === 'timesheet' && !this.isTimesheetEntryValid()) return;
    
    // For clock mode adjustment, use different validation
    if (this.worker.trackingMode === 'clock' && !this.isManualEntryValid()) return;

    const entry: TimeEntry = {
      id: uuidv4(),
      workerId: this.worker.contractorId,
      date: this.manualEntry.date!,
      manualHours: this.manualEntry.manualHours!,
      description: this.manualEntry.description || '',
      proofOfWork: this.worker.trackingMode === 'timesheet' ? [...this.manualEntryProof] : [],
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
    this.manualEntryProof = [];

    this.loadTodayData();
  }

  // Adjustment request methods (for clock mode)
  requestAdjustment() {
    this.showAdjustmentForm = true;
    this.adjustmentEntry = {
      date: this.today,
      manualHours: undefined,
      description: ''
    };
  }

  submitAdjustment() {
    if (!this.worker || !this.isAdjustmentEntryValid()) return;

    const entry: TimeEntry = {
      id: uuidv4(),
      workerId: this.worker.contractorId,
      date: this.adjustmentEntry.date!,
      manualHours: this.adjustmentEntry.manualHours!,
      description: this.adjustmentEntry.description || '',
      proofOfWork: [],
      status: 'submitted' // Adjustment requests go directly to submitted status
    };

    const timeEntries = this.storage.getTimeEntries();
    timeEntries.push(entry);
    this.storage.saveTimeEntries(timeEntries);

    this.cancelAdjustment();
    this.loadTodayData();
  }

  cancelAdjustment() {
    this.showAdjustmentForm = false;
    this.adjustmentEntry = {
      date: this.today,
      manualHours: undefined,
      description: ''
    };
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

        if (this.worker?.trackingMode === 'timesheet') {
          this.addManualEntryProof('screenshot', base64, 'Screenshot');
        } else {
          this.addProofOfWork('screenshot', base64, 'Screenshot');
        }
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
      if (this.worker?.trackingMode === 'timesheet') {
        this.addManualEntryProof('file', e.target?.result as string, file.name, file.size);
      } else {
        this.addProofOfWork('file', e.target?.result as string, file.name, file.size);
      }
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

  isTimesheetEntryValid(): boolean {
    return !!(
      this.manualEntry.date &&
      this.manualEntry.manualHours &&
      this.manualEntry.manualHours >= 0.25 &&
      this.manualEntry.manualHours <= 12 &&
      this.manualEntry.description?.trim() &&
      this.manualEntryProof.length > 0
    );
  }

  isAdjustmentEntryValid(): boolean {
    return !!(
      this.adjustmentEntry.date &&
      this.adjustmentEntry.manualHours &&
      this.adjustmentEntry.manualHours >= 0.25 &&
      this.adjustmentEntry.manualHours <= 12 &&
      this.adjustmentEntry.description?.trim()
    );
  }

  addManualEntryProof(type: 'screenshot' | 'file', content: string, fileName?: string, fileSize?: number) {
    const proof: ProofOfWork = {
      id: uuidv4(),
      type,
      timestamp: new Date().toISOString(),
      content,
      fileName,
      fileSize
    };

    this.manualEntryProof.push(proof);
  }

  removeManualEntryProof(proofId: string) {
    this.manualEntryProof = this.manualEntryProof.filter(p => p.id !== proofId);
  }

  // History functionality methods
  loadHistoryData() {
    const allEntries = this.storage.getTimeEntries();
    this.allHistoryEntries = allEntries
      .filter(entry => entry.workerId === this.worker?.contractorId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by date desc
    
    this.updateHistoryStats();
    this.filterHistory();
  }

  updateHistoryStats() {
    this.historyStats = {
      approved: this.allHistoryEntries.filter(e => e.status === 'approved').length,
      submitted: this.allHistoryEntries.filter(e => e.status === 'submitted').length,
      rejected: this.allHistoryEntries.filter(e => e.status === 'rejected').length,
      draft: this.allHistoryEntries.filter(e => e.status === 'draft').length
    };
  }

  filterHistory() {
    if (this.historyFilter === 'all') {
      this.filteredHistoryEntries = [...this.allHistoryEntries];
    } else {
      this.filteredHistoryEntries = this.allHistoryEntries.filter(
        entry => entry.status === this.historyFilter
      );
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  editTimeEntry(entry: TimeEntry) {
    this.editingEntry = { ...entry }; // Create a copy for editing
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingEntry = null;
  }

  saveEditedEntry() {
    if (!this.editingEntry || !this.worker) return;

    this.isProcessing = true;

    try {
      // If the entry was previously submitted, reset to draft status
      if (this.editingEntry.status === 'submitted') {
        this.editingEntry.status = 'draft';
      }

      // Update the entry in storage
      const allEntries = this.storage.getTimeEntries();
      const entryIndex = allEntries.findIndex(e => e.id === this.editingEntry!.id);
      
      if (entryIndex !== -1) {
        allEntries[entryIndex] = this.editingEntry;
        this.storage.saveWorkers([]);
        this.storage.saveWorkers([]);
        
        // Save updated entries
        this.storage.updateTimeEntry(this.editingEntry);
        
        // Refresh data
        this.loadTodayData();
        this.loadHistoryData();
        
        this.closeEditModal();
        
        // Show success message briefly
        this.errorMessage = '';
        const originalProcessing = this.isProcessing;
        this.isProcessing = false;
        
        // Could add a success toast here
        console.log('Time entry updated successfully');
      } else {
        throw new Error('Entry not found');
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to update time entry';
    } finally {
      this.isProcessing = false;
    }
  }

  navigateToDashboard() {
    if (this.worker) {
      this.router.navigate(['/worker-dashboard', this.worker.inviteToken]);
    }
  }

}
