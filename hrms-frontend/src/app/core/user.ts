import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CreateUserPayload {
  username: string;
  password: string;
  roleName: string;
  employeeId: string;
}

export interface UserAccountData {
  _id: string;
  username: string;
  role: { _id: string; name: string };
}

export interface UpdateUserPayload {
  username?: string;
  roleName?: string;
  newPassword?: string;
}

@Injectable({
  providedIn: 'root',
})
export class User {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  create(payload: CreateUserPayload): Observable<unknown> {
    return this.http.post(this.apiUrl, payload);
  }

  checkUsername(username: string): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(`${this.apiUrl}/check-username`, {
      params: { username },
    });
  }

  getByEmployeeId(employeeId: string): Observable<UserAccountData> {
    return this.http.get<UserAccountData>(`${this.apiUrl}/by-employee/${employeeId}`);
  }

  update(userId: string, payload: UpdateUserPayload): Observable<unknown> {
    return this.http.put(`${this.apiUrl}/${userId}`, payload);
  }
}
