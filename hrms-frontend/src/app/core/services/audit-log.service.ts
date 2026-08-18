import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuditLog } from '../models/audit-log-model';
import { PaginatedResponse } from '../models/pagination-model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuditLogService {
  apiUrl = `${environment.apiUrl}/audit-logs`;
  private http = inject(HttpClient);

  getAll(
    paramsObj: {
      search?: string;
      userId?: string;
      action?: string;
      startDate?: string;
      endDate?: string;
      targetId?: string;
      page?: number;
      limit?: number;
      sort?: string;
      order?: string;
    } = {}
  ): Observable<PaginatedResponse<AuditLog>> {
    let params = new HttpParams();

    if (paramsObj.page) params = params.set('page', paramsObj.page);
    if (paramsObj.limit) params = params.set('limit', paramsObj.limit);
    if (paramsObj.sort) params = params.set('sort', paramsObj.sort);
    if (paramsObj.order) params = params.set('order', paramsObj.order);
    if (paramsObj.search) params = params.set('search', paramsObj.search);
    if (paramsObj.userId) params = params.set('userId', paramsObj.userId);
    if (paramsObj.action) params = params.set('action', paramsObj.action);
    if (paramsObj.targetId) params = params.set('targetId', paramsObj.targetId);
    if (paramsObj.startDate) params = params.set('startDate', paramsObj.startDate);
    if (paramsObj.endDate) params = params.set('endDate', paramsObj.endDate);

    return this.http.get<PaginatedResponse<AuditLog>>(this.apiUrl, { params });
  }

  getActions(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/actions`);
  }

  getUsers(): Observable<{ _id: string; username: string }[]> {
    return this.http.get<{ _id: string; username: string }[]>(`${this.apiUrl}/users`);
  }
}
