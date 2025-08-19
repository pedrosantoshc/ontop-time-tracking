import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { 
  ReportConfig, 
  ReportData, 
  ReportSummary, 
  WorkerReport, 
  ChartData, 
  ExportData, 
  ChartDataPoint,
  TimeEntry,
  Worker 
} from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {

  constructor(private storage: StorageService) { }

  generateAdvancedReport(config: ReportConfig): ReportData {
    const allEntries = this.storage.getTimeEntries();
    const allWorkers = this.storage.getWorkers();

    // Filter entries based on config
    const filteredEntries = this.filterEntries(allEntries, config);
    const filteredWorkers = this.filterWorkers(allWorkers, config);

    // Generate report components
    const summary = this.generateSummary(filteredEntries, filteredWorkers, config);
    const workerReports = this.generateWorkerReports(filteredEntries, filteredWorkers, config);
    const chartData = this.generateChartData(filteredEntries, filteredWorkers, config);
    const exportData = this.generateExportData(filteredEntries, filteredWorkers, config);

    return {
      summary,
      workerReports,
      chartData,
      exportData
    };
  }

  private filterEntries(entries: TimeEntry[], config: ReportConfig): TimeEntry[] {
    return entries.filter(entry => {
      // Date range filter
      const entryDate = new Date(entry.date);
      const startDate = new Date(config.dateRange.start);
      const endDate = new Date(config.dateRange.end);
      
      if (entryDate < startDate || entryDate > endDate) {
        return false;
      }

      // Worker filter
      if (config.workers.length > 0 && !config.workers.includes(entry.workerId)) {
        return false;
      }

      // Status filter
      if (config.status && config.status.length > 0 && !config.status.includes(entry.status)) {
        return false;
      }

      return true;
    });
  }

  private filterWorkers(workers: Worker[], config: ReportConfig): Worker[] {
    if (config.workers.length === 0) {
      return workers;
    }
    return workers.filter(worker => config.workers.includes(worker.contractorId));
  }

  private generateSummary(entries: TimeEntry[], workers: Worker[], config: ReportConfig): ReportSummary {
    const totalHours = entries.reduce((sum, entry) => sum + this.calculateEntryHours(entry), 0);
    const approvedEntries = entries.filter(e => e.status === 'approved');
    const approvedHours = approvedEntries.reduce((sum, entry) => sum + this.calculateEntryHours(entry), 0);
    
    return {
      totalHours,
      totalWorkers: workers.length,
      totalEntries: entries.length,
      averageHoursPerWorker: workers.length > 0 ? totalHours / workers.length : 0,
      approvalRate: entries.length > 0 ? (approvedEntries.length / entries.length) * 100 : 0,
      periodStart: config.dateRange.start,
      periodEnd: config.dateRange.end
    };
  }

  private generateWorkerReports(entries: TimeEntry[], workers: Worker[], config: ReportConfig): WorkerReport[] {
    return workers.map(worker => {
      const workerEntries = entries.filter(e => e.workerId === worker.contractorId);
      const totalHours = workerEntries.reduce((sum, entry) => sum + this.calculateEntryHours(entry), 0);
      const approvedHours = workerEntries
        .filter(e => e.status === 'approved')
        .reduce((sum, entry) => sum + this.calculateEntryHours(entry), 0);
      const pendingHours = workerEntries
        .filter(e => e.status === 'draft' || e.status === 'submitted')
        .reduce((sum, entry) => sum + this.calculateEntryHours(entry), 0);
      const rejectedHours = workerEntries
        .filter(e => e.status === 'rejected')
        .reduce((sum, entry) => sum + this.calculateEntryHours(entry), 0);

      const startDate = new Date(config.dateRange.start);
      const endDate = new Date(config.dateRange.end);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const lastEntry = workerEntries
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      const proofOfWorkCount = workerEntries.reduce((sum, entry) => sum + entry.proofOfWork.length, 0);

      return {
        workerId: worker.contractorId,
        workerName: worker.name,
        workerEmail: worker.email,
        totalHours,
        approvedHours,
        pendingHours,
        rejectedHours,
        entriesCount: workerEntries.length,
        averageHoursPerDay: daysDiff > 0 ? totalHours / daysDiff : 0,
        lastActivity: lastEntry ? lastEntry.date : 'No activity',
        proofOfWorkCount
      };
    });
  }

  private generateChartData(entries: TimeEntry[], workers: Worker[], config: ReportConfig): ChartData {
    // Hours per worker
    const hoursPerWorker: ChartDataPoint[] = workers.map(worker => {
      const workerEntries = entries.filter(e => e.workerId === worker.contractorId);
      const hours = workerEntries.reduce((sum, entry) => sum + this.calculateEntryHours(entry), 0);
      return {
        label: worker.name,
        value: hours,
        color: this.getRandomColor()
      };
    });

    // Status distribution
    const statusCounts = entries.reduce((acc, entry) => {
      acc[entry.status] = (acc[entry.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusDistribution: ChartDataPoint[] = Object.entries(statusCounts).map(([status, count]) => ({
      label: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: this.getStatusColor(status)
    }));

    // Daily hours over time
    const dailyHours: ChartDataPoint[] = this.generateDailyHoursChart(entries, config);

    // Hours over time (weekly aggregation)
    const hoursOverTime: ChartDataPoint[] = this.generateWeeklyHoursChart(entries, config);

    return {
      hoursPerWorker,
      hoursOverTime,
      statusDistribution,
      dailyHours
    };
  }

  private generateDailyHoursChart(entries: TimeEntry[], config: ReportConfig): ChartDataPoint[] {
    const dailyTotals: Record<string, number> = {};
    
    entries.forEach(entry => {
      const date = entry.date;
      const hours = this.calculateEntryHours(entry);
      dailyTotals[date] = (dailyTotals[date] || 0) + hours;
    });

    return Object.entries(dailyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, hours]) => ({
        label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: hours
      }));
  }

  private generateWeeklyHoursChart(entries: TimeEntry[], config: ReportConfig): ChartDataPoint[] {
    const weeklyTotals: Record<string, number> = {};
    
    entries.forEach(entry => {
      const date = new Date(entry.date);
      const weekStart = this.getWeekStart(date);
      const weekKey = weekStart.toISOString().split('T')[0];
      const hours = this.calculateEntryHours(entry);
      weeklyTotals[weekKey] = (weeklyTotals[weekKey] || 0) + hours;
    });

    return Object.entries(weeklyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekStart, hours]) => ({
        label: `Week of ${new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        value: hours
      }));
  }

  private generateExportData(entries: TimeEntry[], workers: Worker[], config: ReportConfig): ExportData {
    const headers = [
      'Worker ID',
      'Worker Name',
      'Date',
      'Start Time',
      'End Time',
      'Manual Hours',
      'Total Hours',
      'Description',
      'Status',
      'Proof Count',
      'Client Notes'
    ];

    const data = entries.map(entry => {
      const worker = workers.find(w => w.contractorId === entry.workerId);
      return [
        entry.workerId,
        worker?.name || 'Unknown',
        entry.date,
        entry.startTime || '',
        entry.endTime || '',
        entry.manualHours || '',
        this.calculateEntryHours(entry),
        entry.description,
        entry.status,
        entry.proofOfWork.length,
        entry.clientNotes || ''
      ];
    });

    const filename = `time-report-${config.dateRange.start}-to-${config.dateRange.end}`;

    return {
      format: 'csv',
      filename,
      headers,
      data
    };
  }

  exportToPDF(reportData: ReportData): Blob {
    // This would integrate with a PDF library like jsPDF
    // For now, return a simple text representation
    const content = this.generatePDFContent(reportData);
    return new Blob([content], { type: 'application/pdf' });
  }

  exportToCSV(exportData: ExportData): Blob {
    const csvContent = this.generateCSVContent(exportData);
    return new Blob([csvContent], { type: 'text/csv' });
  }

  exportToExcel(exportData: ExportData): Blob {
    // This would integrate with a library like xlsx
    // For now, return CSV format
    const csvContent = this.generateCSVContent(exportData);
    return new Blob([csvContent], { type: 'application/vnd.ms-excel' });
  }

  private generateCSVContent(exportData: ExportData): string {
    const lines = [
      exportData.headers.join(','),
      ...exportData.data.map((row: any[]) => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
    ];
    return lines.join('\n');
  }

  private generatePDFContent(reportData: ReportData): string {
    // Simple text representation for PDF
    const summary = reportData.summary;
    return `
Time Tracking Report
Period: ${summary.periodStart} to ${summary.periodEnd}

Summary:
- Total Hours: ${summary.totalHours.toFixed(2)}
- Total Workers: ${summary.totalWorkers}
- Total Entries: ${summary.totalEntries}
- Average Hours per Worker: ${summary.averageHoursPerWorker.toFixed(2)}
- Approval Rate: ${summary.approvalRate.toFixed(1)}%

Worker Details:
${reportData.workerReports.map(worker => 
  `${worker.workerName}: ${worker.totalHours.toFixed(2)} hours (${worker.entriesCount} entries)`
).join('\n')}
    `.trim();
  }

  private calculateEntryHours(entry: TimeEntry): number {
    if (entry.manualHours) {
      return entry.manualHours;
    }
    if (entry.startTime && entry.endTime) {
      const start = new Date(`${entry.date}T${entry.startTime}`);
      const end = new Date(`${entry.date}T${entry.endTime}`);
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }
    return 0;
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  private getRandomColor(): string {
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private getStatusColor(status: string): string {
    const colors = {
      draft: '#6b7280',
      submitted: '#f59e0b',
      approved: '#10b981',
      rejected: '#ef4444'
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  }

  // Quick report generators
  generateQuickWeeklyReport(): ReportData {
    const today = new Date();
    const weekStart = this.getWeekStart(today);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return this.generateAdvancedReport({
      dateRange: {
        start: weekStart.toISOString().split('T')[0],
        end: weekEnd.toISOString().split('T')[0]
      },
      workers: [],
      includeProofOfWork: false,
      format: 'summary'
    });
  }

  generateQuickMonthlyReport(): ReportData {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return this.generateAdvancedReport({
      dateRange: {
        start: monthStart.toISOString().split('T')[0],
        end: monthEnd.toISOString().split('T')[0]
      },
      workers: [],
      includeProofOfWork: false,
      format: 'summary'
    });
  }
}