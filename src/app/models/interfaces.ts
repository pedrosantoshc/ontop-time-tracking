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
  isActive: boolean; // false initially, becomes true when they access their invite link
  trackingMode: 'clock' | 'timesheet'; // 'clock' = clock in/out, 'timesheet' = manual hours with proof
  joinedAt?: string; // timestamp when they first accessed their invite link
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
  editHistory?: EditRecord[];
  lastModified?: string;
  isEditable?: boolean;
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

// New interfaces for Worker Dashboard
export interface WorkerDashboardEntry {
  timeEntry: TimeEntry;
  statusIcon: string;
  statusColor: string;
  statusText: string;
  submittedDate?: string;
  approvedDate?: string;
  clientFeedback?: string;
}

export interface WorkerStats {
  totalHours: number;
  approvedHours: number;
  pendingHours: number;
  rejectedHours: number;
  entriesCount: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  thisWeekHours: number;
  thisMonthHours: number;
}

export interface StatusFilter {
  key: string;
  label: string;
  color: string;
  icon: string;
}

// Edit tracking interfaces
export interface EditRecord {
  timestamp: string;
  field: string;
  oldValue: any;
  newValue: any;
  reason?: string;
  userId?: string;
}

// Reports interfaces
export interface ReportConfig {
  dateRange: { start: string; end: string };
  workers: string[];
  includeProofOfWork: boolean;
  format: 'summary' | 'detailed';
  status?: ('draft' | 'submitted' | 'approved' | 'rejected')[];
}

export interface ReportData {
  summary: ReportSummary;
  workerReports: WorkerReport[];
  chartData: ChartData;
  exportData: ExportData;
}

export interface ReportSummary {
  totalHours: number;
  totalWorkers: number;
  totalEntries: number;
  averageHoursPerWorker: number;
  approvalRate: number;
  periodStart: string;
  periodEnd: string;
}

export interface WorkerReport {
  workerId: string;
  workerName: string;
  workerEmail: string;
  totalHours: number;
  approvedHours: number;
  pendingHours: number;
  rejectedHours: number;
  entriesCount: number;
  averageHoursPerDay: number;
  lastActivity: string;
  proofOfWorkCount: number;
}

export interface ChartData {
  hoursPerWorker: ChartDataPoint[];
  hoursOverTime: ChartDataPoint[];
  statusDistribution: ChartDataPoint[];
  dailyHours: ChartDataPoint[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ExportData {
  format: 'csv' | 'excel' | 'pdf';
  filename: string;
  data: any;
  headers: string[];
} 