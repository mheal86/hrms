import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DepartmentForm } from './department-form';
import { Department as DepartmentService } from '../../../core/services/department.service';
import { ActivatedRoute, ParamMap, Router, convertToParamMap } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { FormlyModule, FieldType } from '@ngx-formly/core';
import { Location } from '@angular/common';
import { FormControl } from '@angular/forms';
import { Department as DepartmentModel } from '../../../core/models/department-model';

@Component({
  selector: 'formly-dummy',
  template: '',
  standalone: true,
})
class DummyComponent extends FieldType { }

describe('DepartmentForm', () => {
  let component: DepartmentForm;
  let fixture: ComponentFixture<DepartmentForm>;
  let router: Router;

  const MOCK_DEPARTMENT: Partial<DepartmentModel> & DepartmentModel = {
    _id: 'd1',
    name: 'IT',
    description: 'Tech'
  } as Partial<DepartmentModel> & DepartmentModel;

  let mockDepartmentService: jasmine.SpyObj<DepartmentService>;
  let mockActivatedRoute: { snapshot: { paramMap: ParamMap } };

  beforeEach(async () => {
    mockDepartmentService = jasmine.createSpyObj<DepartmentService>('DepartmentService', ['getById', 'create', 'update']);
    mockDepartmentService.getById.and.returnValue(of(MOCK_DEPARTMENT));
    mockDepartmentService.create.and.returnValue(of({} as Partial<DepartmentModel> & DepartmentModel));
    mockDepartmentService.update.and.returnValue(of({} as Partial<DepartmentModel> & DepartmentModel));

    mockActivatedRoute = {
      snapshot: {
        paramMap: convertToParamMap({}),
      },
    };

    await TestBed.configureTestingModule({
      imports: [
        DepartmentForm,
        FormlyModule.forRoot({
          types: [
            { name: 'input', component: DummyComponent },
            { name: 'textarea', component: DummyComponent },
          ]
        }),
      ],
      providers: [
        { provide: DepartmentService, useValue: mockDepartmentService },
        provideRouter([]),
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        provideTranslateService(),
        provideHttpClient(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DepartmentForm);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  describe('Department Name Validator (specialChars)', () => {
    let validator: ((control: FormControl) => boolean) | undefined;

    beforeEach(() => {
      component.initFields();
      const fieldGroup = component.fields[0]?.fieldGroup;
      const validators = fieldGroup?.[0]?.validators as Record<string, { expression: (control: FormControl) => boolean }> | undefined;

      validator = validators?.['specialChars']?.expression as ((control: FormControl) => boolean) | undefined;
    });

    it('should be defined', () => {
      expect(validator).toBeDefined();
    });

    it('should return true for empty value', () => {
      if (validator) {
        expect(validator(new FormControl(''))).toBe(true);
      }
    });

    it('should return false for spaces only', () => {
      if (validator) {
        expect(validator(new FormControl('   '))).toBe(false);
      }
    });

    it('should return false for special characters', () => {
      if (validator) {
        expect(validator(new FormControl('IT @ Dept'))).toBe(false);
      }
    });

    it('should return true for valid formatted string', () => {
      if (validator) {
        expect(validator(new FormControl('IT - Department (Tech).'))).toBe(true);
      }
    });
  });

  it('should enter edit mode and load department details', () => {
    const route = TestBed.inject(ActivatedRoute);
    spyOn(route.snapshot.paramMap, 'get').and.callFake((key: string) => key === 'id' ? 'd1' : null);

    mockDepartmentService.getById.and.returnValue(of(MOCK_DEPARTMENT));

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.isEditMode()).toBe(true);
    expect(component.departmentId).toBe('d1');
    expect(mockDepartmentService.getById).toHaveBeenCalledWith('d1');
    expect(component.model.name).toBe('IT');
  });

  it('should handle loadDepartment error', () => {
    const route = TestBed.inject(ActivatedRoute);
    spyOn(route.snapshot.paramMap, 'get').and.callFake((key: string) => key === 'id' ? 'd1' : null);

    mockDepartmentService.getById.and.returnValue(throwError(() => ({
      error: { message: 'Load failed' }
    })));

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Load failed');
  });

  it('should handle loadDepartment fallback error', () => {
    const route = TestBed.inject(ActivatedRoute);
    spyOn(route.snapshot.paramMap, 'get').and.callFake((key: string) => key === 'id' ? 'd1' : null);

    mockDepartmentService.getById.and.returnValue(throwError(() => ({})));

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.errorMessage()).toContain('DEPARTMENT.LOAD_ERROR');
  });

  it('should mark all controls as touched if form is invalid on submit', () => {
    spyOnProperty(component.form, 'invalid', 'get').and.returnValue(true);
    spyOn(component.form, 'markAllAsTouched');

    component.onSubmit();
    fixture.detectChanges();
    expect(component.form.markAllAsTouched).toHaveBeenCalled();
  });

  it('should call create in create mode on submit', () => {
    component.isEditMode.set(false);
    spyOnProperty(component.form, 'invalid', 'get').and.returnValue(false);
    mockDepartmentService.create.and.returnValue(of({} as Partial<DepartmentModel> & DepartmentModel));
    const navigateSpy = spyOn(router, 'navigate');

    component.model = { name: 'IT' };
    component.onSubmit();
    fixture.detectChanges();

    expect(mockDepartmentService.create).toHaveBeenCalledWith({ name: 'IT' });
    expect(navigateSpy).toHaveBeenCalledWith(['/departments']);
  });

  it('should call update in edit mode on submit', () => {
    component.isEditMode.set(true);
    component.departmentId = 'd1';
    spyOnProperty(component.form, 'invalid', 'get').and.returnValue(false);
    mockDepartmentService.update.and.returnValue(of({} as Partial<DepartmentModel> & DepartmentModel));
    const navigateSpy = spyOn(router, 'navigate');

    component.model = { name: 'IT' };
    component.onSubmit();
    fixture.detectChanges();

    expect(mockDepartmentService.update).toHaveBeenCalledWith('d1', { name: 'IT' });
    expect(navigateSpy).toHaveBeenCalledWith(['/departments']);
  });

  it('should handle onSubmit error', () => {
    component.isEditMode.set(false);
    spyOnProperty(component.form, 'invalid', 'get').and.returnValue(false);
    mockDepartmentService.create.and.returnValue(throwError(() => ({
      error: { message: 'Create failed' }
    })));

    component.onSubmit();
    fixture.detectChanges();
    expect(component.errorMessage()).toBe('Create failed');
  });

  it('should handle onSubmit fallback error', () => {
    component.isEditMode.set(false);
    spyOnProperty(component.form, 'invalid', 'get').and.returnValue(false);
    mockDepartmentService.create.and.returnValue(throwError(() => ({})));

    component.onSubmit();
    fixture.detectChanges();
    expect(component.errorMessage()).toContain('EMPLOYEE.SAVE_ERROR');
  });

  it('should reset form and navigate back on cancel', () => {
    spyOn(component.form, 'reset');
    spyOn(component.form, 'markAsUntouched');
    const location = TestBed.inject(Location);
    const backSpy = spyOn(location, 'back');

    component.onCancel();
    fixture.detectChanges();

    expect(component.form.reset).toHaveBeenCalled();
    expect(component.form.markAsUntouched).toHaveBeenCalled();
    expect(backSpy).toHaveBeenCalled();
  });
});
