import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProfileData, UpdateProfilePayload } from '../models/profile-model';

@Injectable({
  providedIn: 'root',
})
export class Profile {
  apiUrl = `${environment.apiUrl}/profile`;

  constructor(public http: HttpClient) {}

  getUrl(path?: string): string {
    return path ? `${this.apiUrl}/${path}` : this.apiUrl;
  }

  getProfile(): Observable<ProfileData> {
    return this.http.get<ProfileData>(this.getUrl());
  }

  updateProfile(data: UpdateProfilePayload): Observable<{ success?: boolean }> {
    return this.http.put<{ success?: boolean }>(this.getUrl(), data);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ success?: boolean; message?: string }> {
    return this.http.put<{ success?: boolean; message?: string }>(this.getUrl('change-password'), { currentPassword, newPassword });
  }
}
