import { TestBed } from '@angular/core/testing';
import { Notification } from './notification';
import { MessageService } from 'primeng/api';
import { provideTranslateService } from '@ngx-translate/core';

describe('Notification', () => {
  let service: Notification;
  let mockMessageService: jasmine.SpyObj<MessageService>;

  beforeEach(() => {
    mockMessageService = jasmine.createSpyObj('MessageService', ['add']);

    TestBed.configureTestingModule({
      providers: [
        Notification,
        { provide: MessageService, useValue: mockMessageService },
        provideTranslateService(),
      ]
    });
    service = TestBed.inject(Notification);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should call messageService.add with success severity, summary, and detail', () => {
    service.success('Operation succeeded');

    expect(mockMessageService.add).toHaveBeenCalledOnceWith({
      severity: 'success',
      summary: 'COMMON.SUCCESS',
      detail: 'Operation succeeded',
    });
  });

  it('should call messageService.add with error severity, summary, and detail', () => {
    service.error('Operation failed');

    expect(mockMessageService.add).toHaveBeenCalledOnceWith({
      severity: 'error',
      summary: 'COMMON.ERROR',
      detail: 'Operation failed',
    });
  });
});
