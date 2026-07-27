import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table-skeleton',
  imports: [CommonModule],
  templateUrl: './table-skeleton.html',
  styleUrl: './table-skeleton.css',
})
export class TableSkeleton {
  @Input() rows = 5;
  @Input() columns = 4;

  get rowsArray(): number[] {
    return Array(this.rows).fill(0);
  }

  get columnsArray(): number[] {
    return Array(this.columns).fill(0);
  }
}