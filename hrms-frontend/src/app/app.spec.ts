import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';
import { MessageService, ConfirmationService } from 'primeng/api';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';

describe('App', () => {
  let fixture: ComponentFixture<App>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        MessageService,
        ConfirmationService,
        provideRouter([]),
        provideTranslateService(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(App);
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should render router-outlet, p-toast, and p-confirmdialog in template', () => {
    fixture.detectChanges();

    const routerOutlet = fixture.debugElement.query(By.css('router-outlet'));
    const toast = fixture.debugElement.query(By.css('p-toast'));
    const confirmDialog = fixture.debugElement.query(By.css('p-confirmdialog'));

    expect(routerOutlet).not.toBeNull();
    expect(toast).not.toBeNull();
    expect(confirmDialog).not.toBeNull();
  });
});
