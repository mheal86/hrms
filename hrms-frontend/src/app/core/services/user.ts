import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateUserPayload, UserAccountData, UpdateUserPayload } from '../models/user-model';

@Injectable({
  providedIn: 'root',
})
export class User {
  apiUrl = `${environment.apiUrl}/users`;

  constructor(public http: HttpClient) {}

  getUrl(path?: string): string {
    return path ? `${this.apiUrl}/${path}` : this.apiUrl;
  }

  create(payload: CreateUserPayload): Observable<unknown> {
    return this.http.post(this.getUrl(), payload);
  }

  checkUsername(username: string): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(this.getUrl('check-username'), {
      params: { username },
    });
  }

  getByEmployeeId(employeeId: string): Observable<UserAccountData> {
    return this.http.get<UserAccountData>(this.getUrl(`by-employee/${employeeId}`));
  }

  update(userId: string, payload: UpdateUserPayload): Observable<unknown> {
    return this.http.put(this.getUrl(userId), payload);
  }
}
