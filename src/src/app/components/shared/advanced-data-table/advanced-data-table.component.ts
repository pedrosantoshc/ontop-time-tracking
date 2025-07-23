import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material imports
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  type?: 'text' | 'number' | 'date' | 'status' | 'actions' | 'custom';
  width?: string;
  sticky?: boolean;
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string;
  statusOptions?: { value: any; label: string; class: string }[];
  filterOptions?: { value: any; label: string }[];
  filterType?: 'text' | 'select'; // Override filter type regardless of column type
}

export interface TableConfig {
  showPagination?: boolean;
  showSelection?: boolean;
  showFilters?: boolean;
  showExport?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  dense?: boolean;
  stickyHeader?: boolean;
}

export interface TableAction {
  icon: string;
  label: string;
  handler: (row: any) => void;
  color?: string;
  disabled?: (row: any) => boolean;
  tooltip?: string;
}

@Component({
  selector: 'app-advanced-data-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatTooltipModule
  ],
  templateUrl: './advanced-data-table.component.html',
  styleUrls: ['./advanced-data-table.component.scss']
})
export class AdvancedDataTableComponent implements OnInit, OnChanges {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() config: TableConfig = {};
  @Input() actions: TableAction[] = [];
  @Input() loading = false;
  @Input() emptyMessage = 'No data available';
  @Input() loadingMessage = 'Loading...';

  @Output() rowClick = new EventEmitter<any>();
  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() export = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = [];
  selectedRows = new Set<any>();
  columnFilters: { [key: string]: any } = {};

  // Default config values
  defaultConfig: TableConfig = {
    showPagination: true,
    showSelection: false,
    showFilters: true,
    showExport: true,
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50],
    dense: false,
    stickyHeader: true
  };

  ngOnInit() {
    this.config = { ...this.defaultConfig, ...this.config };
    this.setupColumns();
    this.setupDataSource();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && this.dataSource) {
      this.dataSource.data = this.data;
      this.selectedRows.clear();
      this.emitSelectionChange();
    }
    if (changes['columns']) {
      this.setupColumns();
    }
  }

  ngAfterViewInit() {
    if (this.config.showPagination) {
      this.dataSource.paginator = this.paginator;
    }
    this.dataSource.sort = this.sort;

    // Custom filter predicate for column-specific filtering
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      if (!filter) return true;
      
      const filters = JSON.parse(filter);
      return Object.keys(filters).every(key => {
        if (!filters[key]) return true;
        
        const column = this.columns.find(col => col.key === key);
        const dataValue = this.getNestedValue(data, key);
        const filterValue = filters[key].toString().toLowerCase();
        
        switch (column?.type) {
          case 'number':
            return dataValue.toString().includes(filterValue);
          case 'date':
            return this.formatDate(dataValue).toLowerCase().includes(filterValue);
          case 'status':
            return dataValue.toString().toLowerCase().includes(filterValue);
          default:
            return dataValue.toString().toLowerCase().includes(filterValue);
        }
      });
    };
  }

  private setupColumns() {
    this.displayedColumns = [];
    
    if (this.config.showSelection) {
      this.displayedColumns.push('select');
    }
    
    this.displayedColumns.push(...this.columns.map(col => col.key));
    
    if (this.actions.length > 0) {
      this.displayedColumns.push('actions');
    }
  }

  private setupDataSource() {
    this.dataSource = new MatTableDataSource(this.data);
    
    // Setup custom sort accessor for nested properties
    this.dataSource.sortingDataAccessor = (data: any, sortHeaderId: string) => {
      return this.getNestedValue(data, sortHeaderId);
    };
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj) || '';
  }

  // Selection methods
  isAllSelected(): boolean {
    const numSelected = this.selectedRows.size;
    const numRows = this.dataSource.filteredData.length;
    return numSelected === numRows && numRows > 0;
  }

  isIndeterminate(): boolean {
    const numSelected = this.selectedRows.size;
    const numRows = this.dataSource.filteredData.length;
    return numSelected > 0 && numSelected < numRows;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selectedRows.clear();
    } else {
      this.dataSource.filteredData.forEach(row => this.selectedRows.add(row));
    }
    this.emitSelectionChange();
  }

  toggleRow(row: any): void {
    if (this.selectedRows.has(row)) {
      this.selectedRows.delete(row);
    } else {
      this.selectedRows.add(row);
    }
    this.emitSelectionChange();
  }

  isSelected(row: any): boolean {
    return this.selectedRows.has(row);
  }

  private emitSelectionChange(): void {
    this.selectionChange.emit(Array.from(this.selectedRows));
  }

  // Filtering methods
  applyColumnFilter(columnKey: string, value: string): void {
    this.columnFilters[columnKey] = value;
    this.applyFilters();
  }

  clearColumnFilter(columnKey: string): void {
    delete this.columnFilters[columnKey];
    this.applyFilters();
  }

  clearAllFilters(): void {
    this.columnFilters = {};
    this.applyFilters();
  }

  private applyFilters(): void {
    const filterValue = JSON.stringify(this.columnFilters);
    this.dataSource.filter = filterValue;
  }

  // Utility methods
  getCellValue(row: any, column: TableColumn): any {
    const value = this.getNestedValue(row, column.key);
    return column.format ? column.format(value) : value;
  }

  getStatusClass(value: any, column: TableColumn): string {
    if (column.type === 'status' && column.statusOptions) {
      const status = column.statusOptions.find(opt => opt.value === value);
      return status?.class || 'bg-gray-100 text-gray-800';
    }
    return '';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  }

  formatNumber(value: number): string {
    return Number(value).toLocaleString();
  }

  // Event handlers
  onRowClick(row: any): void {
    this.rowClick.emit(row);
  }

  onExport(): void {
    this.export.emit();
  }

  onRefresh(): void {
    this.refresh.emit();
  }

  // Helper methods for template
  hasActiveFilters(): boolean {
    return Object.keys(this.columnFilters).some(key => this.columnFilters[key]);
  }

  getActiveFilterCount(): number {
    return Object.keys(this.columnFilters).filter(key => this.columnFilters[key]).length;
  }

  // Custom display helpers
  getWorkerInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }
}