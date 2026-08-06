import { Component, OnInit, OnDestroy, signal, HostListener, computed, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Department } from '../../../core/services/department.service';
import { Department as DepartmentModel } from '../../../core/models/department-model';
import { Employee } from '../../../core/services/employee.service';
import { Employee as EmployeeModel, EmployeeStatus } from '../../../core/models/employee-model';
import { Spinner } from '../../../shared/spinner/spinner';
import { Auth } from '../../../core/services/auth';
import { Notification } from '../../../core/services/notification';
import { Confirm } from '../../../core/services/confirm';
import { CustomSelectComponent } from '../../../shared/custom-select/custom-select';
import { Subject, takeUntil, finalize } from 'rxjs';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';
import { LanguageService } from '../../../core/services/language.service';
import { getInitials } from '../../../core/utils/employee-utils';

@Component({
  selector: 'app-department-detail',
  imports: [
    CommonModule,
    RouterLink,
    Spinner,
    CustomSelectComponent,
    FormsModule,
    Menu,
    Dialog,
    Button,
    InputText,
    TableModule,
    TranslatePipe,
  ],
  templateUrl: './department-detail.html',
  styleUrl: './department-detail.scss',
})
export class DepartmentDetail implements OnInit, OnDestroy {
  departmentService = inject(Department);
  employeeService = inject(Employee);
  route = inject(ActivatedRoute);
  location = inject(Location);
  authService = inject(Auth);
  notificationService = inject(Notification);
  confirmService = inject(Confirm);
  router = inject(Router);
  translate = inject(TranslateService);
  languageService = inject(LanguageService);

  baseUrl = environment.baseUrl;
  @HostListener('document:keydown.escape', ['$event'])
  handleEscape(_event: Event) {
    if (this.isTransferModalOpen()) {
      this.closeTransferModal();
    }
    if (this.isAddEmployeeModalOpen()) {
      this.closeAddEmployeeModal();
    }
  }
  department = signal<DepartmentModel | undefined>(undefined);
  employees = signal<EmployeeModel[]>([]);
  allDepartments = signal<DepartmentModel[]>([]);
  isLoading = signal(false);
  isLoadingEmployees = signal(false);
  errorMessage = signal('');

  menuItems: MenuItem[] = [];

  getEmployeeMenuItems(emp: EmployeeModel): MenuItem[] {
    return [
      {
        label: this.translate.instant('DEPARTMENT.MENU_EMP_EDIT'),
        icon: 'pi pi-pencil',
        disabled: emp.status === EmployeeStatus.INACTIVE,
        command: () => {
          this.router.navigate(['/employees/edit', emp._id], {
            queryParams: { departmentId: this.department()?._id },
          });
        },
      },
      {
        label: this.translate.instant('DEPARTMENT.MENU_EMP_TRANSFER'),
        icon: 'pi pi-send',
        command: () => {
          this.openTransferModal(emp);
        },
      },
      {
        label: this.translate.instant('DEPARTMENT.MENU_EMP_DELETE'),
        icon: 'pi pi-trash',
        disabled: emp.status === EmployeeStatus.ACTIVE,
        styleClass: 'text-danger',
        command: () => {
          this.onDelete(emp);
        },
      },
    ];
  }

  isTransferModalOpen = signal(false);
  selectedEmployeeForTransfer = signal<EmployeeModel | undefined>(undefined);
  selectedTargetDepartmentId = signal('');
  transferOptions = computed(() => {
    this.languageService.currentLang();
    const currentDeptId = this.department()?._id;
    return this.allDepartments()
      .filter((d) => d._id !== currentDeptId)
      .map((d) => ({
        label: this.languageService.getDepartmentName(d.name),
        value: d._id || '',
      }));
  });
  isAddEmployeeModalOpen = signal(false);
  selectedEmployeeToTransferInId = signal('');
  searchedOtherEmployees = signal<EmployeeModel[]>([]);
  otherEmployeesList: EmployeeModel[] = [];
  searchOtherEmployeeText = '';
  activeSubTab = signal<'choose' | 'transfer'>('choose');
  cols = [
    { field: 'fullName', header: 'DEPARTMENT.COL_FULL_NAME' },
    { field: 'email', header: 'DEPARTMENT.COL_EMAIL' },
    { field: 'position', header: 'DEPARTMENT.COL_POSITION' },
    { field: 'status', header: 'DEPARTMENT.COL_STATUS' },
  ];

