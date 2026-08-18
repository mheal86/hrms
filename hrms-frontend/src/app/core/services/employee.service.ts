import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee as EmployeeModel, PaginatedResponse, EmployeeHistory } from '../models/employee-model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Employee {
  apiUrl = `${environment.apiUrl}/employees`;
  public http = inject(HttpClient);

  getUrl(id?: string): string {
    return id ? `${this.apiUrl}/${id}` : this.apiUrl;
  }

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

    return this.http.get<PaginatedResponse<EmployeeModel>>(this.getUrl(), { params });
  }

  getById(id: string): Observable<EmployeeModel> {
    return this.http.get<EmployeeModel>(this.getUrl(id));
  }

  create(employee: EmployeeModel): Observable<EmployeeModel> {
    return this.http.post<EmployeeModel>(this.getUrl(), employee);
  }

  update(id: string, employee: Partial<EmployeeModel>): Observable<EmployeeModel> {
    return this.http.put<EmployeeModel>(this.getUrl(id), employee);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(this.getUrl(id));
  }

  uploadAvatar(id: string, file: File): Observable<EmployeeModel> {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.http.post<EmployeeModel>(this.getUrl(`${id}/avatar`), formData);
  }

  getHistory(id: string): Observable<EmployeeHistory[]> {
    return this.http.get<EmployeeHistory[]>(this.getUrl(`${id}/history`));
  }

  importEmployees(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(this.getUrl('import'), formData);
  }
}
