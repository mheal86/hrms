import { TestBed } from '@angular/core/testing';
import { Confirm } from './confirm';
import { ConfirmationService, Confirmation } from 'primeng/api';
import { provideTranslateService } from '@ngx-translate/core';

describe('Confirm', () => {
  let service: Confirm;
  let confirmationServiceMock: jasmine.SpyObj<ConfirmationService>;

  beforeEach(() => {
    confirmationServiceMock = jasmine.createSpyObj<ConfirmationService>('ConfirmationService', ['confirm']);

    TestBed.configureTestingModule({
      providers: [
        Confirm,
        { provide: ConfirmationService, useValue: confirmationServiceMock },
        provideTranslateService(),
      ]
    });
    service = TestBed.inject(Confirm);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should resolve to true when confirmation is accepted', async () => {
    confirmationServiceMock.confirm.and.callFake((options: Confirmation) => {
      options.accept?.();
      return confirmationServiceMock;
    });

    const result = await service.ask('Are you sure?');

    expect(result).toBe(true);
    expect(confirmationServiceMock.confirm).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({ message: 'Are you sure?' })
    );
  });

  it('should resolve to false when confirmation is rejected', async () => {
    confirmationServiceMock.confirm.and.callFake((options: Confirmation) => {
      options.reject?.();
      return confirmationServiceMock;
    });

    const result = await service.ask('Are you sure?');

    expect(result).toBe(false);
    expect(confirmationServiceMock.confirm).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({ message: 'Are you sure?' })
    );
  });
});
