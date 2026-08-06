import { TestBed } from '@angular/core/testing';
import { LanguageService } from './language.service';
import { provideTranslateService } from '@ngx-translate/core';
import { provideFormlyCore } from '@ngx-formly/core';

describe('LanguageService', () => {
  let service: LanguageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LanguageService,
        provideTranslateService(),
        provideFormlyCore(),
      ],
    });
    service = TestBed.inject(LanguageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
