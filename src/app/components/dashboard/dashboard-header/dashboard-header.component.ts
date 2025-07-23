import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../shared/button/button.component';

// Angular Material imports
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.scss']
})
export class DashboardHeaderComponent {
  @Input() title = 'Time Tracking Dashboard';
  @Input() subtitle = 'Monitor worker hours and manage approvals';
  @Input() isExporting = false;

  @Output() exportClick = new EventEmitter<void>();
  @Output() resetClick = new EventEmitter<void>();

  constructor(private router: Router) {}

  onExportClick() {
    this.exportClick.emit();
  }

  onResetClick() {
    this.resetClick.emit();
  }

  goToReports() {
    this.router.navigate(['/client/reports']);
  }
}