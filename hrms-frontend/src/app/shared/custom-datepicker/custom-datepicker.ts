import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';

@Component({
  selector: 'app-custom-datepicker',
  imports: [CommonModule, DatePicker, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomDatePickerComponent),
      multi: true,
    },
  ],
  templateUrl: './custom-datepicker.html',
  styleUrl: './custom-datepicker.scss',
})
export class CustomDatePickerComponent implements ControlValueAccessor {
  @Input() placeholder: string = '';
  @Input() isInvalid: boolean = false;

  val: Date | null = null;
  disabled: boolean = false;

  onChange: (val: Date | null) => void = () => { };
  onTouched: () => void = () => { };

  onModelChange(value: Date | null) {
    this.val = value;
    this.onChange(this.val);
  }

  onDateBlur() {
    this.onTouched();
  }

  writeValue(value: Date | null) {
    this.val = value;
  }

  registerOnChange(fn: (val: Date | null) => void) {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean) {
    this.disabled = isDisabled;
  }
}
