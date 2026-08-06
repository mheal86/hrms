import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Skeleton } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-table-skeleton',
  imports: [CommonModule, Skeleton, TableModule],
  templateUrl: './table-skeleton.html',
  styleUrl: './table-skeleton.scss',
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
