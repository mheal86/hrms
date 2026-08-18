import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableSkeleton } from './table-skeleton';
import { By } from '@angular/platform-browser';

describe('TableSkeleton', () => {
  let component: TableSkeleton;
  let fixture: ComponentFixture<TableSkeleton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableSkeleton],
    }).compileComponents();

    fixture = TestBed.createComponent(TableSkeleton);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should compute rows and columns arrays correctly and render table container', () => {
    component.rows = 3;
    component.columns = 2;
    fixture.detectChanges();

    // Verify getters computed correctly
    expect(component.rowsArray.length).toBe(3);
    expect(component.columnsArray.length).toBe(2);

    // Verify table element renders in template
    const table = fixture.debugElement.query(By.css('p-table'));
    expect(table).not.toBeNull();
  });
});
