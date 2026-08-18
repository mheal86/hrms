import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Forbidden } from './forbidden';
import { provideTranslateService } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';

describe('Forbidden', () => {
  let fixture: ComponentFixture<Forbidden>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Forbidden],
      providers: [
        provideTranslateService(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Forbidden);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should render 403 header and show translation messages in DOM', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.forbidden-code')?.textContent).toBe('403');
    expect(compiled.querySelector('h1')?.textContent).toBe('FORBIDDEN.TITLE');
    expect(compiled.querySelector('p')?.textContent).toBe('FORBIDDEN.MESSAGE');
  });
});
