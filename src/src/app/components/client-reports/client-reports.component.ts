import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { TimeEntry, Worker } from '../../models/interfaces';
import { formatDate, formatHours, getInitials } from '../../utils/helpers';
import { MainLayoutComponent } from '../shared/main-layout/main-layout.component';
import { SimpleChartComponent, ChartDataPoint, ChartConfig } from '../shared/simple-chart/simple-chart.component';
import { ButtonComponent } from '../shared/button/button.component';

// Angular Material imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatTabsModule } from '@angular/material/tabs';

interface WorkerReportData {
  worker: Worker;
  totalHours: number;
  approvedHours: number;
  pendingHours: number;
  rejectedHours: number;
  entriesCount: number;
  entries: TimeEntry[];
}

interface DateRangeStats {
  totalWorkers: number;
  totalHours: number;
  averageHoursPerWorker: number;
  mostActiveWorker: string;
  totalApproved: number;
  totalPending: number;
  totalRejected: number;
}

@Component({
  selector: 'app-client-reports',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MainLayoutComponent,
    ButtonComponent,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatProgressBarModule,
    MatCheckboxModule,
    MatRadioModule,
    MatTabsModule,
    SimpleChartComponent
  ],
  templateUrl: './client-reports.component.html',
  styleUrl: './client-reports.component.scss'
})
export class ClientReportsComponent implements OnInit {
  // Filter state
  selectedPeriod = 'thisMonth';
  customStartDate = '';
  customEndDate = '';
  selectedWorkers: string[] = [];
  selectedStatuses: string[] = ['approved', 'submitted'];
  
  // Data
  workers: Worker[] = [];
  allTimeEntries: TimeEntry[] = [];
  filteredEntries: TimeEntry[] = [];
  workerReports: WorkerReportData[] = [];
  dateRangeStats: DateRangeStats = {
    totalWorkers: 0,
    totalHours: 0,
    averageHoursPerWorker: 0,
    mostActiveWorker: '',
    totalApproved: 0,
    totalPending: 0,
    totalRejected: 0
  };
  
  // View state
  selectedView = 'summary'; // 'summary' | 'detailed' | 'charts'
  isExporting = false;

  // Chart data
  workerHoursChartData: ChartDataPoint[] = [];
  statusBreakdownChartData: ChartDataPoint[] = [];
  hoursOverTimeChartData: ChartDataPoint[] = [];

  constructor(private storage: StorageService, private router: Router) {}

  ngOnInit() {
    this.loadData();
    this.applyFilters();
  }

  loadData() {
    this.workers = this.storage.getWorkers();
    this.allTimeEntries = this.storage.getTimeEntries();
    this.selectedWorkers = this.workers.map(w => w.contractorId);
  }

