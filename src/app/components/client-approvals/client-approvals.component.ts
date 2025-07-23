import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainLayoutComponent } from '../shared/main-layout/main-layout.component';
import { PendingApprovalsComponent } from '../pending-approvals/pending-approvals.component';

@Component({
  selector: 'app-client-approvals',
  standalone: true,
  imports: [
    CommonModule,
    MainLayoutComponent,
    PendingApprovalsComponent
  ],
  templateUrl: './client-approvals.component.html',
  styleUrls: ['./client-approvals.component.scss']
})
export class ClientApprovalsComponent implements OnInit {
  
  constructor() {}

  ngOnInit(): void {
    // Component initialization
  }
}