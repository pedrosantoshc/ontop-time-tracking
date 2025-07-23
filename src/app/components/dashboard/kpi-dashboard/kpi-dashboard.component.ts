import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { KpiCardComponent, KpiCardData } from '../../shared/kpi-card/kpi-card.component';

@Component({
  selector: 'app-kpi-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    KpiCardComponent
  ],
  templateUrl: './kpi-dashboard.component.html',
  styleUrls: ['./kpi-dashboard.component.scss']
})
export class KpiDashboardComponent {
  @Input() kpiCards: KpiCardData[] = [];
  @Input() loading = false;

  @Output() kpiCardClick = new EventEmitter<KpiCardData>();

  onKpiCardClick(cardData: KpiCardData) {
    this.kpiCardClick.emit(cardData);
  }
}