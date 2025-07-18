import { Routes } from '@angular/router';
import { ClientSetupComponent } from './components/client-setup/client-setup.component';

export const routes: Routes = [
  { path: '', redirectTo: '/client/setup', pathMatch: 'full' },
  { path: 'client/setup', component: ClientSetupComponent },
  { path: '**', redirectTo: '/client/setup' }
];