  destroy$ = new Subject<void>();

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDepartment(id);
      this.loadEmployees(id);
      this.loadAllDepartments();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDepartment(id: string) {
    this.isLoading.set(true);
    this.departmentService
      .getById(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (data) => {
          this.department.set(data);
        },
        error: (err) => {
          this.errorMessage.set(
            err.error?.message || this.translate.instant('DEPARTMENT.LOAD_ERROR'),
          );
        },
      });
  }

  loadAllDepartments() {
    this.departmentService
      .getAllUnpaginated()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (depts) => {
          this.allDepartments.set(depts);
        },
        error: (err) => {
          this.notificationService.error(
            err.error?.message || this.translate.instant('DEPARTMENT.LOAD_ERROR'),
          );
        },
      });
  }

  loadEmployees(departmentId: string) {
    this.isLoadingEmployees.set(true);
    this.employeeService
      .getAll(1, 100, '', 'firstName', 'asc', departmentId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingEmployees.set(false))
      )
      .subscribe({
        next: (res) => {
          this.employees.set(res.data);
        },
        error: (err) => {
          this.notificationService.error(
            err.error?.message || this.translate.instant('DEPARTMENT.LOAD_ERROR'),
          );
        },
      });
  }

  openTransferModal(emp: EmployeeModel) {
    this.selectedEmployeeForTransfer.set(emp);
    this.selectedTargetDepartmentId.set('');
    this.isTransferModalOpen.set(true);
  }

  closeTransferModal() {
    this.isTransferModalOpen.set(false);
    this.selectedEmployeeForTransfer.set(undefined);
    this.selectedTargetDepartmentId.set('');
  }

  async confirmTransferDepartment(targetDeptId: string): Promise<void> {
    const emp = this.selectedEmployeeForTransfer();
    if (!emp || !emp._id || !targetDeptId) return;

    const targetDept = this.allDepartments().find((d) => d._id === targetDeptId);
    if (!targetDept) return;

    const confirmed = await this.confirmService.ask(
      this.translate.instant('DEPARTMENT.TRANSFER_DEPT_CONFIRM', {
        empName: `${emp.firstName} ${emp.lastName}`,
        deptName: this.languageService.getDepartmentName(targetDept.name),
      }),
    );
    if (!confirmed) return;

    this.closeTransferModal();
    this.updateEmployeeDepartment(emp._id, targetDeptId, 'DEPARTMENT.TRANSFER_SUCCESS');
  }

  updateEmployeeDepartment(empId: string, targetDeptId: string, successMsgKey: string) {
    this.isLoadingEmployees.set(true);
    this.employeeService
      .update(empId, { department: targetDeptId })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingEmployees.set(false))
      )
      .subscribe({
        next: () => {
          this.notificationService.success(this.translate.instant(successMsgKey));
          const currentDeptId = this.department()?._id;
          if (currentDeptId) {
            this.loadEmployees(currentDeptId);
          }
        },
        error: (err) => {
          this.notificationService.error(
            err.error?.message || this.translate.instant('DEPARTMENT.TRANSFER_ERROR'),
          );
        },
      });
  }

  async onDelete(emp: EmployeeModel): Promise<void> {
    if (!emp._id) return;

    const confirmed = await this.confirmService.ask(
      this.translate.instant('EMPLOYEE.DELETE_CONFIRM', {
        name: `${emp.firstName} ${emp.lastName}`,
      }),
    );
    if (!confirmed) return;

    this.employeeService
      .delete(emp._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success(this.translate.instant('EMPLOYEE.DELETE_SUCCESS'));
          const currentDeptId = this.department()?._id;
          if (currentDeptId) {
            this.loadEmployees(currentDeptId);
          }
        },
        error: (err) => {
          this.notificationService.error(
            err.error?.message || this.translate.instant('DEPARTMENT.DELETE_EMP_ERROR'),
          );
        },
      });
  }

  goBack() {
    this.location.back();
  }

  getInitials = getInitials;

  openAddEmployeeModal() {
    this.selectedEmployeeToTransferInId.set('');
    this.searchOtherEmployeeText = '';
    this.searchedOtherEmployees.set([]);
    this.activeSubTab.set('choose');
    this.isAddEmployeeModalOpen.set(true);
    this.loadOtherEmployees();
  }

  closeAddEmployeeModal() {
    this.isAddEmployeeModalOpen.set(false);
    this.selectedEmployeeToTransferInId.set('');
    this.searchOtherEmployeeText = '';
    this.searchedOtherEmployees.set([]);
  }

  loadOtherEmployees() {
    const currentDeptId = this.department()?._id;
    this.employeeService
      .getAll(1, 1000, '', 'firstName', 'asc', '', EmployeeStatus.ACTIVE)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          // Chỉ lấy nhân viên đang hoạt động và đang ở phòng ban khác
          this.otherEmployeesList = res.data.filter((emp) => {
            const empDeptId =
              typeof emp.department === 'string' ? emp.department : emp.department?._id;
            return empDeptId !== currentDeptId;
          });
        },
        error: (err) => {
          this.notificationService.error(
            err.error?.message || this.translate.instant('DEPARTMENT.LOAD_ERROR'),
          );
        },
      });
  }

  triggerSearchOtherEmployees() {
    const term = this.searchOtherEmployeeText.trim().toLowerCase();
    if (!term) {
      this.searchedOtherEmployees.set([]);
      return;
    }
    const filtered = this.otherEmployeesList.filter((emp) => {
      const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      const position = (emp.position || '').toLowerCase();
      const deptName =
        typeof emp.department === 'string' ? '' : (emp.department?.name || '').toLowerCase();
      return fullName.includes(term) || position.includes(term) || deptName.includes(term);
    });
    this.searchedOtherEmployees.set(filtered);
  }

  goBackToChooseSubTab() {
    this.searchOtherEmployeeText = '';
    this.searchedOtherEmployees.set([]);
    this.selectedEmployeeToTransferInId.set('');
    this.activeSubTab.set('choose');
  }

  async confirmTransferIn(): Promise<void> {
    const empId = this.selectedEmployeeToTransferInId();
    const currentDept = this.department();
    if (!empId || !currentDept || !currentDept._id) return;

    const emp = this.otherEmployeesList.find((e) => e._id === empId);
    if (!emp) return;

    const oldDeptName = this.languageService.getDepartmentName(emp.department);

    // Hiển thông báo xác nhận đúng theo mẫu yêu cầu
    const confirmed = await this.confirmService.ask(
      this.translate.instant('DEPARTMENT.TRANSFER_IN_CONFIRM', {
        from: oldDeptName,
        to: this.languageService.getDepartmentName(currentDept.name),
      }),
    );
    if (!confirmed) return;

    this.closeAddEmployeeModal();
    this.updateEmployeeDepartment(emp._id!, currentDept._id!, 'DEPARTMENT.TRANSFER_IN_SUCCESS');
  }
}
