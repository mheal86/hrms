import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Employee } from '../employee';
import { Employee as EmployeeModel } from '../employee-model';
import { Spinner } from '../../../shared/spinner/spinner';

@Component({
  selector: 'app-employee-detail',
  imports: [CommonModule, RouterLink, Spinner],
  templateUrl: './employee-detail.html',
  styleUrl: './employee-detail.css',
})
export class EmployeeDetail implements OnInit {
  employee = signal<EmployeeModel | null>(null);
  history = signal<any[]>([]);
  isLoading = signal(false);
  isLoadingHistory = signal(false);
  errorMessage = signal('');

  constructor(private employeeService: Employee, private route: ActivatedRoute, private location: Location) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEmployee(id);
      this.loadHistory(id);
    }
  }

  loadEmployee(id: string): void {
    this.isLoading.set(true);
    this.employeeService.getById(id).subscribe({
      next: (data) => {
        this.employee.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Không tải được dữ liệu');
        this.isLoading.set(false);
      },
    });
  }

  loadHistory(id: string): void {
    this.isLoadingHistory.set(true);
    this.employeeService.getHistory(id).subscribe({
      next: (data) => {
        this.history.set(data);
        this.isLoadingHistory.set(false);
      },
      error: () => {
        this.isLoadingHistory.set(false);
      },
    });
  }

  goBack(): void {
    this.location.back();
  }

  getDepartmentName(dept: any): string {
    if (!dept) return 'Chưa phân phòng';
    return typeof dept === 'object' ? (dept.name || 'Chưa phân phòng') : dept;
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }
}