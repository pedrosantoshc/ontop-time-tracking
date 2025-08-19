import { Routes } from '@angular/router';
import { ClientSetupComponent } from './components/client-setup/client-setup.component';
import { ClientSettingsComponent } from './components/client-settings/client-settings.component';
import { WorkerTrackingComponent } from './components/worker-tracking/worker-tracking.component';
import { WorkerDashboardComponent } from './components/worker-dashboard/worker-dashboard.component';
import { ClientDashboardComponent } from './components/client-dashboard/client-dashboard.component';
import { ClientReportsComponent } from './components/client-reports/client-reports.component';
import { ClientApprovalsComponent } from './components/client-approvals/client-approvals.component';

export const routes: Routes = [
  { path: '', redirectTo: '/client/setup', pathMatch: 'full' },
  { path: 'client/setup', component: ClientSetupComponent },
  { path: 'client/settings', component: ClientSettingsComponent },
  { path: 'client/dashboard', component: ClientDashboardComponent },
  { path: 'client/approvals', component: ClientApprovalsComponent },
  { path: 'client/reports', component: ClientReportsComponent },
  { path: 'worker/:inviteToken', component: WorkerTrackingComponent },
  { path: 'worker-dashboard/:token', component: WorkerDashboardComponent },
  { path: '**', redirectTo: '/client/setup' }
];
