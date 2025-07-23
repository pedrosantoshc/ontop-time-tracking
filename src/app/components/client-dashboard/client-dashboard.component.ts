import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { Client, Worker, TimeEntry } from '../../models/interfaces';
import * as XLSX from 'xlsx';
import { ApprovalService } from '../../services/approval.service';
import { KpiCardData } from '../shared/kpi-card/kpi-card.component';
import { MainLayoutComponent } from '../shared/main-layout/main-layout.component';
import { FilterPanelComponent, FilterConfig, FilterChangeEvent } from '../shared/filter-panel/filter-panel.component';
// No longer importing AdvancedDataTableComponent - now using WorkerReportsTableComponent
import { DashboardHeaderComponent } from '../dashboard/dashboard-header/dashboard-header.component';
import { KpiDashboardComponent } from '../dashboard/kpi-dashboard/kpi-dashboard.component';
import { WorkerReportsTableComponent, WorkerReport } from '../dashboard/worker-reports-table/worker-reports-table.component';
import { AdvancedDataTableComponent, TableColumn, TableConfig, TableAction } from '../shared/advanced-data-table/advanced-data-table.component';

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
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';

// Using WorkerReport interface from WorkerReportsTableComponent

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MainLayoutComponent,
    FilterPanelComponent,
    DashboardHeaderComponent,
    KpiDashboardComponent,
    WorkerReportsTableComponent,
    AdvancedDataTableComponent,
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
    MatSortModule,
    MatPaginatorModule
  ],
  templateUrl: './client-dashboard.component.html',
  styleUrls: ['./client-dashboard.component.scss']
})
export class ClientDashboardComponent implements OnInit {
  workers: Worker[] = [];
  allTimeEntries: TimeEntry[] = [];
  workerReports: WorkerReport[] = [];
  selectedWorkerEntries: TimeEntry[] = [];
  selectedWorkerId = '';
  
  // Material Table
  displayedColumns: string[] = ['worker', 'email', 'approvedHours', 'pendingHours', 'totalHours', 'lastActivity', 'status', 'actions'];
  
  // Filtering
  selectedPeriod = 'thisWeek';
  customStartDate = '';
  customEndDate = '';
  
  // Processing states
  isExporting = false;


  // KPI Cards Data
  kpiCards: KpiCardData[] = [];

  // Filter Configuration
  filterConfigs: FilterConfig[] = [];

  // Loading states
  isDashboardLoading = false;
  isTableLoading = false;

  // Individual Entries Table Configuration
  individualEntriesColumns: TableColumn[] = [];
  individualEntriesConfig: TableConfig = {};
  individualEntriesActions: TableAction[] = [];

  // All Workers Table Configuration  
  allWorkersColumns: TableColumn[] = [];
  allWorkersConfig: TableConfig = {};
  allWorkersActions: TableAction[] = [];

  constructor(
    private storage: StorageService,
    private router: Router,
    private approval: ApprovalService
  ) {}


  ngOnInit() {
    this.loadData();
    this.initializeFilters();
    this.initializeTables();
    this.generateWorkerReports();
  }

  loadData() {
    this.workers = this.storage.getWorkers();
    this.allTimeEntries = this.storage.getTimeEntries();
  }


  initializeFilters() {
    this.filterConfigs = [
      {
        id: 'timePeriod',
        label: 'Time Period',
        type: 'select',
        icon: 'date_range',
        value: this.selectedPeriod,
        options: [
          { value: 'thisWeek', label: 'This Week' },
          { value: 'lastWeek', label: 'Last Week' },
          { value: 'thisMonth', label: 'This Month' },
          { value: 'lastMonth', label: 'Last Month' },
          { value: 'custom', label: 'Custom Range' }
        ]
      }
    ];

    // Add custom date range if custom is selected
    if (this.selectedPeriod === 'custom') {
      this.filterConfigs.push({
        id: 'customDateRange',
        label: 'Custom Date Range',
        type: 'dateRange',
        value: {
          start: this.customStartDate,
          end: this.customEndDate
        }
      });
    }
  }

