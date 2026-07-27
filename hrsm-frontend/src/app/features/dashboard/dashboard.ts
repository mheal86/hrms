import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardSummary {
  totalEmployees: number;
  totalDepartments: number;
  totalUsers: number;
  activeEmployees: number;
  employeesByDepartment: { departmentName: string; lastMonthCount: number; thisMonthCount: number }[];
}

@Injectable({
  providedIn: 'root',
})
export class Dashboard {
  private apiUrl = 'http://localhost:5000/api/dashboard';

  constructor(private http: HttpClient) {}

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiUrl}/summary`);
  }
}