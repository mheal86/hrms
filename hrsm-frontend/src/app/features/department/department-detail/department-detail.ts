import { Component, OnInit, signal, HostListener } from '@angular/core';
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

@Component({
  selector: 'app-department-detail',
  imports: [CommonModule, RouterLink, Spinner, CustomSelectComponent, FormsModule],
  templateUrl: './department-detail.html',
  styleUrl: './department-detail.css',
})
export class DepartmentDetail implements OnInit {
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

  constructor(
    private departmentService: Department,
    private employeeService: Employee,
    private route: ActivatedRoute,
    private location: Location,
    public authService: Auth,
    private notificationService: Notification,
    private confirmService: Confirm
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDepartment(id);
      this.loadEmployees(id);
      this.loadAllDepartments();
    }
  }

  loadDepartment(id: string): void {
    this.isLoading.set(true);
    this.departmentService.getById(id).subscribe({
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

  loadAllDepartments(): void {
    this.departmentService.getAllUnpaginated().subscribe({
      next: (depts) => {
        this.allDepartments.set(depts);
      },
      error: () => {}
    });
  }

  loadEmployees(departmentId: string): void {
    this.isLoadingEmployees.set(true);
    this.employeeService.getAll(1, 100, '', 'firstName', 'asc', departmentId).subscribe({
      next: (res) => {
        this.employees.set(res.data);
        this.isLoadingEmployees.set(false);
      },
      error: () => {
        this.isLoadingEmployees.set(false);
      },
    });
  }

  toggleActionsMenu(id: string, event: Event): void {
    event.stopPropagation();
    if (this.activeActionsMenuId() === id) {
      this.activeActionsMenuId.set(null);
    } else {
      this.activeActionsMenuId.set(id);
    }
  }

  @HostListener('document:click')
  closeActionsMenu(): void {
    this.activeActionsMenuId.set(null);
  }

  openTransferModal(emp: EmployeeModel): void {
    this.selectedEmployeeForTransfer.set(emp);
    this.selectedTargetDepartmentId.set('');

    const currentDeptId = this.department()?._id;
    const options = this.allDepartments()
      .filter((d) => d._id !== currentDeptId)
      .map((d) => ({ label: d.name, value: d._id }));
    this.transferOptions.set(options);

    this.isTransferModalOpen.set(true);
  }

  closeTransferModal(): void {
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

    this.employeeService.update(emp._id, { department: targetDeptId } as any).subscribe({
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

    this.employeeService.delete(emp._id).subscribe({
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

  goBack(): void {
    this.location.back();
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }
}