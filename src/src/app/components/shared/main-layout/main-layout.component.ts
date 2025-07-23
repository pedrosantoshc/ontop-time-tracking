import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { SidebarComponent } from '../sidebar/sidebar.component';
import { EnhancedHeaderComponent, HeaderAction } from '../enhanced-header/enhanced-header.component';

// Angular Material imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    EnhancedHeaderComponent,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit {
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  
  sidebarCollapsed = false;
  isMobile = false;
  currentRoute = '';
  
  // Page-specific content padding and layout
  pageConfig = {
    showTopBar: true,
    contentPadding: 'normal', // 'none', 'compact', 'normal', 'wide'
    maxWidth: 'full' // 'sm', 'md', 'lg', 'xl', 'full'
  };

  // Enhanced Header Configuration
  headerActions: HeaderAction[] = [];
  pageTitle = 'Dashboard';
  pageSubtitle = 'Monitor worker hours and manage approvals';

  constructor(private router: Router) {}

  ngOnInit() {
    // Check initial screen size
    this.checkScreenSize();
    
    // Auto-collapse sidebar on mobile
    if (this.isMobile) {
      this.sidebarCollapsed = true;
    }

    // Track route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
        this.updatePageConfig();
        
        // Auto-collapse sidebar on mobile after navigation
        if (this.isMobile) {
          this.sidebarCollapsed = true;
        }
      });

    // Set initial route
    this.currentRoute = this.router.url;
    this.updatePageConfig();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
    
    // Force collapse on mobile, allow expansion on desktop
    if (this.isMobile && !this.sidebarCollapsed) {
      this.sidebarCollapsed = true;
    }
  }

  private updatePageConfig() {
    // Customize layout and header based on current route
    switch (this.currentRoute) {
      case '/client/dashboard':
      case '/':
        this.pageConfig = {
          showTopBar: true,
          contentPadding: 'normal',
          maxWidth: 'full'
        };
        this.pageTitle = 'Time Tracking Dashboard';
        this.pageSubtitle = 'Monitor worker hours and manage approvals';
        this.headerActions = [
          {
            id: 'export',
            label: 'Export Report',
            icon: 'download',
            tooltip: 'Export time tracking data',
            handler: () => this.onHeaderAction('export')
          },
          {
            id: 'refresh',
            label: 'Refresh',
            icon: 'refresh',
            tooltip: 'Refresh dashboard data',
            handler: () => this.onHeaderAction('refresh')
          },
          {
            id: 'notifications',
            label: 'Notifications',
            icon: 'notifications',
            tooltip: 'View notifications',
            badge: 3,
            handler: () => this.onHeaderAction('notifications')
          }
        ];
        break;
      
      case '/client/reports':
        this.pageConfig = {
          showTopBar: true,
          contentPadding: 'normal', 
          maxWidth: 'full'
        };
        this.pageTitle = 'Time Reports';
        this.pageSubtitle = 'Detailed analytics and reporting';
        this.headerActions = [
          {
            id: 'export',
            label: 'Export Report',
            icon: 'download',
            tooltip: 'Export report data',
            handler: () => this.onHeaderAction('export')
          },
          {
            id: 'print',
            label: 'Print',
            icon: 'print',
            tooltip: 'Print current report',
            handler: () => this.onHeaderAction('print')
          }
        ];
        break;
      
      case '/client/settings':
        this.pageConfig = {
          showTopBar: true,
          contentPadding: 'compact',
          maxWidth: 'lg'
        };
        this.pageTitle = 'Settings & Configuration';
        this.pageSubtitle = 'Manage workers and system preferences';
        this.headerActions = [
          {
            id: 'import',
            label: 'Import Workers',
            icon: 'upload',
            tooltip: 'Import worker data from spreadsheet',
            handler: () => this.onHeaderAction('import')
          },
          {
            id: 'export',
            label: 'Export Settings',
            icon: 'download',
            tooltip: 'Export configuration',
            handler: () => this.onHeaderAction('export')
          }
        ];
        break;
      
      default:
        this.pageConfig = {
          showTopBar: true,
          contentPadding: 'normal',
          maxWidth: 'full'
        };
        this.pageTitle = 'Time Tracking';
        this.pageSubtitle = 'Worker time management system';
        this.headerActions = [];
    }
  }

  onToggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onNavigateToRoute(route: string) {
    // Handle special navigation events
    if (route === 'approvals') {
      // Emit event for dashboard to show approvals panel
      // This will be handled by the parent component
      return;
    }
    
    // Normal navigation is handled by the sidebar component
  }

  getContentClass(): string {
    const classes = ['main-layout__content'];
    
    // Add padding class
    classes.push(`main-layout__content--${this.pageConfig.contentPadding}`);
    
    // Add max-width class
    if (this.pageConfig.maxWidth !== 'full') {
      classes.push(`main-layout__content--${this.pageConfig.maxWidth}`);
    }
    
    // Add sidebar state class
    if (this.sidebarCollapsed) {
      classes.push('main-layout__content--sidebar-collapsed');
    }
    
    return classes.join(' ');
  }

  getMainClass(): string {
    const classes = ['main-layout'];
    
    if (this.isMobile) {
      classes.push('main-layout--mobile');
    }
    
    return classes.join(' ');
  }

  // Header Event Handlers
  onHeaderAction(actionId: string) {
    switch (actionId) {
      case 'export':
        // Emit event or handle export functionality
        console.log('Export action triggered');
        break;
      case 'refresh':
        // Refresh current page data
        window.location.reload();
        break;
      case 'notifications':
        // Show notifications panel
        console.log('Notifications action triggered');
        break;
      case 'print':
        // Print current page
        window.print();
        break;
      case 'import':
        // Handle import functionality
        console.log('Import action triggered');
        break;
      default:
        console.log(`Unknown header action: ${actionId}`);
    }
  }

}