  initializeTables() {
    // Individual Entries Table Configuration
    this.individualEntriesColumns = [
      {
        key: 'date',
        label: 'Date',
        sortable: true,
        filterable: true,
        type: 'date',
        width: '120px'
      },
      {
        key: 'hours',
        label: 'Hours',
        sortable: true,
        filterable: true,
        type: 'number',
        align: 'right',
        width: '80px',
        format: (value) => `${value}h`
      },
      {
        key: 'type',
        label: 'Type',
        sortable: true,
        filterable: true,
        type: 'status',
        width: '100px',
        statusOptions: [
          { value: 'Clock', label: 'Clock In/Out', class: 'bg-blue-100 text-blue-800' },
          { value: 'Manual', label: 'Manual Entry', class: 'bg-purple-100 text-purple-800' }
        ]
      },
      {
        key: 'description',
        label: 'Description',
        sortable: true,
        filterable: true,
        type: 'text',
        width: '200px'
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        filterable: true,
        type: 'status',
        width: '100px',
        statusOptions: [
          { value: 'approved', label: 'Approved', class: 'bg-green-100 text-green-800' },
          { value: 'submitted', label: 'Submitted', class: 'bg-yellow-100 text-yellow-800' },
          { value: 'rejected', label: 'Rejected', class: 'bg-red-100 text-red-800' },
          { value: 'draft', label: 'Draft', class: 'bg-gray-100 text-gray-800' }
        ]
      }
    ];

    this.individualEntriesConfig = {
      showPagination: true,
      showSelection: false,
      showFilters: true,
      showExport: false,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      dense: false,
      stickyHeader: true
    };

    this.individualEntriesActions = [
      {
        icon: 'check',
        label: 'Approve',
        tooltip: 'Approve entry',
        color: 'primary',
        handler: (row) => this.approveEntry(row.originalEntry),
        disabled: (row) => row.status === 'approved'
      },
      {
        icon: 'close',
        label: 'Reject',
        tooltip: 'Reject entry',
        color: 'warn',
        handler: (row) => this.rejectEntry(row.originalEntry),
        disabled: (row) => row.status === 'rejected'
      }
    ];

    // All Workers Table Configuration
    this.allWorkersColumns = [
      {
        key: 'name',
        label: 'Worker Name',
        sortable: true,
        filterable: true,
        type: 'custom',
        width: '200px'
      },
      {
        key: 'email',
        label: 'Email',
        sortable: true,
        filterable: true,
        type: 'text',
        width: '180px'
      },
      {
        key: 'contractorId',
        label: 'Contractor ID',
        sortable: true,
        filterable: true,
        type: 'text',
        width: '140px'
      },
      {
        key: 'trackingMode',
        label: 'Tracking Mode',
        sortable: true,
        filterable: true,
        type: 'status',
        width: '140px',
        statusOptions: [
          { value: 'clock', label: 'Clock In/Out', class: 'bg-blue-100 text-blue-800' },
          { value: 'timesheet', label: 'Timesheet', class: 'bg-purple-100 text-purple-800' }
        ]
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        filterable: true,
        type: 'status',
        width: '120px',
        statusOptions: [
          { value: 'Active', label: 'Active', class: 'bg-green-100 text-green-800' },
          { value: 'Invited', label: 'Invited', class: 'bg-gray-100 text-gray-800' }
        ]
      }
    ];

    this.allWorkersConfig = {
      showPagination: true,
      showSelection: false,
      showFilters: true,
      showExport: false,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      dense: false,
      stickyHeader: true
    };

    this.allWorkersActions = [
      {
        icon: 'visibility',
        label: 'View Details',
        tooltip: 'View worker time entries',
        handler: (row) => this.viewWorkerDetails(row.contractorId)
      }
    ];
  }

  onFilterChange(event: FilterChangeEvent) {
    switch (event.filterId) {
      case 'timePeriod':
        this.selectedPeriod = event.value;
        this.initializeFilters(); // Refresh to add/remove custom date range
        break;
      case 'customDateRange':
        this.customStartDate = event.value.start || '';
        this.customEndDate = event.value.end || '';
        break;
    }
    
    // Regenerate reports when filters change
    this.generateWorkerReports();
  }

