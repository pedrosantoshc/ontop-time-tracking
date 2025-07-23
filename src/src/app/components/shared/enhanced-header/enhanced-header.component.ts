import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';

// Angular Material imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';

export interface BreadcrumbItem {
  label: string;
  route?: string;
  icon?: string;
  active?: boolean;
}

export interface HeaderAction {
  id: string;
  label: string;
  icon: string;
  tooltip?: string;
  badge?: number | string;
  color?: 'primary' | 'accent' | 'warn';
  disabled?: boolean;
  hidden?: boolean;
  handler?: () => void;
}


@Component({
  selector: 'app-enhanced-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDividerModule
  ],
  templateUrl: './enhanced-header.component.html',
  styleUrls: ['./enhanced-header.component.scss']
})
export class EnhancedHeaderComponent implements OnInit {
  @Input() title = 'Time Tracking Dashboard';
  @Input() subtitle = '';
  @Input() showBreadcrumbs = false; // Only for mobile now
  @Input() showActions = true;
  @Input() actions: HeaderAction[] = [];
  @Input() customBreadcrumbs: BreadcrumbItem[] = [];

  @Output() actionClick = new EventEmitter<string>();

  breadcrumbs: BreadcrumbItem[] = [];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    // Generate breadcrumbs for mobile use
    if (this.customBreadcrumbs.length > 0) {
      this.breadcrumbs = this.customBreadcrumbs;
    } else {
      this.generateBreadcrumbs();
      this.listenToRouteChanges();
    }
  }

  private listenToRouteChanges() {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => this.activatedRoute)
      )
      .subscribe(() => {
        this.generateBreadcrumbs();
      });
  }

  private generateBreadcrumbs() {
    const url = this.router.url;
    const segments = url.split('/').filter(segment => segment);
    
    this.breadcrumbs = [
      { label: 'Home', route: '/', icon: 'home' }
    ];

    // Generate breadcrumbs based on route segments
    let currentRoute = '';
    segments.forEach((segment, index) => {
      currentRoute += `/${segment}`;
      
      const breadcrumb: BreadcrumbItem = {
        label: this.formatSegmentLabel(segment),
        route: currentRoute,
        active: index === segments.length - 1
      };

      // Add icons for specific routes
      if (segment === 'client') {
        breadcrumb.icon = 'business';
      } else if (segment === 'dashboard') {
        breadcrumb.icon = 'dashboard';
      } else if (segment === 'reports') {
        breadcrumb.icon = 'assessment';
      } else if (segment === 'settings') {
        breadcrumb.icon = 'settings';
      } else if (segment === 'workers') {
        breadcrumb.icon = 'people';
      } else if (segment === 'approvals') {
        breadcrumb.icon = 'approval';
      }

      this.breadcrumbs.push(breadcrumb);
    });
  }

  private formatSegmentLabel(segment: string): string {
    // Convert route segments to readable labels
    const labelMap: { [key: string]: string } = {
      'client': 'Client Portal',
      'dashboard': 'Dashboard',
      'reports': 'Reports',
      'settings': 'Settings',
      'workers': 'Workers',
      'approvals': 'Approvals',
      'worker-tracking': 'Time Tracking'
    };

    return labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  }

  onBreadcrumbClick(breadcrumb: BreadcrumbItem) {
    if (breadcrumb.route && !breadcrumb.active) {
      this.router.navigate([breadcrumb.route]);
    }
  }

  onActionClick(action: HeaderAction) {
    if (!action.disabled && !action.hidden) {
      if (action.handler) {
        action.handler();
      }
      this.actionClick.emit(action.id);
    }
  }

  getVisibleActions(): HeaderAction[] {
    return this.actions.filter(action => !action.hidden);
  }
}