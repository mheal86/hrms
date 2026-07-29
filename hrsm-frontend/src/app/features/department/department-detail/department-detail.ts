import { Component, OnInit, OnDestroy, signal, HostListener } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
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

@Component({
  selector: 'app-department-detail',
  imports: [CommonModule, RouterLink, Spinner, CustomSelectComponent, FormsModule],
  templateUrl: './department-detail.html',
  styleUrl: './department-detail.css',
})
export class DepartmentDetail implements OnInit, OnDestroy {
  department = signal<DepartmentModel | null>(null);
  employees = signal<EmployeeModel[]>([]);
  allDepartments = signal<DepartmentModel[]>([]);
  isLoading = signal(false);
  isLoadingEmployees = signal(false);
  errorMessage = signal('');

  activeActionsMenuId = signal<string | null>(null);
  isTransferModalOpen = signal(false);
  selectedEmployeeForTransfer = signal<EmployeeModel | null>(null);
  selectedTargetDepartmentId = signal('');
  transferOptions = signal<SelectOption[]>([]);

  // Thêm nhân viên từ phòng ban khác
  isAddEmployeeModalOpen = signal(false);
  selectedEmployeeToTransferInId = signal('');
  searchedOtherEmployees = signal<EmployeeModel[]>([]);
  otherEmployeesList: EmployeeModel[] = [];
  searchOtherEmployeeText = '';
  activeSubTab = signal<'choose' | 'transfer'>('choose');

  private destroy$ = new Subject<void>();

  constructor(
    private departmentService: Department,
    private employeeService: Employee,
    private route: ActivatedRoute,
    private location: Location,
    public authService: Auth,
    private notificationService: Notification,
    private confirmService: Confirm
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
          this.errorMessage.set(err.error?.message || 'Không tải được dữ liệu');
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
        error: () => {}
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

  toggleActionsMenu(id: string, event: Event) {
    event.stopPropagation();
    if (this.activeActionsMenuId() === id) {
      this.activeActionsMenuId.set(null);
    } else {
      this.activeActionsMenuId.set(id);
    }
  }

  @HostListener('document:click')
  closeActionsMenu() {
    this.activeActionsMenuId.set(null);
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
      `Bạn có chắc chắn muốn chuyển nhân viên "${emp.firstName} ${emp.lastName}" sang phòng ban "${targetDept.name}"?`
    );
    if (!confirmed) return;

    this.isLoadingEmployees.set(true);
    this.closeTransferModal();

    this.employeeService
      .update(emp._id, { department: targetDeptId } as any)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success('Chuyển phòng ban thành công');
          const currentDeptId = this.department()?._id;
          if (currentDeptId) {
            this.loadEmployees(currentDeptId);
          }
        },
        error: (err) => {
          this.notificationService.error(err.error?.message || 'Có lỗi xảy ra khi chuyển phòng ban');
          this.isLoadingEmployees.set(false);
        },
      });
  }

  async onDelete(emp: EmployeeModel): Promise<void> {
    if (!emp._id) return;

    const confirmed = await this.confirmService.ask(
      `Bạn có chắc chắn muốn xóa nhân viên "${emp.firstName} ${emp.lastName}"?`
    );
    if (!confirmed) return;

    this.employeeService
      .delete(emp._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success('Xóa nhân viên thành công');
          const currentDeptId = this.department()?._id;
          if (currentDeptId) {
            this.loadEmployees(currentDeptId);
          }
        },
        error: (err) => {
          this.notificationService.error(err.error?.message || 'Xóa nhân viên thất bại');
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
    if (!dept) return 'Chưa phân phòng';
    return typeof dept === 'object' ? (dept.name || 'Chưa phân phòng') : dept;
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
          this.otherEmployeesList = res.data.filter(emp => {
            const empDeptId = typeof emp.department === 'string' ? emp.department : emp.department?._id;
            return empDeptId !== currentDeptId;
          });
        },
        error: () => {}
      });
  }

  triggerSearchOtherEmployees() {
    const term = this.searchOtherEmployeeText.trim().toLowerCase();
    if (!term) {
      this.searchedOtherEmployees.set([]);
      return;
    }
    const filtered = this.otherEmployeesList.filter(emp => {
      const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      const position = (emp.position || '').toLowerCase();
      const deptName = typeof emp.department === 'string' ? '' : (emp.department?.name || '').toLowerCase();
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

    const emp = this.otherEmployeesList.find(e => e._id === empId);
    if (!emp) return;

    const oldDeptName = typeof emp.department === 'string' ? 'Không có phòng ban' : (emp.department?.name || 'Không có phòng ban');

    // Hiện thông báo xác nhận đúng theo mẫu yêu cầu
    const confirmed = await this.confirmService.ask(
      `Nhân viên này hiện đang thuộc phòng ban "${oldDeptName}". Bạn có chắc muốn chuyển sang phòng ban "${currentDept.name}" không?`
    );
    if (!confirmed) return;

    this.isLoadingEmployees.set(true);
    this.closeAddEmployeeModal();

    this.employeeService
      .update(emp._id!, { department: currentDept._id } as any)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success(`Chuyển nhân viên ${emp.firstName} ${emp.lastName} vào phòng ban thành công`);
          this.loadEmployees(currentDept._id!);
        },
        error: (err) => {
          this.notificationService.error(err.error?.message || 'Có lỗi xảy ra khi chuyển nhân viên');
        this.isLoadingEmployees.set(false);
      }
    });
  }
}