import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';

export interface FilterConfig {
  id: string;
  label: string;
  type: 'select' | 'dateRange' | 'multiSelect' | 'checkbox' | 'text';
  options?: FilterOption[];
  value?: any;
  placeholder?: string;
  icon?: string;
  required?: boolean;
  disabled?: boolean;
}

export interface FilterOption {
  value: any;
  label: string;
  disabled?: boolean;
}

export interface FilterChangeEvent {
  filterId: string;
  value: any;
  config: FilterConfig;
}

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatChipsModule,
    MatBadgeModule
  ],
  templateUrl: './filter-panel.component.html',
  styleUrls: ['./filter-panel.component.scss']
})
export class FilterPanelComponent implements OnInit {
  @Input() title = 'Filters';
  @Input() subtitle = 'Refine your data view';
  @Input() icon = 'filter_alt';
  @Input() collapsible = true;
  @Input() initiallyExpanded = true;
  @Input() showActiveCount = true;
  @Input() filterConfigs: FilterConfig[] = [];
  @Input() compact = false;
  
  @Output() filterChange = new EventEmitter<FilterChangeEvent>();
  @Output() filtersReset = new EventEmitter<void>();
  @Output() filtersApplied = new EventEmitter<FilterConfig[]>();

  isExpanded = true;
  activeFiltersCount = 0;

  ngOnInit() {
    this.isExpanded = this.initiallyExpanded;
    this.calculateActiveFilters();
  }

  ngOnChanges() {
    this.calculateActiveFilters();
  }

  calculateActiveFilters() {
    this.activeFiltersCount = this.filterConfigs.filter(config => {
      if (!config.value) return false;
      
      switch (config.type) {
        case 'select':
        case 'text':
          return config.value && config.value !== '';
        case 'multiSelect':
          return Array.isArray(config.value) && config.value.length > 0;
        case 'checkbox':
          return config.value === true;
        case 'dateRange':
          return config.value && (config.value.start || config.value.end);
        default:
          return false;
      }
    }).length;
  }

  onFilterChange(config: FilterConfig, newValue: any) {
    // Update the config value
    config.value = newValue;
    
    // Recalculate active filters
    this.calculateActiveFilters();
    
    // Emit the change event
    this.filterChange.emit({
      filterId: config.id,
      value: newValue,
      config: config
    });
  }

  onToggleExpanded() {
    if (this.collapsible) {
      this.isExpanded = !this.isExpanded;
    }
  }

  onResetFilters() {
    // Reset all filter values
    this.filterConfigs.forEach(config => {
      switch (config.type) {
        case 'multiSelect':
          config.value = [];
          break;
        case 'checkbox':
          config.value = false;
          break;
        case 'dateRange':
          config.value = { start: '', end: '' };
          break;
        default:
          config.value = '';
      }
    });

    // Recalculate active filters
    this.calculateActiveFilters();

    // Emit reset event
    this.filtersReset.emit();
  }

  onApplyFilters() {
    this.filtersApplied.emit([...this.filterConfigs]);
  }

  isMultiSelectValue(value: any): boolean {
    return Array.isArray(value);
  }

  getMultiSelectLabel(config: FilterConfig): string {
    if (!config.value || !Array.isArray(config.value) || config.value.length === 0) {
      return `Select ${config.label.toLowerCase()}`;
    }
    
    if (config.value.length === 1) {
      const option = config.options?.find(opt => opt.value === config.value[0]);
      return option?.label || config.value[0];
    }
    
    return `${config.value.length} selected`;
  }

  toggleMultiSelectOption(config: FilterConfig, optionValue: any) {
    if (!config.value) {
      config.value = [];
    }
    
    const currentValues = [...config.value];
    const index = currentValues.indexOf(optionValue);
    
    if (index > -1) {
      currentValues.splice(index, 1);
    } else {
      currentValues.push(optionValue);
    }
    
    this.onFilterChange(config, currentValues);
  }

  isOptionSelected(config: FilterConfig, optionValue: any): boolean {
    return Array.isArray(config.value) && config.value.includes(optionValue);
  }

  onDateRangeStartChange(config: FilterConfig, startValue: string) {
    const currentValue = config.value || {};
    const newValue = { ...currentValue, start: startValue };
    this.onFilterChange(config, newValue);
  }

  onDateRangeEndChange(config: FilterConfig, endValue: string) {
    const currentValue = config.value || {};
    const newValue = { ...currentValue, end: endValue };
    this.onFilterChange(config, newValue);
  }

  onSelectAllOptions(config: FilterConfig) {
    const allValues = config.options?.map(opt => opt.value) || [];
    this.onFilterChange(config, allValues);
  }
}