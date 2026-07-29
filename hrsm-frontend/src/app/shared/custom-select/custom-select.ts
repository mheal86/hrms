import { Component, Input, forwardRef, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';

export interface SelectOption {
  label: string;
  value: string | number | boolean | undefined;
}

@Component({
  selector: 'app-custom-select',
  imports: [CommonModule, Select, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true
    }
  ],
  templateUrl: './custom-select.html',
  styleUrl: './custom-select.css'
})
export class CustomSelectComponent implements ControlValueAccessor {
  @Input() options: SelectOption[] = [];// Danh sách các lựa chọn được truyền vào
  @Input() placeholder: string = 'Chọn...'; // Chữ mờ hiển thị khi chưa chọn gì
  @Input() isInvalid: boolean = false; // Biến xác định select này đang bị lỗi để hiện viền đỏ

  val: string | number | boolean | undefined | null = null; // Giá trị hiện tại của select (có thể là string, number, boolean, undefined hoặc null)
  disabled: boolean = false; // Trạng thái bật/tắt của select (false = bật, true = tắt)

  private onChange: (val: string | number | boolean | undefined | null) => void = () => { }; // Hàm callback khi giá trị thay đổi
  private onTouched: () => void = () => { }; // Hàm callback khi select được chạm vào

  constructor(private elementRef: ElementRef) { }

  onSelectChange(event: any) {
    this.val = event.value;
    this.onChange(this.val);
  }

  onSelectBlur() {
    this.onTouched();
  }

  writeValue(value: string | number | boolean | undefined | null) {
    this.val = value;
  }

  registerOnChange(fn: (val: string | number | boolean | undefined | null) => void) {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean) {
    this.disabled = isDisabled;
  }
}
