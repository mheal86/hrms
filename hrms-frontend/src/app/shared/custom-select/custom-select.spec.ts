import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomSelectComponent } from './custom-select';
import { By } from '@angular/platform-browser';
import { provideTranslateService } from '@ngx-translate/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

describe('CustomSelectComponent', () => {
  let component: CustomSelectComponent;
  let fixture: ComponentFixture<CustomSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomSelectComponent],
      providers: [
        provideTranslateService(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should render p-select element in template with input configurations', () => {
    component.placeholder = 'Select gender';
    component.isInvalid = true;
    component.options = [{ label: 'Nam', value: 'MALE' }];
    fixture.detectChanges();

    const select = fixture.debugElement.query(By.css('p-select'));
    expect(select).not.toBeNull();

    const selectInstance = select.componentInstance;
    const placeholderVal = typeof selectInstance.placeholder === 'function' ? selectInstance.placeholder() : selectInstance.placeholder;
    const invalidVal = typeof selectInstance.invalid === 'function' ? selectInstance.invalid() : selectInstance.invalid;
    const optionsVal = typeof selectInstance.options === 'function' ? selectInstance.options() : selectInstance.options;

    expect(placeholderVal).toBe('Select gender');
    expect(invalidVal).toBe(true);
    expect(optionsVal).toEqual([{ label: 'Nam', value: 'MALE' }]);
  });

  it('should write value and update component state', () => {
    component.writeValue('MALE');
    fixture.detectChanges();

    expect(component.val).toBe('MALE');
  });

  it('should register onChange callback and call it on select change', () => {
    const callback = jasmine.createSpy('onChange');
    component.registerOnChange(callback);

    component.onSelectChange({ value: 'FEMALE' });
    fixture.detectChanges();

    expect(component.val).toBe('FEMALE');
    expect(callback).toHaveBeenCalledWith('FEMALE');
  });

  it('should register onTouched callback and call it on blur', () => {
    const callback = jasmine.createSpy('onTouched');
    component.registerOnTouched(callback);

    component.onSelectBlur();
    fixture.detectChanges();

    expect(callback).toHaveBeenCalled();
  });

  it('should set disabled state and update p-select component binding', () => {
    expect(component.disabled).toBe(false);

    component.setDisabledState?.(true);
    fixture.detectChanges();

    expect(component.disabled).toBe(true);
    const select = fixture.debugElement.query(By.css('p-select'));
    const selectInstance = select.componentInstance;
    const disabledVal = typeof selectInstance.disabled === 'function' ? selectInstance.disabled() : selectInstance.disabled;
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
