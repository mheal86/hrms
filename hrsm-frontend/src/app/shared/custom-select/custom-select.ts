import { Component, Input, forwardRef, signal, ElementRef, HostListener, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  label: string;
  value: any;
}

@Component({
  selector: 'app-custom-select',
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="custom-select-wrapper" [class.disabled]="disabled" [class.open]="isOpen()" [class.is-invalid]="isInvalid">
      <div class="custom-select-trigger" (click)="toggleOpen()" tabindex="0" (keydown.enter)="toggleOpen()" (keydown.space)="$event.preventDefault(); toggleOpen()">
        <span class="selected-text" [class.custom-placeholder]="!selectedLabel()">
          {{ selectedLabel() || placeholder }}
        </span>
        <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      <div class="custom-select-dropdown" *ngIf="isOpen()">
        <div 
          *ngFor="let option of options" 
          class="custom-option" 
          [class.selected]="option.value === val"
          (click)="selectOption(option)"
        >
          {{ option.label }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      position: relative;
    }

    .custom-select-wrapper {
      position: relative;
      width: 100%;
      user-select: none;
    }

    .custom-select-trigger {
      background-color: var(--input-bg);
      color: var(--input-text);
      border: 1px solid var(--input-border);
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      min-height: 42px;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .custom-select-trigger:hover {
      border-color: var(--border-strong);
    }

    .custom-select-trigger:focus-visible {
      border-color: var(--input-focus-border) !important;
      box-shadow: 0 0 0 4px var(--input-focus-ring) !important;
      outline: none !important;
    }

    .custom-select-wrapper.open .custom-select-trigger {
      border-color: var(--input-focus-border);
      box-shadow: 0 0 0 4px var(--input-focus-ring);
    }

    .custom-select-wrapper.is-invalid .custom-select-trigger {
      border-color: var(--input-error-border);
      background-color: var(--color-error-bg);
    }

    .custom-select-wrapper.disabled {
      pointer-events: none;
    }

    .custom-select-wrapper.disabled .custom-select-trigger {
      background-color: var(--input-disabled-bg) !important;
      border-color: var(--border-color) !important;
      cursor: not-allowed !important;
      background-image: none !important;
    }

    .custom-select-wrapper.disabled .selected-text {
      color: var(--input-disabled-text) !important;
    }

    .selected-text {
      font-size: 0.9rem;
    }

    .selected-text.custom-placeholder {
      color: var(--input-placeholder);
    }

    .chevron-icon {
      transition: transform 0.25s ease;
      color: var(--text-muted);
      flex-shrink: 0;
    }

    .custom-select-wrapper.open .chevron-icon {
      transform: rotate(180deg);
      color: var(--color-primary);
    }

    .custom-select-dropdown {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      right: 0;
      z-index: 1050;
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      box-shadow: var(--shadow-dropdown);
      max-height: 220px;
      overflow-y: auto;
      padding: 6px;
      animation: dropdownFade 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes dropdownFade {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .custom-option {
      padding: 9px 12px;
      border-radius: 6px;
      cursor: pointer;
      color: var(--text-main);
      font-size: 0.9rem;
      transition: background-color 0.15s ease, color 0.15s ease;
    }

    .custom-option:hover {
      background-color: var(--color-primary-subtle);
      color: var(--color-primary);
    }

    .custom-option.selected {
      background-color: var(--btn-primary-bg);
      color: var(--btn-primary-text);
      font-weight: 600;
    }
  `]
})
export class CustomSelectComponent implements ControlValueAccessor, OnChanges {
  @Input() options: SelectOption[] = [];
  @Input() placeholder: string = 'Chọn...';
  @Input() isInvalid: boolean = false;

  val: any = '';
  disabled: boolean = false;
  isOpen = signal(false);
  selectedLabel = signal('');

  private onChange: (val: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] && this.val) {
      this.updateSelectedLabel(this.val);
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.isOpen()) {
        this.isOpen.set(false);
        this.onTouched();
      }
    }
  }

  toggleOpen() {
    if (this.disabled) return;
    this.isOpen.update(o => !o);
    if (!this.isOpen()) {
      this.onTouched();
    }
  }

  selectOption(option: SelectOption) {
    this.val = option.value;
    this.selectedLabel.set(option.label);
    this.onChange(this.val);
    this.isOpen.set(false);
    this.onTouched();
  }

  writeValue(value: any): void {
    this.val = value;
    this.updateSelectedLabel(value);
  }

  private updateSelectedLabel(value: any): void {
    const match = this.options.find(o => o.value === value);
    this.selectedLabel.set(match ? match.label : '');
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
