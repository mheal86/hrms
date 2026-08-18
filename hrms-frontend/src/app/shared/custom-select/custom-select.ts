import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { SelectOption, SelectValue } from '../../core/models/select-option-model';

@Component({
  selector: 'app-custom-select',  
  imports: [CommonModule, Select, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true,
    },
  ],
  templateUrl: './custom-select.html',
  styleUrl: './custom-select.scss',
})

export class CustomSelectComponent implements ControlValueAccessor {
  @Input() options: SelectOption[] = [];
  @Input() placeholder: string = 'Chọn...';
  @Input() isInvalid: boolean = false;
  @Input() showClear: boolean = false;
  @Input() filter: boolean = false;

  val: SelectValue | null = null; // Giá trị hiện tại của select
  disabled: boolean = false; // Trạng thái bật/tắt của select (false = bật, true = tắt)

  onChange: (val: SelectValue | null) => void = () => {}; // Hàm callback khi giá trị thay đổi
  onTouched: () => void = () => {}; // Hàm callback khi select được chạm vào

  onSelectChange(event: { value: SelectValue | null }) {
    this.val = event.value;
    this.onChange(this.val);
  }

  onSelectBlur() {
    this.onTouched();
  }

  writeValue(value: SelectValue | null) {
    this.val = value;
  }

  registerOnChange(fn: (val: SelectValue | null) => void) {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean) {
    this.disabled = isDisabled;
  }
}
