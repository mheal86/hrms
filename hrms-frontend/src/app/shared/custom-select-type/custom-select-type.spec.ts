import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormlyFieldCustomSelect } from './custom-select-type';
import { UntypedFormControl, ReactiveFormsModule } from '@angular/forms';
import { FormlyModule, FieldTypeConfig } from '@ngx-formly/core';
import { By } from '@angular/platform-browser';
import { provideTranslateService } from '@ngx-translate/core';

describe('FormlyFieldCustomSelect', () => {
  let component: FormlyFieldCustomSelect;
  let fixture: ComponentFixture<FormlyFieldCustomSelect>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormlyFieldCustomSelect,
        ReactiveFormsModule,
        FormlyModule.forRoot(),
      ],
      providers: [
        provideTranslateService(),
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(FormlyFieldCustomSelect);
    component = fixture.componentInstance;

    component.field = {
      props: {},
      options: {
        showError: () => false,
      },
      formControl: new UntypedFormControl(),
    } as Partial<FieldTypeConfig> & FieldTypeConfig;

    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should render app-custom-select element in template and pass configs', () => {
    component.field.props = {
      placeholder: 'Select department',
      options: [{ label: 'Tech', value: 'tech-1' }]
    };
    fixture.detectChanges();

    const customSelect = fixture.debugElement.query(By.css('app-custom-select'));
    expect(customSelect).not.toBeNull();
    expect(customSelect.componentInstance.placeholder).toBe('Select department');
    expect(customSelect.componentInstance.options).toEqual([{ label: 'Tech', value: 'tech-1' }]);
  });

  it('should return options array if options is an array', () => {
    const mockOptions = [{ label: 'Option 1', value: '1' }];
    component.field.props = { options: mockOptions };
    fixture.detectChanges();

    expect(component.selectOptions).toEqual(mockOptions);
  });

  it('should return empty array when options is undefined', () => {
    component.field.props = { options: undefined };
    fixture.detectChanges();
    expect(component.selectOptions).toEqual([]);
  });

  it('should return empty array when options is null', () => {
    component.field.props = { options: null as unknown as unknown[] };
    fixture.detectChanges();
    expect(component.selectOptions).toEqual([]);
  });
});
