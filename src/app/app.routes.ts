import { Routes } from '@angular/router';
import { ClientSetupComponent } from './components/client-setup/client-setup.component';
import { WorkerTrackingComponent } from './components/worker-tracking/worker-tracking.component';
import { ClientDashboardComponent } from './components/client-dashboard/client-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: '/client/setup', pathMatch: 'full' },
  { path: 'client/setup', component: ClientSetupComponent },
  { path: 'client/dashboard', component: ClientDashboardComponent },
  { path: 'worker/:inviteToken', component: WorkerTrackingComponent },
  { path: '**', redirectTo: '/client/setup' }
];
