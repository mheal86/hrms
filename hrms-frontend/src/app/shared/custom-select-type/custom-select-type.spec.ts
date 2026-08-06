import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormlyFieldCustomSelect } from './custom-select-type';

describe('FormlyFieldCustomSelect', () => {
  let component: FormlyFieldCustomSelect;
  let fixture: ComponentFixture<FormlyFieldCustomSelect>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormlyFieldCustomSelect]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormlyFieldCustomSelect);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
