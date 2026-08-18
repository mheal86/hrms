import { TestBed } from '@angular/core/testing';
import { SidebarState } from './sidebar-state';

describe('SidebarState', () => {
  let service: SidebarState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SidebarState);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('toggle', () => {
    it('should toggle isOpen state to true then false', () => {
      expect(service.isOpen()).toBe(false);
      
      service.toggle();
      expect(service.isOpen()).toBe(true);
      
      service.toggle();
      expect(service.isOpen()).toBe(false);
    });
  });

  describe('close', () => {
    it('should set isOpen to false', () => {
      service.isOpen.set(true);
      
      service.close();
      
      expect(service.isOpen()).toBe(false);
    });
  });

  describe('toggleDesktop', () => {
    it('should toggle isDesktopCollapsed state to true then false', () => {
      expect(service.isDesktopCollapsed()).toBe(false);
      
      service.toggleDesktop();
      expect(service.isDesktopCollapsed()).toBe(true);
      
      service.toggleDesktop();
      expect(service.isDesktopCollapsed()).toBe(false);
    });
  });
});
