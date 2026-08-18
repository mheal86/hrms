import { TestBed } from '@angular/core/testing';
import { getInitials } from './employee-utils';

describe('employee-utils', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('getInitials', () => {
    it('should return initials from first name and last name', () => {
      expect(getInitials('John', 'Doe')).toBe('JD');
      expect(getInitials('john', 'doe')).toBe('JD');
    });

    it('should return initial from first name only if last name is missing', () => {
      expect(getInitials('John', '')).toBe('J');
      expect(getInitials('', 'Doe')).toBe('D');
    });

    it('should fall back to username initial if names are missing', () => {
      expect(getInitials('', '', 'admin')).toBe('A');
    });

    it('should return "?" if all names and username are missing', () => {
      expect(getInitials()).toBe('?');
      expect(getInitials('', '', '')).toBe('?');
    });
  });
});
