import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomDatePickerComponent } from './custom-datepicker';
import { By } from '@angular/platform-browser';
import { provideTranslateService } from '@ngx-translate/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

describe('CustomDatePickerComponent', () => {
  let component: CustomDatePickerComponent;
  let fixture: ComponentFixture<CustomDatePickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomDatePickerComponent],
      providers: [
        provideTranslateService(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomDatePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should render p-datepicker element in template with inputs', () => {
    component.placeholder = 'Select birthday';
    component.isInvalid = true;
    fixture.detectChanges();

    const datepicker = fixture.debugElement.query(By.css('p-datepicker'));
    expect(datepicker).not.toBeNull();

    const dpInstance = datepicker.componentInstance;
    const placeholderVal = typeof dpInstance.placeholder === 'function' ? dpInstance.placeholder() : dpInstance.placeholder;
    const invalidVal = typeof dpInstance.invalid === 'function' ? dpInstance.invalid() : dpInstance.invalid;

    expect(placeholderVal).toBe('Select birthday');
    expect(invalidVal).toBe(true);
  });

  it('should write value and update component state', () => {
    const testDate = new Date();
    component.writeValue(testDate);
    fixture.detectChanges();

    expect(component.val).toBe(testDate);
  });

  it('should register onChange callback and call it on model change', () => {
    const callback = jasmine.createSpy('onChange');
    component.registerOnChange(callback);

    const testDate = new Date();
    component.onModelChange(testDate);
    fixture.detectChanges();

    expect(component.val).toBe(testDate);
    expect(callback).toHaveBeenCalledWith(testDate);
  });

  it('should register onTouched callback and call it on blur', () => {
    const callback = jasmine.createSpy('onTouched');
    component.registerOnTouched(callback);

    component.onDateBlur();
    fixture.detectChanges();

    expect(callback).toHaveBeenCalled();
  });

  it('should set disabled state and update p-datepicker component binding', () => {
    expect(component.disabled).toBe(false);
    
    component.setDisabledState?.(true);
    fixture.detectChanges();

    expect(component.disabled).toBe(true);
    const datepicker = fixture.debugElement.query(By.css('p-datepicker'));
    const dpInstance = datepicker.componentInstance;
    const disabledVal = typeof dpInstance.disabled === 'function' ? dpInstance.disabled() : dpInstance.disabled;
    expect(disabledVal).toBe(true);
  });

  it('should resolve NG_VALUE_ACCESSOR provider', () => {
    const accessors = fixture.debugElement.injector.get(NG_VALUE_ACCESSOR);
    expect(accessors).toBeDefined();
    expect(Array.isArray(accessors)).toBe(true);
    expect(accessors[0]).toBe(component);
  });

  it('should have default noop onChange callback', () => {
    const callback = component.onChange;
    expect(() => callback(null)).not.toThrow();
  });

  it('should have default noop onTouched callback', () => {
    const callback = component.onTouched;
    expect(() => callback()).not.toThrow();
  });
});
