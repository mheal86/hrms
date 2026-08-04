import { Component } from '@angular/core';
import { FieldType, FieldTypeConfig, FormlyModule } from '@ngx-formly/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { CustomSelectComponent } from './custom-select';

//bọc component <app-custom-select>
@Component({
  selector: 'formly-field-custom-select',
  template: `
    <app-custom-select
      [formControl]="formControl"
      [formlyAttributes]="field"
      [options]="$any(props['options'] || [])"
      [placeholder]="props.placeholder || ''"
      [isInvalid]="showError"
    ></app-custom-select>
  `,
  imports: [CommonModule, ReactiveFormsModule, CustomSelectComponent, FormlyModule],
})
export class FormlyFieldCustomSelect extends FieldType<FieldTypeConfig> {}
