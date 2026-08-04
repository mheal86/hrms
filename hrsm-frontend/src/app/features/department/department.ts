import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Department as DepartmentModel, DepartmentPaginatedResponse } from './department-model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Department {
  private apiUrl = `${environment.apiUrl}/departments`;

  constructor(private http: HttpClient) {}

  getAll(
    search: string = '',
    page: number = 1,
    limit: number = 10,
  ): Observable<DepartmentPaginatedResponse> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<DepartmentPaginatedResponse>(this.apiUrl, { params });
  }

  getAllUnpaginated(): Observable<DepartmentModel[]> {
    const params = new HttpParams().set('limit', 1000).set('page', 1);
    return this.http
      .get<DepartmentPaginatedResponse>(this.apiUrl, { params })
      .pipe(map((res) => res.data));
  }

  getById(id: string): Observable<DepartmentModel> {
    return this.http.get<DepartmentModel>(`${this.apiUrl}/${id}`);
  }

  create(department: Partial<DepartmentModel>): Observable<DepartmentModel> {
    return this.http.post<DepartmentModel>(this.apiUrl, department);
  }

  update(id: string, department: Partial<DepartmentModel>): Observable<DepartmentModel> {
    return this.http.put<DepartmentModel>(`${this.apiUrl}/${id}`, department);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
