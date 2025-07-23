export interface Client {
  id: string;
  name: string;
  email: string;
  trackingPreferences: {
    allowClockInOut: boolean;
    allowManualEntry: boolean;
    requireProofOfWork: boolean;
    screenshotFrequency: 'manual' | 'random' | 'disabled';
  };
  workers: Worker[];
}

export interface Worker {
  contractorId: string;
  name: string;
  email: string;
  inviteToken: string;
  isActive: boolean;
}

export interface TimeEntry {
  id: string;
  workerId: string;
  date: string;
  startTime?: string; // For clock in/out
  endTime?: string;
  manualHours?: number; // For manual entry
  description: string;
  proofOfWork: ProofOfWork[];
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  clientNotes?: string;
}

export interface ProofOfWork {
  id: string;
  type: 'screenshot' | 'note' | 'file';
  timestamp: string;
  content: string; // base64 image or text
  description?: string;
  fileName?: string;
  fileSize?: number;
}

export interface OntopCSVRow {
  contractId: string;        // Column A
  contractorId: string;      // Column B  
  personalId: string;        // Column C
  name: string;              // Column D
  email: string;             // Column E
  unitOfPayment: string;     // Column M
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface WorkerSummary {
  contractorId: string;
  name: string;
  email: string;
  totalHours: number;
  overtimeHours: number;
  regularHours: number;
  status: string;
  approvedDate?: string;
  clientNotes?: string;
} 