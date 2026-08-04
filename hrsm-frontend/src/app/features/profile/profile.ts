import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ProfileData {
  _id: string;
  username: string;
  role: { _id: string; name: string };
  employee: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    position?: string;
    avatarUrl?: string;
    status?: string;
    deactivatedDate?: string;
    department?: { _id: string; name: string };
  } | null;
}

export interface UpdateProfilePayload {
  phone?: string;
  address?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Profile {
  private apiUrl = `${environment.apiUrl}/profile`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<ProfileData> {
    return this.http.get<ProfileData>(this.apiUrl);
  }

  updateProfile(data: UpdateProfilePayload): Observable<unknown> {
    return this.http.put(this.apiUrl, data);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<unknown> {
    return this.http.put(`${this.apiUrl}/change-password`, { currentPassword, newPassword });
  }
}
