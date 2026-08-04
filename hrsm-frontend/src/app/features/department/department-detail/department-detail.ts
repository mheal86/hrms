import { Component, OnInit, OnDestroy, signal, HostListener } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Department } from '../department';
import { Department as DepartmentModel } from '../department-model';
import { Employee } from '../../employee/employee';
import { Employee as EmployeeModel } from '../../employee/employee-model';
import { Spinner } from '../../../shared/spinner/spinner';
import { Auth } from '../../../core/auth';
import { Notification } from '../../../core/notification';
import { Confirm } from '../../../core/confirm';
import { CustomSelectComponent, SelectOption } from '../../../shared/custom-select/custom-select';
import { Subject, takeUntil } from 'rxjs';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';

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
    TableModule,
    TranslatePipe,
  ],
  templateUrl: './department-detail.html',
  styleUrl: './department-detail.scss',
})
export class DepartmentDetail implements OnInit, OnDestroy {
  baseUrl = environment.baseUrl;
  @HostListener('document:keydown.escape', ['$event'])
  handleEscape(event: Event) {
    if (this.isTransferModalOpen()) {
      this.closeTransferModal();
    }
    if (this.isAddEmployeeModalOpen()) {
      this.closeAddEmployeeModal();
    }
  }
  department = signal<DepartmentModel | null>(null);
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
        disabled: emp.status === 'INACTIVE',
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
        disabled: emp.status === 'ACTIVE',
        styleClass: 'text-danger',
        command: () => {
          this.onDelete(emp);
        },
      },
    ];
  }

  isTransferModalOpen = signal(false);
  selectedEmployeeForTransfer = signal<EmployeeModel | null>(null);
  selectedTargetDepartmentId = signal('');
  transferOptions = signal<SelectOption[]>([]);

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

  private destroy$ = new Subject<void>();

  constructor(
    private departmentService: Department,
    private employeeService: Employee,
    private route: ActivatedRoute,
    private location: Location,
    public authService: Auth,
    private notificationService: Notification,
    private confirmService: Confirm,
    private router: Router,
    private translate: TranslateService,
  ) {}

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
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.department.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(
            err.error?.message || this.translate.instant('DEPARTMENT.LOAD_ERROR'),
          );
          this.isLoading.set(false);
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
        error: () => {},
      });
  }

  loadEmployees(departmentId: string) {
    this.isLoadingEmployees.set(true);
    this.employeeService
      .getAll(1, 100, '', 'firstName', 'asc', departmentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.employees.set(res.data);
          this.isLoadingEmployees.set(false);
        },
        error: () => {
          this.isLoadingEmployees.set(false);
        },
      });
  }

  openTransferModal(emp: EmployeeModel) {
    this.selectedEmployeeForTransfer.set(emp);
    this.selectedTargetDepartmentId.set('');

    const currentDeptId = this.department()?._id;
    const options = this.allDepartments()
      .filter((d) => d._id !== currentDeptId)
      .map((d) => ({ label: d.name, value: d._id }));
    this.transferOptions.set(options);

    this.isTransferModalOpen.set(true);
  }

  closeTransferModal() {
    this.isTransferModalOpen.set(false);
    this.selectedEmployeeForTransfer.set(null);
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
        deptName: this.getDepartmentName(targetDept.name),
      }),
    );
    if (!confirmed) return;

    this.isLoadingEmployees.set(true);
    this.closeTransferModal();

    this.employeeService
      .update(emp._id, { department: targetDeptId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success(this.translate.instant('DEPARTMENT.TRANSFER_SUCCESS'));
          const currentDeptId = this.department()?._id;
          if (currentDeptId) {
            this.loadEmployees(currentDeptId);
          }
        },
        error: (err) => {
          this.notificationService.error(
            err.error?.message || this.translate.instant('DEPARTMENT.TRANSFER_ERROR'),
          );
          this.isLoadingEmployees.set(false);
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

  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }

  getDepartmentName(dept: any): string {
    const fallback = this.translate.instant('EMPLOYEE.UNASSIGNED');
    if (!dept) return fallback;
    const name = typeof dept === 'object' ? dept.name || fallback : dept;
    const mapping: { [key: string]: string } = {
      'Phòng Nhân sự': 'DEPARTMENTS_LIST.HR',
      'Phòng Công nghệ thông tin': 'DEPARTMENTS_LIST.TECH',
      'Phòng Kế toán': 'DEPARTMENTS_LIST.FINANCE',
      'Phòng Marketing': 'DEPARTMENTS_LIST.MARKETING',
      'Phòng Kinh doanh': 'DEPARTMENTS_LIST.SALES',
      'Phòng Hành chính': 'DEPARTMENTS_LIST.ADMIN',
      'Phòng Nghiên cứu & Phát triển': 'DEPARTMENTS_LIST.RD',
      'Phòng R&D': 'DEPARTMENTS_LIST.RD',
      'Phòng Quản lý dự án': 'DEPARTMENTS_LIST.PROJECT',
      'Phòng Chăm sóc khách hàng': 'DEPARTMENTS_LIST.CUSTOMER_SERVICE',
      'Phòng Pháp chế': 'DEPARTMENTS_LIST.LEGAL',
      'Phòng Thiết kế': 'DEPARTMENTS_LIST.DESIGN',
      'Phòng Đào tạo': 'DEPARTMENTS_LIST.TRAINING',
    };
    const translationKey = mapping[name];
    if (translationKey) {
      const translated = this.translate.instant(translationKey);
      return translated !== translationKey ? translated : name;
    }
    return name;
  }

  getPositionTranslation(position: any): string {
    if (!position) return '';
    const mapping: { [key: string]: string } = {
      'Nhân viên': 'FORM.POSITION_STAFF',
      'Trưởng nhóm': 'FORM.POSITION_TEAM_LEADER',
      'Trưởng phòng': 'FORM.POSITION_DEPT_HEAD',
      'Phó phòng': 'FORM.POSITION_DEPT_DEPUTY',
      'Phó giám đốc': 'FORM.POSITION_DEPUTY_GD',
      'Giám đốc': 'FORM.POSITION_GD',
      'Thực tập sinh': 'FORM.POSITION_INTERN',
    };
    return mapping[position] || position;
  }

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
      .getAll(1, 1000, '', 'firstName', 'asc', '', 'ACTIVE')
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
        error: () => {},
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

    const oldDeptName = this.getDepartmentName(emp.department);

    // Hiển thông báo xác nhận đúng theo mẫu yêu cầu
    const confirmed = await this.confirmService.ask(
      this.translate.instant('DEPARTMENT.TRANSFER_IN_CONFIRM', {
        from: oldDeptName,
        to: this.getDepartmentName(currentDept.name),
      }),
    );
    if (!confirmed) return;

    this.isLoadingEmployees.set(true);
    this.closeAddEmployeeModal();

    this.employeeService
      .update(emp._id!, { department: currentDept._id })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success(
            this.translate.instant('DEPARTMENT.TRANSFER_IN_SUCCESS'),
          );
          this.loadEmployees(currentDept._id!);
        },
        error: (err) => {
          this.notificationService.error(
            err.error?.message || this.translate.instant('DEPARTMENT.TRANSFER_IN_ERROR'),
          );
          this.isLoadingEmployees.set(false);
        },
      });
  }

  getDepartmentDesc(name: any, description: any): string {
    const mapping: { [key: string]: string } = {
      'Phòng Nhân sự': 'DEPARTMENTS_DESC.HR',
      'Phòng Công nghệ thông tin': 'DEPARTMENTS_DESC.TECH',
      'Phòng Kế toán': 'DEPARTMENTS_DESC.FINANCE',
      'Phòng Marketing': 'DEPARTMENTS_DESC.MARKETING',
      'Phòng Kinh doanh': 'DEPARTMENTS_DESC.SALES',
      'Phòng Hành chính': 'DEPARTMENTS_DESC.ADMIN',
      'Phòng Nghiên cứu & Phát triển': 'DEPARTMENTS_DESC.RD',
      'Phòng R&D': 'DEPARTMENTS_DESC.RD',
      'Phòng Quản lý dự án': 'DEPARTMENTS_DESC.PROJECT',
      'Phòng Chăm sóc khách hàng': 'DEPARTMENTS_DESC.CUSTOMER_SERVICE',
      'Phòng Pháp chế': 'DEPARTMENTS_DESC.LEGAL',
      'Phòng Thiết kế': 'DEPARTMENTS_DESC.DESIGN',
      'Phòng Đào tạo': 'DEPARTMENTS_DESC.TRAINING',
    };
    const translationKey = mapping[name];
    if (translationKey) {
      const translated = this.translate.instant(translationKey);
      return translated !== translationKey ? translated : description;
    }
    return description || '';
  }
}
