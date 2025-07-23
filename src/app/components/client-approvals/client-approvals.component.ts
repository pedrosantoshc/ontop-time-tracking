import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MainLayoutComponent } from '../shared/main-layout/main-layout.component';
import { PendingApprovalsComponent } from '../pending-approvals/pending-approvals.component';
import { ButtonComponent } from '../shared/button/button.component';

// Material imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-client-approvals',
  standalone: true,
  imports: [
    CommonModule,
    MainLayoutComponent,
    PendingApprovalsComponent,
    ButtonComponent,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './client-approvals.component.html',
  styleUrls: ['./client-approvals.component.scss']
})
export class ClientApprovalsComponent implements OnInit {
  
  constructor(private router: Router) {}

  ngOnInit(): void {
    // Component initialization
  }

  goToDashboard(): void {
    this.router.navigate(['/client/dashboard']);
  }

  goToReports(): void {
    this.router.navigate(['/client/reports']);
  }
}