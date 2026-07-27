import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

interface BreadcrumbItem {
  label: string;
  url: string;
}

const LABEL_MAP: Record<string, string> = {
  dashboard: 'Trang chủ',
  departments: 'Phòng ban',
  employees: 'Nhân viên',
  profile: 'Hồ sơ cá nhân',
  new: 'Thêm mới',
  edit: 'Sửa',
};

@Component({
  selector: 'app-breadcrumb',
  imports: [CommonModule, RouterLink],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.css',
})
export class Breadcrumb implements OnInit {
  items = signal<BreadcrumbItem[]>([]);

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.buildBreadcrumb(this.router.url);

    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      this.buildBreadcrumb((event as NavigationEnd).urlAfterRedirects);
    });
  }

  private buildBreadcrumb(url: string): void {
    const cleanUrl = url.split('?')[0];
    const segments = cleanUrl.split('/').filter((s) => s && !this.isLikelyId(s));

    const items: BreadcrumbItem[] = [];
    let path = '';

    segments.forEach((segment) => {
      path += `/${segment}`;
      items.push({
        label: LABEL_MAP[segment] || segment,
        url: path,
      });
    });

    this.items.set(items);
  }

  private isLikelyId(segment: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(segment);
  }
}