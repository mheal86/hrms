import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FieldType, FieldTypeConfig, FormlyModule } from '@ngx-formly/core';
import { CustomDatePickerComponent } from '../custom-datepicker/custom-datepicker';

@Component({
  selector: 'formly-field-datepicker',
  templateUrl: './custom-datepicker-type.html',
  styleUrl: './custom-datepicker-type.scss',
  imports: [CommonModule, ReactiveFormsModule, CustomDatePickerComponent, FormlyModule],
})
export class FormlyFieldDatePicker extends FieldType<FieldTypeConfig> {}
