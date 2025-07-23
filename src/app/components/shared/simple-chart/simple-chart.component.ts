import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  subtitle?: string;
}

export type ChartType = 'bar' | 'horizontal-bar' | 'donut' | 'line';

export interface ChartConfig {
  type: ChartType;
  title: string;
  subtitle?: string;
  showValues?: boolean;
  showPercentages?: boolean;
  height?: number;
  colors?: string[];
}

@Component({
  selector: 'app-simple-chart',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './simple-chart.component.html',
  styleUrls: ['./simple-chart.component.scss']
})
export class SimpleChartComponent implements OnInit, OnChanges {
  @Input() data: ChartDataPoint[] = [];
  @Input() config: ChartConfig = {
    type: 'bar',
    title: 'Chart',
    showValues: true,
    height: 300,
    colors: ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']
  };

  processedData: ChartDataPoint[] = [];
  maxValue = 0;
  totalValue = 0;

  ngOnInit() {
    this.processData();
  }

  ngOnChanges(changes: any) {
    console.log('SimpleChart ngOnChanges triggered:', changes);
    console.log('Current data:', this.data);
    console.log('Current config:', this.config);
    this.processData();
  }

  private processData() {
    console.log('Processing chart data:', this.data);
    
    if (!this.data || this.data.length === 0) {
      console.log('No data to process');
      this.processedData = [];
      return;
    }

    this.maxValue = Math.max(...this.data.map(d => d.value));
    this.totalValue = this.data.reduce((sum, d) => sum + d.value, 0);

    this.processedData = this.data.map((item, index) => ({
      ...item,
      color: item.color || this.config.colors?.[index % (this.config.colors?.length || 6)] || '#6366f1'
    }));

    console.log('Processed data:', {
      processedData: this.processedData,
      maxValue: this.maxValue,
      totalValue: this.totalValue,
      config: this.config
    });
  }

  getBarHeight(value: number): number {
    if (this.maxValue === 0) return 0;
    return (value / this.maxValue) * 100;
  }

  getBarWidth(value: number): number {
    if (this.maxValue === 0) return 0;
    return (value / this.maxValue) * 100;
  }

  getPercentage(value: number): number {
    if (this.totalValue === 0) return 0;
    return Math.round((value / this.totalValue) * 100);
  }

  getDonutCircumference(): number {
    return 2 * Math.PI * 45; // radius = 45
  }

  getDonutStrokeDasharray(value: number): string {
    const circumference = this.getDonutCircumference();
    const percentage = this.getPercentage(value);
    const strokeLength = (percentage / 100) * circumference;
    return `${strokeLength} ${circumference}`;
  }

  getDonutStrokeDashoffset(previousDataPoints: ChartDataPoint[]): number {
    const circumference = this.getDonutCircumference();
    const previousTotal = previousDataPoints.reduce((sum, point) => sum + point.value, 0);
    const previousPercentage = this.getPercentage(previousTotal);
    return -(previousPercentage / 100) * circumference;
  }

  formatValue(value: number): string {
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'k';
    }
    return value.toString();
  }
}