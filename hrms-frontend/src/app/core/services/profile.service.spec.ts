import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Profile } from './profile.service';
import { environment } from '../../../environments/environment';
import type { ProfileData, UpdateProfilePayload } from '../models/profile-model';
import { provideHttpClient } from '@angular/common/http';

describe('ProfileService', () => {
  let service: Profile;
  let httpMock: HttpTestingController;

  const MOCK_PROFILE_DATA: ProfileData = {
    _id: 'p1',
    username: 'john',
    role: { _id: 'r1', name: 'USER' },
    employee: null
  };

  const MOCK_UPDATE_PAYLOAD: UpdateProfilePayload = { phone: '1234567890', address: '123 St' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        Profile,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(Profile);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  describe('getUrl', () => {
    it('should build the correct base URL when no path is provided', () => {
      expect(service.getUrl()).toBe(`${environment.apiUrl}/profile`);
    });

    it('should append the path to the base URL when a path is provided', () => {
      expect(service.getUrl('change-password')).toBe(`${environment.apiUrl}/profile/change-password`);
    });
  });

  describe('getProfile', () => {
    it('should fetch profile details via GET', () => {
      service.getProfile().subscribe((res) => {
        expect(res).toEqual(MOCK_PROFILE_DATA);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/profile`);
      expect(req.request.method).toBe('GET');
      req.flush(MOCK_PROFILE_DATA);
    });
  });

  describe('updateProfile', () => {
    it('should update profile via PUT and return the response object', () => {
      const expectedResponse = { success: true };

      service.updateProfile(MOCK_UPDATE_PAYLOAD).subscribe((res) => {
        expect(res).toEqual(expectedResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/profile`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(MOCK_UPDATE_PAYLOAD);
      req.flush(expectedResponse);
    });
  });

  describe('changePassword', () => {
    it('should change password via PUT and return the response object', () => {
      const expectedResponse = { success: true };

      service.changePassword('old', 'new').subscribe((res) => {
        expect(res).toEqual(expectedResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/profile/change-password`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ currentPassword: 'old', newPassword: 'new' });
      req.flush(expectedResponse);
    });
  });
});
