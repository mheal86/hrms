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
import { Card } from 'primeng/card';
import { Divider } from 'primeng/divider';
import { ProgressBar } from 'primeng/progressbar';
import { UIChart } from 'primeng/chart';
import { Chart, registerables } from 'chart.js';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';
import { LanguageService } from '../../../core/services/language.service';
import { getInitials } from '../../../core/utils/employee-utils';
Chart.register(...registerables);

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
    Card,
    Divider,
    ProgressBar,
    UIChart,
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
  getInitials = getInitials;
  menuItems: MenuItem[] = [];

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

  themeTrigger = signal(0);

  @HostListener('window:themeChanged')
  onThemeChanged() {
    this.themeTrigger.update((v) => v + 1);
  }

  // Lọc ra các nhân viên đang hoạt động (ACTIVE) của phòng ban
  activeEmployeesOfDept = computed(() => {
    return this.employees().filter((emp) => emp.status === 'ACTIVE');
  });

  // 1. Tổng số nhân viên đang hoạt động
  totalActiveEmployees = computed(() => {
    return this.activeEmployeesOfDept().length;
  });

  // 2. Số lượng nhân viên Nam đang hoạt động
  maleEmployeesCount = computed(() => {
    return this.activeEmployeesOfDept().filter((emp) => emp.gender === 'MALE').length;
  });

  // 3. Số lượng nhân viên Nữ đang hoạt động
  femaleEmployeesCount = computed(() => {
    return this.activeEmployeesOfDept().filter((emp) => emp.gender === 'FEMALE').length;
  });

  // Tính tỷ lệ phần trăm Nam/Nữ
  malePercentage = computed(() => {
    const total = this.totalActiveEmployees();
    return total > 0 ? Math.round((this.maleEmployeesCount() / total) * 100) : 0;
  });

  femalePercentage = computed(() => {
    const total = this.totalActiveEmployees();
    return total > 0 ? Math.round((this.femaleEmployeesCount() / total) * 100) : 0;
  });

  // 4. Độ tuổi trung bình của các nhân sự hoạt động có thông tin ngày sinh
  averageAge = computed(() => {
    const active = this.activeEmployeesOfDept();
    const empsWithAge = active.filter((emp) => emp.dateOfBirth);
    if (empsWithAge.length === 0) return 0;

    const today = new Date();
    const totalAge = empsWithAge.reduce((sum, emp) => {
      const birthDate = new Date(emp.dateOfBirth!);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return sum + age;
    }, 0);

    return Math.round(totalAge / empsWithAge.length);
  });

  // 5. Nhân viên mới nhất (có ngày vào làm gần nhất)
  newestEmployee = computed(() => {
    const active = this.activeEmployeesOfDept();
    const empsWithHireDate = active.filter((emp) => emp.hireDate);
    if (empsWithHireDate.length === 0) return undefined;

    return [...empsWithHireDate].sort((a, b) => {
      return new Date(b.hireDate!).getTime() - new Date(a.hireDate!).getTime();
    })[0];
  });

  // 6. Nhân viên lâu năm nhất (có ngày vào làm sớm nhất)
  longestServingEmployee = computed(() => {
    const active = this.activeEmployeesOfDept();
    const empsWithHireDate = active.filter((emp) => emp.hireDate);
    if (empsWithHireDate.length === 0) return undefined;

    return [...empsWithHireDate].sort((a, b) => {
      return new Date(a.hireDate!).getTime() - new Date(b.hireDate!).getTime();
    })[0];
  });

  // 7. Phân bố chức vụ
  positionDistribution = computed(() => {
    const active = this.activeEmployeesOfDept();
    const distMap: { [key: string]: number } = {};

    active.forEach((emp) => {
      const position = emp.position || 'UNASSIGNED';
      distMap[position] = (distMap[position] || 0) + 1;
    });

    return distMap;
  });

  hasPositionData = computed(() => {
    return Object.keys(this.positionDistribution()).length > 0;
  });

  // Chọn loại biểu đồ: bar (nếu > 5 chức vụ), doughnut (nếu <= 5 chức vụ)
  positionChartType = computed<'doughnut' | 'bar'>(() => {
    return Object.keys(this.positionDistribution()).length > 5 ? 'bar' : 'doughnut';
  });

  positionChartData = computed(() => {
    this.themeTrigger();
    this.languageService.currentLang();

    const dist = this.positionDistribution();
    const positions = Object.keys(dist);
    const counts = Object.values(dist);

    const isDark = document.body.classList.contains('dark-theme');
    const rootStyle = getComputedStyle(document.documentElement);

    const colors: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const val = rootStyle.getPropertyValue(`--chart-${i}`).trim();
      colors.push(val || (isDark ? '#818cf8' : '#4f46e5'));
    }

    const backgroundColors = positions.map((_, i) => colors[i % colors.length]);

    const labels = positions.map((pos) => {
      if (pos === 'UNASSIGNED') {
        return this.translate.instant('DEPARTMENT.NO_POSITION');
      }
      const translationKey = this.languageService.getPositionTranslation(pos);
      return this.translate.instant(translationKey);
    });

    return {
      labels,
      datasets: [
        {
          data: counts,
          backgroundColor: backgroundColors,
          borderColor: isDark ? '#1e293b' : '#ffffff',
          borderWidth: 2,
        },
      ],
    };
  });

  positionChartOptions = computed(() => {
    this.themeTrigger();
    this.languageService.currentLang();

    const isDark = document.body.classList.contains('dark-theme');
    const chartType = this.positionChartType();
    const isBar = chartType === 'bar';

    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
    const textColor = isDark ? '#cbd5e1' : '#475569';

    const baseOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          display: !isBar,
          position: 'right',
          labels: {
            color: textColor,
            font: {
              family: "'Inter', sans-serif",
              size: 11,
              weight: '500'
            },
            boxWidth: 8
          }
        },
        tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          titleColor: isDark ? '#f8fafc' : '#0f172a',
          bodyColor: isDark ? '#cbd5e1' : '#334155',
          borderColor: isDark ? '#475569' : '#e2e8f0',
          borderWidth: 1,
          padding: 8,
          cornerRadius: 6,
          callbacks: {
            label: (context: any) => {
              const value = context.raw || 0;
              const total = this.totalActiveEmployees();
              const percent = total > 0 ? Math.round((value / total) * 100) : 0;
              return ` ${context.label}: ${value} (${percent}%)`;
            }
          }
        }
      }
    };

    if (isBar) {
      baseOptions.indexAxis = 'y';
      baseOptions.scales = {
        x: {
          grid: {
            color: gridColor,
            drawBorder: false
          },
          ticks: {
            color: textColor,
            precision: 0,
            font: {
              family: "'Inter', sans-serif",
              size: 10
            }
          }
        },
        y: {
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            color: textColor,
            font: {
              family: "'Inter', sans-serif",
              size: 11
            }
          }
        }
      };
    } else {
      baseOptions.cutout = '60%';
    }

    return baseOptions;
  });

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
