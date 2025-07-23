import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

export interface KpiCardData {
  title: string;
  value: number | string;
  icon: string;
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    period: string;
  };
  loading?: boolean;
  clickable?: boolean;
  subtitle?: string;
}

export interface KpiCardConfig {
  size: 'compact' | 'standard' | 'large';
  density: 'comfortable' | 'compact';
}

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatRippleModule
  ],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KpiCardComponent {
  @Input() data!: KpiCardData;
  @Input() config: KpiCardConfig = {
    size: 'compact',
    density: 'compact'
  };

  @Output() cardClick = new EventEmitter<KpiCardData>();

  onCardClick(): void {
    if (this.data.clickable && !this.data.loading) {
      this.cardClick.emit(this.data);
    }
  }

  getVariantClass(): string {
    return `kpi-card--${this.data.variant}`;
  }

  getSizeClass(): string {
    return `kpi-card--${this.config.size}`;
  }

  getDensityClass(): string {
    return `kpi-card--${this.config.density}`;
  }

  getTrendIcon(): string {
    if (!this.data.trend) return '';
    
    switch (this.data.trend.direction) {
      case 'up': return 'trending_up';
      case 'down': return 'trending_down';
      case 'neutral': return 'trending_flat';
      default: return '';
    }
  }

  getTrendClass(): string {
    if (!this.data.trend) return '';
    
    switch (this.data.trend.direction) {
      case 'up': return 'trend--positive';
      case 'down': return 'trend--negative';
      case 'neutral': return 'trend--neutral';
      default: return '';
    }
  }

  formatValue(): string {
    if (this.data.loading) return '...';
    
    if (typeof this.data.value === 'number') {
      // Format large numbers with commas
      return this.data.value.toLocaleString();
    }
    
    return this.data.value.toString();
  }

  formatTrendValue(): string {
    if (!this.data.trend) return '';
    
    const sign = this.data.trend.direction === 'up' ? '+' : 
                 this.data.trend.direction === 'down' ? '-' : '';
    return `${sign}${Math.abs(this.data.trend.value)}%`;
  }
}