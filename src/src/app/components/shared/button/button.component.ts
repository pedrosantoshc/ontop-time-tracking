import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material imports
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'warn' | 'success' | 'ghost' | 'link';
export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent implements OnInit {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'medium';
  @Input() type: ButtonType = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;
  @Input() icon = '';
  @Input() iconPosition: 'left' | 'right' = 'left';
  @Input() tooltip = '';
  @Input() ariaLabel = '';

  @Output() click = new EventEmitter<MouseEvent>();

  ngOnInit() {
    // Component initialization if needed
  }

  onButtonClick(event: MouseEvent) {
    if (!this.disabled && !this.loading) {
      this.click.emit(event);
    }
  }

  getButtonClass(): string {
    const classes = ['app-button'];
    
    // Only add variant class for custom variants (ghost, link)
    // Let Material Design handle primary, secondary, accent, warn, success
    if (this.variant === 'ghost' || this.variant === 'link') {
      classes.push(`app-button--${this.variant}`);
    }
    
    // Add size class
    classes.push(`app-button--${this.size}`);
    
    // Add state classes
    if (this.disabled) {
      classes.push('app-button--disabled');
    }
    
    if (this.loading) {
      classes.push('app-button--loading');
    }
    
    if (this.fullWidth) {
      classes.push('app-button--full-width');
    }
    
    // Add icon classes
    if (this.icon) {
      classes.push('app-button--with-icon');
      classes.push(`app-button--icon-${this.iconPosition}`);
    }
    
    return classes.join(' ');
  }

  getMaterialButtonType(): string {
    switch (this.variant) {
      case 'primary':
        return 'mat-raised-button';
      case 'secondary':
        return 'mat-stroked-button';
      case 'accent':
        return 'mat-raised-button';
      case 'warn':
        return 'mat-raised-button';
      case 'success':
        return 'mat-raised-button';
      case 'ghost':
        return 'mat-button';
      case 'link':
        return 'mat-button';
      default:
        return 'mat-raised-button';
    }
  }

  getMaterialColor(): string {
    switch (this.variant) {
      case 'primary':
        return 'primary';
      case 'accent':
        return 'accent';
      case 'warn':
        return 'warn';
      default:
        return '';
    }
  }
}