import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FieldType, FieldTypeConfig, FormlyModule } from '@ngx-formly/core';
import { CustomSelectComponent } from '../custom-select/custom-select';

@Component({
  selector: 'formly-field-custom-select',
  templateUrl: './custom-select-type.html',
  styleUrl: './custom-select-type.scss',
  imports: [CommonModule, ReactiveFormsModule, CustomSelectComponent, FormlyModule],
})
export class FormlyFieldCustomSelect extends FieldType<FieldTypeConfig> {
  get selectOptions(): any[] {
    return Array.isArray(this.props?.options) ? this.props.options : [];
  }
}
