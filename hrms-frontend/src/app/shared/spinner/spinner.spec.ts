import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Spinner } from './spinner';
import { By } from '@angular/platform-browser';

describe('Spinner', () => {
  let fixture: ComponentFixture<Spinner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Spinner],
    }).compileComponents();
    fixture = TestBed.createComponent(Spinner);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should render spinner-wrapper and p-progressspinner in DOM', () => {
    const wrapper = fixture.debugElement.query(By.css('.spinner-wrapper'));
    const spinner = fixture.debugElement.query(By.css('p-progressspinner'));

    expect(wrapper).not.toBeNull();
    expect(spinner).not.toBeNull();
  });
});
