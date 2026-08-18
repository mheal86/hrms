import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormlyFieldDatePicker } from './custom-datepicker-type';
import { UntypedFormControl, ReactiveFormsModule } from '@angular/forms';
import { FormlyModule, FieldTypeConfig } from '@ngx-formly/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { By } from '@angular/platform-browser';
import { provideTranslateService } from '@ngx-translate/core';

describe('FormlyFieldDatePicker', () => {
  let component: FormlyFieldDatePicker;
  let fixture: ComponentFixture<FormlyFieldDatePicker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormlyFieldDatePicker,
        ReactiveFormsModule,
        FormlyModule.forRoot(),
      ],
      providers: [
        provideAnimationsAsync(),
        provideTranslateService(),
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormlyFieldDatePicker);
    component = fixture.componentInstance;
    component.field = {
      key: 'date',
      props: {
        placeholder: 'Select date',
      },
      formControl: new UntypedFormControl(),
      options: {
        showError: () => false
      }
    } as Partial<FieldTypeConfig> & FieldTypeConfig;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should render app-custom-datepicker and bind Formly properties correctly', () => {
    const customDatePicker = fixture.debugElement.query(By.css('app-custom-datepicker'));
    expect(customDatePicker).not.toBeNull();
    expect(customDatePicker.componentInstance.placeholder).toBe('Select date');
    expect(customDatePicker.componentInstance.isInvalid).toBe(false);
  });

  it('should update invalid status when Formly showError evaluates to true', () => {
    Object.defineProperty(component.field, 'options', {
      value: { showError: () => true },
      writable: true
    });
    fixture.detectChanges();

    const customDatePicker = fixture.debugElement.query(By.css('app-custom-datepicker'));
    expect(customDatePicker.componentInstance.isInvalid).toBe(true);
  });
});
