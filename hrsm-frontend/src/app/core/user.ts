import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private apiUrl = 'http://localhost:5000/api/users';

  constructor(private http: HttpClient) {}

  create(payload: CreateUserPayload): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }

  checkUsername(username: string): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(`${this.apiUrl}/check-username`, {
      params: { username }
    });
  }

  getByEmployeeId(employeeId: string): Observable<UserAccountData> {
    return this.http.get<UserAccountData>(`${this.apiUrl}/by-employee/${employeeId}`);
  }

  update(userId: string, payload: UpdateUserPayload): Observable<any> {
    return this.http.put(`${this.apiUrl}/${userId}`, payload);
  }
}