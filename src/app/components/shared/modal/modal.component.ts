import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material imports
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ButtonComponent } from '../button/button.component';

export type ModalSize = 'small' | 'medium' | 'large' | 'fullscreen';
export type ModalType = 'default' | 'confirmation' | 'alert' | 'form';

export interface ModalButton {
  label: string;
  action: string;
  variant?: 'primary' | 'secondary' | 'warn' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
}

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ButtonComponent
  ],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit, OnDestroy {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() size: ModalSize = 'medium';
  @Input() type: ModalType = 'default';
  @Input() showCloseButton = true;
  @Input() closeOnBackdropClick = true;
  @Input() closeOnEscape = true;
  @Input() loading = false;
  @Input() loadingMessage = 'Loading...';
  @Input() buttons: ModalButton[] = [];
  @Input() showFooter = true;

  @Output() close = new EventEmitter<void>();
  @Output() buttonClick = new EventEmitter<string>();
  @Output() backdropClick = new EventEmitter<void>();

  isVisible = false;

  constructor(
    private dialogRef?: MatDialogRef<ModalComponent>
  ) {}

  ngOnInit() {
    // Show modal with animation
    setTimeout(() => {
      this.isVisible = true;
    }, 10);

    // Set default buttons based on type
    if (this.buttons.length === 0) {
      this.setDefaultButtons();
    }
  }

  ngOnDestroy() {
    // Component cleanup
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    if (this.closeOnEscape && !this.loading) {
      this.onClose();
    }
  }

  onClose() {
    if (!this.loading) {
      this.isVisible = false;
      // Wait for animation to complete
      setTimeout(() => {
        this.close.emit();
        if (this.dialogRef) {
          this.dialogRef.close();
        }
      }, 200);
    }
  }

  onBackdropClick() {
    this.backdropClick.emit();
    if (this.closeOnBackdropClick && !this.loading) {
      this.onClose();
    }
  }

  onButtonClick(action: string) {
    if (!this.loading) {
      this.buttonClick.emit(action);
    }
  }

  private setDefaultButtons() {
    switch (this.type) {
      case 'confirmation':
        this.buttons = [
          { label: 'Cancel', action: 'cancel', variant: 'secondary' },
          { label: 'Confirm', action: 'confirm', variant: 'primary' }
        ];
        break;
      case 'alert':
        this.buttons = [
          { label: 'OK', action: 'ok', variant: 'primary' }
        ];
        break;
      case 'form':
        this.buttons = [
          { label: 'Cancel', action: 'cancel', variant: 'secondary' },
          { label: 'Save', action: 'save', variant: 'primary' }
        ];
        break;
      default:
        this.buttons = [
          { label: 'Close', action: 'close', variant: 'primary' }
        ];
    }
  }

  getModalClass(): string {
    const classes = ['app-modal'];
    
    classes.push(`app-modal--${this.size}`);
    classes.push(`app-modal--${this.type}`);
    
    if (this.isVisible) {
      classes.push('app-modal--visible');
    }
    
    if (this.loading) {
      classes.push('app-modal--loading');
    }
    
    return classes.join(' ');
  }

  getContainerClass(): string {
    const classes = ['app-modal__container'];
    
    classes.push(`app-modal__container--${this.size}`);
    
    if (this.isVisible) {
      classes.push('app-modal__container--visible');
    }
    
    return classes.join(' ');
  }

  // Helper methods for button management
  getButtonById(buttonId: string): ModalButton | undefined {
    return this.buttons.find(button => button.action === buttonId);
  }

  updateButtonLoading(buttonId: string, loading: boolean) {
    const button = this.getButtonById(buttonId);
    if (button) {
      button.loading = loading;
    }
  }

  updateButtonDisabled(buttonId: string, disabled: boolean) {
    const button = this.getButtonById(buttonId);
    if (button) {
      button.disabled = disabled;
    }
  }
}