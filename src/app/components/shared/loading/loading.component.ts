import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material imports
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';

export type LoadingType = 'spinner' | 'bar' | 'dots' | 'skeleton';
export type LoadingSize = 'small' | 'medium' | 'large';
export type LoadingVariant = 'primary' | 'secondary' | 'accent';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatIconModule
  ],
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss']
})
export class LoadingComponent {
  @Input() type: LoadingType = 'spinner';
  @Input() size: LoadingSize = 'medium';
  @Input() variant: LoadingVariant = 'primary';
  @Input() message = '';
  @Input() overlay = false;
  @Input() fullscreen = false;
  @Input() progress?: number; // 0-100 for progress bar
  @Input() indeterminate = true;

  getLoadingClass(): string {
    const classes = ['app-loading'];
    
    classes.push(`app-loading--${this.type}`);
    classes.push(`app-loading--${this.size}`);
    classes.push(`app-loading--${this.variant}`);
    
    if (this.overlay) {
      classes.push('app-loading--overlay');
    }
    
    if (this.fullscreen) {
      classes.push('app-loading--fullscreen');
    }
    
    return classes.join(' ');
  }

  getContainerClass(): string {
    const classes = ['app-loading__container'];
    
    if (this.message) {
      classes.push('app-loading__container--with-message');
    }
    
    return classes.join(' ');
  }

  getSpinnerDiameter(): number {
    switch (this.size) {
      case 'small':
        return 24;
      case 'medium':
        return 40;
      case 'large':
        return 60;
      default:
        return 40;
    }
  }

  getSpinnerStrokeWidth(): number {
    switch (this.size) {
      case 'small':
        return 3;
      case 'medium':
        return 4;
      case 'large':
        return 5;
      default:
        return 4;
    }
  }

  hasSkeletonContent(): boolean {
    // This would check if there's skeleton content projected
    // For now, we'll return false to show default skeleton
    return false;
  }
}