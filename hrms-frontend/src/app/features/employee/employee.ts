import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee as EmployeeModel, PaginatedResponse, EmployeeHistory } from './employee-model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Employee {
  private apiUrl = `${environment.apiUrl}/employees`;

  constructor(private http: HttpClient) {}

  getAll(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    sort: string = 'createdAt',
    order: string = 'desc',
    department: string = '',
    status: string = '',
  ): Observable<PaginatedResponse<EmployeeModel>> {
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit)
      .set('sort', sort)
      .set('order', order);

    if (search) params = params.set('search', search);
    if (department) params = params.set('department', department);
    if (status) params = params.set('status', status);

    return this.http.get<PaginatedResponse<EmployeeModel>>(this.apiUrl, { params });
  }

  getById(id: string): Observable<EmployeeModel> {
    return this.http.get<EmployeeModel>(`${this.apiUrl}/${id}`);
  }

  create(employee: EmployeeModel): Observable<EmployeeModel> {
    return this.http.post<EmployeeModel>(this.apiUrl, employee);
  }

  update(id: string, employee: Partial<EmployeeModel>): Observable<EmployeeModel> {
    return this.http.put<EmployeeModel>(`${this.apiUrl}/${id}`, employee);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  uploadAvatar(id: string, file: File): Observable<EmployeeModel> {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.http.post<EmployeeModel>(`${this.apiUrl}/${id}/avatar`, formData);
  }

  getHistory(id: string): Observable<EmployeeHistory[]> {
    return this.http.get<EmployeeHistory[]>(`${this.apiUrl}/${id}/history`);
  }
}
