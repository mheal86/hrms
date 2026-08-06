import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardSummary } from '../models/dashboard-model';

@Injectable({
  providedIn: 'root',
})
export class Dashboard {
  apiUrl = `${environment.apiUrl}/dashboard`;
  public http = inject(HttpClient);

  getUrl(path?: string): string {
    return path ? `${this.apiUrl}/${path}` : this.apiUrl;
  }

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(this.getUrl('summary'));
  }
}
