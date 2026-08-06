import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideTranslateService } from '@ngx-translate/core';
import { CustomTitleStrategy } from './custom-title-strategy';

describe('CustomTitleStrategy', () => {
  let strategy: CustomTitleStrategy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CustomTitleStrategy,
        Title,
        provideTranslateService(),
      ],
    });
    strategy = TestBed.inject(CustomTitleStrategy);
  });

  it('should be created', () => {
    expect(strategy).toBeTruthy();
  });
});
