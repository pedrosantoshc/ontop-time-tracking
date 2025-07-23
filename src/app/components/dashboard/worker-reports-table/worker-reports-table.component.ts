import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdvancedDataTableComponent, TableColumn, TableConfig, TableAction } from '../../shared/advanced-data-table/advanced-data-table.component';

// Material imports
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

export interface WorkerReport {
  reference: string;
  workerName: string;
  email: string;
  totalHours: number;
  approvedHours: number;
  pendingHours: number;
  rejectedHours: number;
  lastActivity: string;
  status: string;
}

@Component({
  selector: 'app-worker-reports-table',
  standalone: true,
  imports: [
    CommonModule,
    AdvancedDataTableComponent,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './worker-reports-table.component.html',
  styleUrls: ['./worker-reports-table.component.scss']
})
export class WorkerReportsTableComponent implements OnInit, OnChanges {
  @Input() reports: WorkerReport[] = [];
  @Input() loading = false;
  @Input() totalWorkers = 0;
  @Input() totalHours = '0.0';

  @Output() workerClick = new EventEmitter<string>();
  @Output() exportClick = new EventEmitter<void>();
  @Output() refreshClick = new EventEmitter<void>();

  tableColumns: TableColumn[] = [];
  tableConfig: TableConfig = {};
  tableActions: TableAction[] = [];

  ngOnInit() {
    this.initializeTable();
  }

  ngOnChanges() {
    // Update filter options when reports data changes
    if (this.reports && this.reports.length > 0) {
      this.updateTableColumns();
    }
  }

  private initializeTable() {
    this.tableColumns = [
      {
        key: 'workerName',
        label: 'Worker',
        sortable: true,
        filterable: true,
        type: 'custom',
        width: '200px',
        filterType: 'select',
        filterOptions: this.getWorkerFilterOptions()
      },
      {
        key: 'email',
        label: 'Email',
        sortable: true,
        filterable: true,
        type: 'text',
        width: '180px',
        filterType: 'select',
        filterOptions: this.getEmailFilterOptions()
      },
      {
        key: 'approvedHours',
        label: 'Approved',
        sortable: true,
        filterable: true,
        type: 'number',
        align: 'right',
        width: '120px',
        format: (value) => `${this.formatHours(value)}h`,
        filterType: 'select',
        filterOptions: this.getHoursRangeOptions()
      },
      {
        key: 'pendingHours',
        label: 'Pending',
        sortable: true,
        filterable: true,
        type: 'number',
        align: 'right',
        width: '120px',
        format: (value) => `${this.formatHours(value)}h`,
        filterType: 'select',
        filterOptions: this.getHoursRangeOptions()
      },
      {
        key: 'totalHours',
        label: 'Total',
        sortable: true,
        filterable: true,
        type: 'number',
        align: 'right',
        width: '120px',
        format: (value) => `${this.formatHours(value)}h`,
        filterType: 'select',
        filterOptions: this.getHoursRangeOptions()
      },
      {
        key: 'lastActivity',
        label: 'Last Activity',
        sortable: true,
        filterable: true,
        type: 'date',
        width: '140px',
        filterType: 'select',
        filterOptions: this.getDateRangeOptions()
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        filterable: true,
        type: 'status',
        width: '130px',
        statusOptions: [
          { value: 'Up to Date', label: 'Up to Date', class: 'bg-green-100 text-green-800' },
          { value: 'Pending Review', label: 'Pending Review', class: 'bg-yellow-100 text-yellow-800' },
          { value: 'No Activity', label: 'No Activity', class: 'bg-gray-100 text-gray-800' }
        ]
      }
    ];

    this.tableConfig = {
      showPagination: true,
      showSelection: false,
      showFilters: true,
      showExport: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      dense: false,
      stickyHeader: true
    };

    this.tableActions = [
      {
        icon: 'visibility',
        label: 'View Details',
        tooltip: 'View worker time entries',
        handler: (row) => this.onWorkerClick(row.reference)
      }
    ];
  }

  onWorkerClick(workerId: string) {
    this.workerClick.emit(workerId);
  }

  onTableExport() {
    this.exportClick.emit();
  }

  onTableRefresh() {
    this.refreshClick.emit();
  }

  onTableRowClick(row: WorkerReport) {
    this.onWorkerClick(row.reference);
  }

  private formatHours(hours: number): string {
    return hours.toFixed(2);
  }

  private getWorkerFilterOptions() {
    return this.reports.map(report => ({
      value: report.workerName,
      label: report.workerName
    }));
  }

  private getEmailFilterOptions() {
    return this.reports.map(report => ({
      value: report.email,
      label: report.email
    }));
  }

  private updateTableColumns() {
    // Update filter options for existing columns
    const workerColumn = this.tableColumns.find(col => col.key === 'workerName');
    const emailColumn = this.tableColumns.find(col => col.key === 'email');
    const approvedColumn = this.tableColumns.find(col => col.key === 'approvedHours');
    const pendingColumn = this.tableColumns.find(col => col.key === 'pendingHours');
    const totalColumn = this.tableColumns.find(col => col.key === 'totalHours');
    const activityColumn = this.tableColumns.find(col => col.key === 'lastActivity');
    
    if (workerColumn) {
      workerColumn.filterOptions = this.getWorkerFilterOptions();
    }
    if (emailColumn) {
      emailColumn.filterOptions = this.getEmailFilterOptions();
    }
    if (approvedColumn) {
      approvedColumn.filterOptions = this.getHoursRangeOptions();
    }
    if (pendingColumn) {
      pendingColumn.filterOptions = this.getHoursRangeOptions();
    }
    if (totalColumn) {
      totalColumn.filterOptions = this.getHoursRangeOptions();
    }
    if (activityColumn) {
      activityColumn.filterOptions = this.getDateRangeOptions();
    }

    // 🚀 Force change detection by creating a new array reference
    this.tableColumns = [...this.tableColumns];
  }

  private getHoursRangeOptions() {
    return [
      { value: '0-5', label: '0-5 hours' },
      { value: '5-10', label: '5-10 hours' },
      { value: '10-20', label: '10-20 hours' },
      { value: '20-40', label: '20-40 hours' },
      { value: '40+', label: '40+ hours' }
    ];
  }

  private getDateRangeOptions() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);

    return [
      { value: 'today', label: 'Today' },
      { value: 'yesterday', label: 'Yesterday' },
      { value: 'last7days', label: 'Last 7 days' },
      { value: 'last30days', label: 'Last 30 days' },
      { value: 'older', label: 'Older than 30 days' }
    ];
  }
}