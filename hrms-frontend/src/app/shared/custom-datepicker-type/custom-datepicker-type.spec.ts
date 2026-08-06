import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormlyFieldDatePicker } from './custom-datepicker-type';

describe('FormlyFieldDatePicker', () => {
  let component: FormlyFieldDatePicker;
  let fixture: ComponentFixture<FormlyFieldDatePicker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormlyFieldDatePicker]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormlyFieldDatePicker);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
