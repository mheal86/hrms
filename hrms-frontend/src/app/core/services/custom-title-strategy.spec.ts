import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { CustomTitleStrategy } from './custom-title-strategy';
import { of } from 'rxjs';

describe('CustomTitleStrategy', () => {
  let strategy: CustomTitleStrategy;
  let titleService: Title;
  let translateService: TranslateService;
  let titleSpy: jasmine.Spy;

  const MOCK_ROUTER_STATE = {} as Partial<RouterStateSnapshot> & RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CustomTitleStrategy,
        Title,
        provideTranslateService(),
      ],
    });
    strategy = TestBed.inject(CustomTitleStrategy);
    titleService = TestBed.inject(Title);
    translateService = TestBed.inject(TranslateService);
    titleSpy = spyOn(titleService, 'setTitle').and.callThrough();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should set title to "Translated Title - HRMS" when titleKey is present', () => {
    spyOn(strategy, 'buildTitle').and.returnValue('TEST_TITLE');
    spyOn(translateService, 'get').and.returnValue(of('Translated Title'));

    strategy.updateTitle(MOCK_ROUTER_STATE);

    expect(titleSpy).toHaveBeenCalledWith('Translated Title - HRMS');
    expect(strategy.lastState).toBe(MOCK_ROUTER_STATE);
  });

  it('should set title to "HRMS" when titleKey is absent', () => {
    spyOn(strategy, 'buildTitle').and.returnValue('');

    strategy.updateTitle(MOCK_ROUTER_STATE);

    expect(titleSpy).toHaveBeenCalledWith('HRMS');
    expect(strategy.lastState).toBe(MOCK_ROUTER_STATE);
  });

  it('should update title on language change when lastState is set', () => {
    spyOn(strategy, 'buildTitle').and.returnValue('TEST_TITLE');
    spyOn(translateService, 'get').and.returnValue(of('French Title'));

    strategy.updateTitle(MOCK_ROUTER_STATE);
    translateService.use('fr');

    expect(titleSpy).toHaveBeenCalledWith('French Title - HRMS');
  });

  it('should not update title on language change when lastState is not set', () => {
    const updateSpy = spyOn(strategy, 'updateTitle').and.callThrough();

    strategy.translate;
    translateService.use('fr');

    expect(updateSpy).not.toHaveBeenCalled();
  });
});