  applyFilters() {
    // Filter by date range
    const dateRange = this.getDateRange();
    let filtered = this.allTimeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= dateRange.start && entryDate <= dateRange.end;
    });

    // Filter by workers
    if (this.selectedWorkers.length > 0) {
      filtered = filtered.filter(entry => this.selectedWorkers.includes(entry.workerId));
    }

    // Filter by status
    if (this.selectedStatuses.length > 0) {
      filtered = filtered.filter(entry => this.selectedStatuses.includes(entry.status));
    }

    this.filteredEntries = filtered;
    this.generateWorkerReports();
    this.calculateStats();
  }

  getDateRange(): { start: Date; end: Date } {
    const now = new Date();
    let start: Date, end: Date;

    switch (this.selectedPeriod) {
      case 'thisWeek':
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        break;
      case 'lastWeek':
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay() - 7);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        break;
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'custom':
        start = this.customStartDate ? new Date(this.customStartDate) : new Date(now.getFullYear(), 0, 1);
        end = this.customEndDate ? new Date(this.customEndDate) : now;
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return { start, end };
  }

  generateWorkerReports() {
    const workerMap = new Map<string, WorkerReportData>();

    // Initialize reports for selected workers
    this.workers
      .filter(w => this.selectedWorkers.includes(w.contractorId))
      .forEach(worker => {
        workerMap.set(worker.contractorId, {
          worker,
          totalHours: 0,
          approvedHours: 0,
          pendingHours: 0,
          rejectedHours: 0,
          entriesCount: 0,
          entries: []
        });
      });

    // Aggregate data from filtered entries
    this.filteredEntries.forEach(entry => {
      const report = workerMap.get(entry.workerId);
      if (report) {
        const hours = this.getEntryHours(entry);
        report.totalHours += hours;
        report.entriesCount++;
        report.entries.push(entry);

        switch (entry.status) {
          case 'approved':
            report.approvedHours += hours;
            break;
          case 'submitted':
            report.pendingHours += hours;
            break;
          case 'rejected':
            report.rejectedHours += hours;
            break;
        }
      }
    });

    this.workerReports = Array.from(workerMap.values())
      .sort((a, b) => b.totalHours - a.totalHours);
  }

  calculateStats() {
    const activeWorkers = this.workerReports.filter(r => r.totalHours > 0);
    
    this.dateRangeStats = {
      totalWorkers: activeWorkers.length,
      totalHours: this.workerReports.reduce((sum, r) => sum + r.totalHours, 0),
      averageHoursPerWorker: activeWorkers.length > 0 ? 
        this.workerReports.reduce((sum, r) => sum + r.totalHours, 0) / activeWorkers.length : 0,
      mostActiveWorker: activeWorkers.length > 0 ? activeWorkers[0].worker.name : 'None',
      totalApproved: this.workerReports.reduce((sum, r) => sum + r.approvedHours, 0),
      totalPending: this.workerReports.reduce((sum, r) => sum + r.pendingHours, 0),
      totalRejected: this.workerReports.reduce((sum, r) => sum + r.rejectedHours, 0)
    };

    this.generateChartData();
  }


  getCurrentPeriodText(): string {
    const range = this.getDateRange();
    return `${this.formatDate(range.start.toISOString())} - ${this.formatDate(range.end.toISOString())}`;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getPercentage(value: number, total: number): number {
    return total > 0 ? (value / total) * 100 : 0;
  }

  async exportDetailedReport() {
    this.isExporting = true;
    try {
      // Dynamic import of xlsx
      const XLSX = await import('xlsx');
      
      const workbook = XLSX.utils.book_new();
      
      // Summary sheet
      const summaryData = [
        ['Ontop Time Tracking - Detailed Report'],
        ['Period:', this.getCurrentPeriodText()],
        ['Generated:', new Date().toLocaleString()],
        [],
        ['Summary Statistics'],
        ['Total Workers:', this.dateRangeStats.totalWorkers],
        ['Total Hours:', this.formatHours(this.dateRangeStats.totalHours)],
        ['Average Hours per Worker:', this.formatHours(this.dateRangeStats.averageHoursPerWorker)],
        ['Most Active Worker:', this.dateRangeStats.mostActiveWorker],
        ['Approved Hours:', this.formatHours(this.dateRangeStats.totalApproved)],
        ['Pending Hours:', this.formatHours(this.dateRangeStats.totalPending)],
        ['Rejected Hours:', this.formatHours(this.dateRangeStats.totalRejected)],
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Worker details sheet
      const workerHeaders = ['Worker Name', 'Email', 'Total Hours', 'Approved Hours', 'Pending Hours', 'Rejected Hours', 'Entries Count'];
      const workerData = this.workerReports.map(report => [
        report.worker.name,
        report.worker.email,
        this.formatHours(report.totalHours),
        this.formatHours(report.approvedHours),
        this.formatHours(report.pendingHours),
        this.formatHours(report.rejectedHours),
        report.entriesCount
      ]);
      
      const workerSheet = XLSX.utils.aoa_to_sheet([workerHeaders, ...workerData]);
      XLSX.utils.book_append_sheet(workbook, workerSheet, 'Worker Summary');
      
      // Individual entries sheet
      const entryHeaders = ['Date', 'Worker Name', 'Hours', 'Type', 'Description', 'Status', 'Proof Items'];
      const entryData = this.filteredEntries.map(entry => {
        const worker = this.workers.find(w => w.contractorId === entry.workerId);
        return [
          this.formatDate(entry.date),
          worker?.name || 'Unknown',
          this.formatHours(this.getEntryHours(entry)),
          entry.startTime ? 'Clock' : 'Manual',
          entry.description || '',
          entry.status,
          entry.proofOfWork.length
        ];
      });
      
      const entrySheet = XLSX.utils.aoa_to_sheet([entryHeaders, ...entryData]);
      XLSX.utils.book_append_sheet(workbook, entrySheet, 'All Entries');
      
      // Download file
      const fileName = `ontop-detailed-report-${this.selectedPeriod}-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
    } catch (error) {
      alert('Error generating report');
      console.error(error);
    } finally {
      this.isExporting = false;
    }
  }

  goToDashboard() {
    this.router.navigate(['/client/dashboard']);
  }

  getEntryHours(entry: TimeEntry): number {
    if (entry.manualHours) return entry.manualHours;
    if (entry.startTime && entry.endTime) {
      const start = new Date(`2000-01-01T${entry.startTime}`);
      const end = new Date(`2000-01-01T${entry.endTime}`);
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }
    return 0;
  }

  getWorkerName(workerId: string): string {
    const worker = this.workers.find(w => w.contractorId === workerId);
    
    // Enhanced error handling and logging
    if (!worker) {
      console.warn('Worker not found for ID:', workerId);
      console.log('Available workers:', this.workers.map(w => ({ id: w.contractorId, name: w.name })));
      return `Worker ${workerId}`;
    }
    
    if (!worker.name || worker.name === 'Unknown') {
      console.error('Worker has invalid name:', worker);
      return `Worker ${worker.contractorId}`;
    }
    
    return worker.name;
  }

  getMaxWorkerHours(): number {
    if (this.workerReports.length === 0) return 1;
    return Math.max(...this.workerReports.map(r => r.totalHours));
  }

  // Tab management methods
  getSelectedTabIndex(): number {
    switch (this.selectedView) {
      case 'summary': return 0;
      case 'detailed': return 1;
      case 'charts': return 2;
      default: return 0;
    }
  }

  onTabChange(index: number): void {
    switch (index) {
      case 0: this.selectedView = 'summary'; break;
      case 1: this.selectedView = 'detailed'; break;
      case 2: 
        this.selectedView = 'charts'; 
        // Ensure chart data is generated when switching to charts view
        setTimeout(() => this.generateChartData(), 0);
        break;
    }
  }

  generateChartData() {
    console.log('Generating chart data...', { 
      workerReports: this.workerReports.length, 
      dateRangeStats: this.dateRangeStats 
    });

    // Worker Hours Chart (Top 5 workers)
    this.workerHoursChartData = this.workerReports
      .filter(r => r.totalHours > 0)
      .slice(0, 5)
      .map(report => ({
        label: report.worker.name.split(' ')[0], // First name only for space
        value: parseFloat(report.totalHours.toFixed(1)),
        subtitle: `${report.totalHours.toFixed(1)}h total`
      }));

    console.log('Worker hours chart data:', this.workerHoursChartData);

    // Status Breakdown Chart - ensure we have data even if all zeros
    const statusData = [
      { label: 'Approved', value: this.dateRangeStats.totalApproved || 0, color: '#10b981' },
      { label: 'Pending', value: this.dateRangeStats.totalPending || 0, color: '#f59e0b' },
      { label: 'Rejected', value: this.dateRangeStats.totalRejected || 0, color: '#ef4444' }
    ];

    this.statusBreakdownChartData = statusData
      .filter(item => item.value > 0)
      .map(item => ({
        label: item.label,
        value: parseFloat(item.value.toFixed(1)),
        color: item.color,
        subtitle: `${item.value.toFixed(1)} hours`
      }));

    console.log('Status breakdown chart data:', this.statusBreakdownChartData);

    // Add sample data if no real data exists for testing
    if (this.workerHoursChartData.length === 0 && this.statusBreakdownChartData.length === 0) {
      console.log('No chart data found, adding sample data for testing');
      this.workerHoursChartData = [
        { label: 'Sample Worker', value: 8, subtitle: '8.0h total' }
      ];
      this.statusBreakdownChartData = [
        { label: 'Sample Data', value: 8, color: '#10b981', subtitle: '8.0 hours' }
      ];
    }

    // Hours over time (simplified - just show daily totals for current period)
    this.generateTimeSeriesData();
  }

  generateTimeSeriesData() {
    // Group entries by date
    const dateMap = new Map<string, number>();
    
    this.filteredEntries.forEach(entry => {
      const date = entry.date;
      const hours = this.getEntryHours(entry);
      dateMap.set(date, (dateMap.get(date) || 0) + hours);
    });

    // Convert to chart data and sort by date
    this.hoursOverTimeChartData = Array.from(dateMap.entries())
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-7) // Last 7 days
      .map(([date, hours]) => ({
        label: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        value: parseFloat(hours.toFixed(1)),
        subtitle: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }));

    console.log('Time series chart data:', this.hoursOverTimeChartData);

    // Add sample data if empty for testing
    if (this.hoursOverTimeChartData.length === 0) {
      const today = new Date();
      this.hoursOverTimeChartData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (6 - i));
        return {
          label: date.toLocaleDateString('en-US', { weekday: 'short' }),
          value: Math.floor(Math.random() * 8) + 1,
          subtitle: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
      });
      console.log('Added sample time series data:', this.hoursOverTimeChartData);
    }
  }

  getWorkerHoursChartConfig(): ChartConfig {
    return {
      type: 'horizontal-bar',
      title: 'Top Workers by Hours',
      subtitle: `${this.getCurrentPeriodText()}`,
      showValues: true,
      showPercentages: false,
      height: 300,
      colors: ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']
    };
  }

  getStatusChartConfig(): ChartConfig {
    return {
      type: 'donut',
      title: 'Hours by Status',
      subtitle: `Total: ${this.dateRangeStats.totalHours.toFixed(1)} hours`,
      showValues: true,
      showPercentages: true
    };
  }

  getTimeSeriesChartConfig(): ChartConfig {
    return {
      type: 'bar',
      title: 'Hours Over Time',
      subtitle: 'Daily breakdown (last 7 days)',
      showValues: true,
      showPercentages: false,
      height: 250
    };
  }

  // Utility functions
  formatDate = formatDate;
  formatHours = formatHours;
  getInitials = getInitials;
}
