import { Component, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { Department } from '../department';
import { Department as DepartmentModel } from '../department-model';
import { Auth } from '../../../core/auth';
import { Notification } from '../../../core/notification';
import { Confirm } from '../../../core/confirm';
import { TableSkeleton } from '../../../shared/table-skeleton/table-skeleton';
import { Paginator } from 'primeng/paginator';

@Component({
  selector: 'app-department-list',
  imports: [CommonModule, RouterLink, FormsModule, TableSkeleton, Paginator],
  templateUrl: './department-list.html',
  styleUrl: './department-list.css',
})
export class DepartmentList implements OnInit {
  departments = signal<DepartmentModel[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  searchTerm = '';

  activeActionsMenuId = signal<string | null>(null);

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

  currentPage = signal(1);
  totalPages = signal(1);
  total = signal(0);
  pageSize = 5;
  first = 0;

  private searchSubject = new Subject<string>();

  constructor(
    private departmentService: Department,
    public authService: Auth,
    private notificationService: Notification,
    private confirmService: Confirm
  ) {
    this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.currentPage.set(1);
      this.first = 0;
      this.loadDepartments();
    });
  }

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.isLoading.set(true);
    this.departmentService.getAll(this.searchTerm, this.currentPage(), this.pageSize).subscribe({
      next: (res) => {
        this.departments.set(res.data);
        this.total.set(res.pagination.total);
        this.totalPages.set(res.pagination.totalPages);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Không tải được danh sách');
        this.isLoading.set(false);
      },
    });
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onPageChange(event: any): void {
    this.first = event.first;
    this.pageSize = event.rows;
    this.currentPage.set((event.page ?? 0) + 1);
    this.loadDepartments();
  }

  async onDelete(dept: DepartmentModel): Promise<void> {
  if (!dept._id) return;

  const confirmed = await this.confirmService.ask(`Bạn có chắc muốn xóa phòng ban "${dept.name}"?`);
  if (!confirmed) return;

  this.departmentService.delete(dept._id).subscribe({
    next: () => {
      this.notificationService.success('Xóa phòng ban thành công');
      this.loadDepartments();
    },
    error: (err) => {
      this.notificationService.error(err.error?.message || 'Xóa thất bại');
    },
  });
}
}