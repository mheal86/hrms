import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Department as DepartmentModel } from '../models/department-model';
import { PaginatedResponse } from '../models/pagination-model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Department {
  apiUrl = `${environment.apiUrl}/departments`;
  public http = inject(HttpClient);

  getUrl(id?: string): string {
    return id ? `${this.apiUrl}/${id}` : this.apiUrl;
  }

  getAll(
    search: string = '',
    page: number = 1,
    limit: number = 10,
  ): Observable<PaginatedResponse<DepartmentModel>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<PaginatedResponse<DepartmentModel>>(this.getUrl(), { params });
  }

  getAllUnpaginated(): Observable<DepartmentModel[]> {
    const params = new HttpParams().set('limit', 1000).set('page', 1);
    return this.http
      .get<PaginatedResponse<DepartmentModel>>(this.getUrl(), { params })
      .pipe(map((res) => res.data));
  }

  getById(id: string): Observable<DepartmentModel> {
    return this.http.get<DepartmentModel>(this.getUrl(id));
  }

  create(department: Partial<DepartmentModel>): Observable<DepartmentModel> {
    return this.http.post<DepartmentModel>(this.getUrl(), department);
  }

  update(id: string, department: Partial<DepartmentModel>): Observable<DepartmentModel> {
    return this.http.put<DepartmentModel>(this.getUrl(id), department);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(this.getUrl(id));
  }
}
