import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

// Angular Material imports
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';

interface NavigationItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
  disabled?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatRippleModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  @Input() collapsed = false;
  @Input() currentRoute = '';
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() navigateToRoute = new EventEmitter<string>();

  currentPath = '';

  navigationItems: NavigationItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/client/dashboard'
    },
    {
      label: 'Reports',
      icon: 'assessment',
      route: '/client/reports'
    },
    {
      label: 'Workers',
      icon: 'people',
      route: '/client/settings',
      badge: 0 // Will be updated dynamically
    },
    {
      label: 'Approvals',
      icon: 'pending_actions',
      route: '/client/approvals',
      badge: 0 // Will be updated with pending count
    }
  ];

  bottomNavigationItems: NavigationItem[] = [
    {
      label: 'Settings',
      icon: 'settings',
      route: '/client/settings'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    // Track current route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentPath = event.url;
      });

    // Set initial current path
    this.currentPath = this.router.url;
  }

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  onNavigate(route: string) {
    if (route === '#') return; // Handle special routes

    this.router.navigate([route]);
    this.navigateToRoute.emit(route);
  }

  isActive(route: string): boolean {
    if (route === '/client/dashboard') {
      return this.currentPath === route || this.currentPath === '/';
    }
    return this.currentPath.startsWith(route);
  }

  updatePendingBadge(count: number) {
    const approvalsItem = this.navigationItems.find(item => item.icon === 'pending_actions');
    if (approvalsItem) {
      approvalsItem.badge = count;
    }
  }

  updateWorkersBadge(count: number) {
    const workersItem = this.navigationItems.find(item => item.icon === 'people');
    if (workersItem) {
      workersItem.badge = count;
    }
  }
}