  onFiltersReset() {
    this.selectedPeriod = 'thisWeek';
    this.customStartDate = '';
    this.customEndDate = '';
    this.initializeFilters();
    this.generateWorkerReports();
  }

  generateWorkerReports() {
    const { startDate, endDate } = this.getDateRange();
    
    // Filter entries by date range
    const filteredEntries = this.allTimeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });

    // Group by worker and calculate totals
    this.workerReports = this.workers.map(worker => {
      const workerEntries = filteredEntries.filter(entry => entry.workerId === worker.contractorId);
      
      const approvedHours = workerEntries
        .filter(entry => entry.status === 'approved')
        .reduce((sum, entry) => sum + this.getEntryHours(entry), 0);
      
      const pendingHours = workerEntries
        .filter(entry => entry.status === 'draft' || entry.status === 'submitted')
        .reduce((sum, entry) => sum + this.getEntryHours(entry), 0);
      
      const rejectedHours = workerEntries
        .filter(entry => entry.status === 'rejected')
        .reduce((sum, entry) => sum + this.getEntryHours(entry), 0);

      const totalHours = approvedHours + pendingHours + rejectedHours;
      
      // Find last activity date
      const lastEntry = workerEntries
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      // Determine overall status
      let status = 'No Activity';
      if (pendingHours > 0) status = 'Pending Review';
      else if (approvedHours > 0) status = 'Up to Date';
      
      return {
        reference: worker.contractorId,
        workerName: worker.name,
        email: worker.email,
        totalHours,
        approvedHours,
        pendingHours,
        rejectedHours,
        lastActivity: lastEntry ? lastEntry.date : '',
        status
      };
    }).filter(report => report.totalHours > 0); // Only show workers with hours
    
    // Generate KPI cards after worker reports are ready
    this.generateKpiCards();
  }

  generateKpiCards() {
    const totalWorkers = this.workers.length;
    const activeWorkers = this.workerReports.length;
    const totalHours = this.workerReports.reduce((sum, r) => sum + r.totalHours, 0);
    const pendingHours = this.workerReports.reduce((sum, r) => sum + r.pendingHours, 0);
    const approvedHours = this.workerReports.reduce((sum, r) => sum + r.approvedHours, 0);
    
    // Calculate trends (mock data for now - in production would compare with previous period)
    const workerTrend = Math.floor(Math.random() * 20) - 10; // -10 to +10
    const pendingTrend = Math.floor(Math.random() * 30) - 15; // -15 to +15
    const approvedTrend = Math.floor(Math.random() * 25) - 5; // -5 to +20
    const activeTrend = Math.floor(Math.random() * 15) - 5; // -5 to +10

    this.kpiCards = [
      {
        title: 'Total Workers',
        value: totalWorkers,
        icon: 'people',
        variant: 'primary',
        clickable: true,
        subtitle: `${activeWorkers} active this period`,
        trend: {
          value: Math.abs(workerTrend),
          direction: workerTrend > 0 ? 'up' : workerTrend < 0 ? 'down' : 'neutral',
          period: 'vs last period'
        }
      },
      {
        title: 'Pending Hours',
        value: `${pendingHours.toFixed(1)}h`,
        icon: 'pending_actions',
        variant: 'warning',
        clickable: true,
        subtitle: 'Requires approval',
        trend: {
          value: Math.abs(pendingTrend),
          direction: pendingTrend > 0 ? 'up' : pendingTrend < 0 ? 'down' : 'neutral',
          period: 'vs last week'
        }
      },
      {
        title: 'Approved Hours',
        value: `${approvedHours.toFixed(1)}h`,
        icon: 'check_circle',
        variant: 'success',
        clickable: false,
        subtitle: 'This period',
        trend: {
          value: Math.abs(approvedTrend),
          direction: approvedTrend > 0 ? 'up' : approvedTrend < 0 ? 'down' : 'neutral',
          period: 'vs last week'
        }
      },
      {
        title: 'Active Workers',
        value: activeWorkers,
        icon: 'trending_up',
        variant: 'info',
        clickable: true,
        subtitle: 'With logged time',
        trend: {
          value: Math.abs(activeTrend),
          direction: activeTrend > 0 ? 'up' : activeTrend < 0 ? 'down' : 'neutral',
          period: 'vs last period'
        }
      }
    ];
  }

  onKpiCardClick(cardData: KpiCardData) {
    // Handle KPI card clicks for navigation
    switch (cardData.title) {
      case 'Total Workers':
        // Navigate to workers management (settings page)
        this.router.navigate(['/client/settings']);
        break;
      case 'Pending Hours':
        // Navigate to dedicated approvals page
        this.router.navigate(['/client/approvals']);
        break;
      case 'Active Workers':
        // Navigate to workers management (settings page)
        this.router.navigate(['/client/settings']);
        break;
      default:
        break;
    }
  }

  getDateRange() {
    const today = new Date();
    let startDate: Date;
    let endDate = new Date(today);

    switch (this.selectedPeriod) {
      case 'thisWeek':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay());
        break;
      case 'lastWeek':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay() - 7);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        break;
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'custom':
        startDate = this.customStartDate ? new Date(this.customStartDate) : new Date(today);
        endDate = this.customEndDate ? new Date(this.customEndDate) : new Date(today);
        break;
      default:
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay());
    }

    return { startDate, endDate };
  }

  async exportConsolidatedReport() {
    this.isExporting = true;
    
    try {
      // Generate XLSX file with proper column formatting
      this.generateConsolidatedXLSX();
    } catch (error) {
      alert('Failed to export Excel file. Please try again.');
    }
    
    this.isExporting = false;
  }

  generateConsolidatedXLSX() {
    // Create worksheet data with headers and rows
    const worksheetData = [
      // Headers
      [
        'Reference',
        'Worker name', 
        'Email',
        'Total Hours',
        'Approved Hours',
        'Pending Hours', 
        'Status',
        'Period',
        'Last Activity'
      ],
      // Data rows
      ...this.workerReports.map(report => [
        report.reference,
        report.workerName,
        report.email,
        Number(report.totalHours.toFixed(2)),
        Number(report.approvedHours.toFixed(2)),
        Number(report.pendingHours.toFixed(2)),
        report.status,
        this.getCurrentPeriodText(),
        report.lastActivity
      ])
    ];

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths for better formatting
    const columnWidths = [
      { wch: 12 }, // Reference
      { wch: 20 }, // Worker name
      { wch: 25 }, // Email
      { wch: 12 }, // Total Hours
      { wch: 15 }, // Approved Hours
      { wch: 14 }, // Pending Hours
      { wch: 15 }, // Status
      { wch: 25 }, // Period
      { wch: 12 }  // Last Activity
    ];
    worksheet['!cols'] = columnWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Time Report');

    // Generate filename
    const periodText = this.getCurrentPeriodText().replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `ontop-timesheet-consolidated-${periodText}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);
  }

  viewWorkerDetails(workerId: string) {
    this.selectedWorkerId = workerId;
    const { startDate, endDate } = this.getDateRange();
    
    this.selectedWorkerEntries = this.allTimeEntries
      .filter(entry => {
        const entryDate = new Date(entry.date);
        return entry.workerId === workerId && 
               entryDate >= startDate && 
               entryDate <= endDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  clearWorkerSelection() {
    this.selectedWorkerId = '';
    this.selectedWorkerEntries = [];
  }

  approveEntry(entry: TimeEntry) {
    entry.status = 'approved';
    this.updateEntry(entry);
  }

  rejectEntry(entry: TimeEntry) {
    const reason = prompt('Reason for rejection (optional):');
    entry.status = 'rejected';
    entry.clientNotes = reason || 'Rejected';
    this.updateEntry(entry);
  }

  updateEntry(entry: TimeEntry) {
    const index = this.allTimeEntries.findIndex(e => e.id === entry.id);
    if (index !== -1) {
      this.allTimeEntries[index] = entry;
      this.storage.saveTimeEntries(this.allTimeEntries);
      this.generateWorkerReports();
    }
  }

  goToSetup() {
    this.router.navigate(['/client/settings']);
  }

  goToReports() {
    this.router.navigate(['/client/reports']);
  }

  resetTimeData() {
    if (confirm('Are you sure you want to delete all time entries? This will clear all hours data but keep your workers.')) {
      // Clear all time entries
      this.storage.saveTimeEntries([]);
      
      // Reload data
      this.loadData();
      this.generateWorkerReports();
    }
  }

  showAllWorkers() {
    // Set the selectedWorkerId to a special value that indicates "show all workers"
    this.selectedWorkerId = 'all_workers';
    
    // Clear any selected worker entries
    this.selectedWorkerEntries = [];
  }

  // Data transformation methods for advanced tables
  getIndividualEntriesTableData(): any[] {
    return this.selectedWorkerEntries.map(entry => ({
      id: entry.id,
      date: entry.date,
      hours: this.getEntryHours(entry),
      type: entry.startTime ? 'Clock' : 'Manual',
      description: entry.description || 'No description',
      status: entry.status,
      // Keep original entry for actions
      originalEntry: entry
    }));
  }

  getAllWorkersTableData(): any[] {
    return this.workers.map(worker => ({
      id: worker.contractorId,
      name: worker.name,
      email: worker.email,
      contractorId: worker.contractorId,
      trackingMode: worker.trackingMode,
      status: worker.isActive ? 'Active' : 'Invited',
      joinedAt: worker.joinedAt,
      // Keep original worker for actions
      originalWorker: worker
    }));
  }

  // Utility methods
  getCurrentPeriodText(): string {
    const { startDate, endDate } = this.getDateRange();
    return `${this.formatDate(startDate.toISOString())} - ${this.formatDate(endDate.toISOString())}`;
  }

  getSelectedWorkerName(): string {
    const worker = this.workers.find(w => w.contractorId === this.selectedWorkerId);
    
    // Enhanced error handling and logging
    if (!worker) {
      console.warn('Worker not found for ID:', this.selectedWorkerId);
      console.log('Available workers:', this.workers.map(w => ({ id: w.contractorId, name: w.name })));
      return 'Worker Not Found';
    }
    
    if (!worker.name || worker.name === 'Unknown') {
      console.error('Worker has invalid name:', worker);
      return `Worker ${worker.contractorId}`;
    }
    
    return worker.name;
  }

  getTotalHours(): string {
    const total = this.workerReports.reduce((sum, report) => sum + report.totalHours, 0);
    return total.toFixed(1);
  }

  getTotalApprovedHours(): string {
    const total = this.workerReports.reduce((sum, report) => sum + report.approvedHours, 0);
    return total.toFixed(1);
  }

  getTotalPendingHours(): string {
    const total = this.workerReports.reduce((sum, report) => sum + report.pendingHours, 0);
    return total.toFixed(1);
  }

  getActiveWorkersCount(): number {
    return this.workerReports.filter(report => report.totalHours > 0).length;
  }

  getWorkerInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
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

  formatHours(hours: number): string {
    return hours.toFixed(2);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getWorkerStatusClass(report: WorkerReport): string {
    switch (report.status) {
      case 'Up to Date': return 'bg-green-100 text-green-800';
      case 'Pending Review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Dashboard Sub-Component Event Handlers
  onDashboardExport() {
    this.exportConsolidatedReport();
  }

  onDashboardReset() {
    this.resetTimeData();
  }

  onWorkerReportsExport() {
    this.exportConsolidatedReport();
  }

  onWorkerReportsRefresh() {
    this.isDashboardLoading = true;
    // Simulate loading delay
    setTimeout(() => {
      this.loadData();
      this.generateWorkerReports();
      this.isDashboardLoading = false;
    }, 500);
  }

  onWorkerClick(workerId: string) {
    this.viewWorkerDetails(workerId);
  }
}
