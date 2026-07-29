import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { Breadcrumb as PrimeBreadcrumb } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';

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
  imports: [CommonModule, PrimeBreadcrumb],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.css',
})
export class Breadcrumb implements OnInit, OnDestroy {
  items = signal<MenuItem[]>([]);
  
  // destroy$ đóng vai trò như một "công tắc điều khiển từ xa" để báo tín hiệu hủy đăng ký
  private destroy$ = new Subject<void>();

  constructor(private router: Router) {}

  ngOnInit() {
    this.buildBreadcrumb(this.router.url);

    // Lắng nghe sự kiện chuyển trang của router
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        // takeUntil: Nói với RxJS "chỉ hứng sự kiện CHO ĐẾN KHI nút destroy$ phát tín hiệu"
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        this.buildBreadcrumb((event as NavigationEnd).urlAfterRedirects);
      });
  }

  // ngOnDestroy: Vòng đời tự động chạy khi component bị hủy (người dùng rời trang)
  ngOnDestroy() {
    this.destroy$.next(); // Bấm công tắc: phát đi tín hiệu hủy đăng ký cho tất cả các subscribe có dùng takeUntil
    this.destroy$.complete(); // Đóng hoàn toàn luồng tín hiệu hủy để giải phóng RAM
  }

  private buildBreadcrumb(url: string) {
    const cleanUrl = url.split('?')[0];
    const segments = cleanUrl.split('/').filter((s) => s && !this.isLikelyId(s));

    const items: MenuItem[] = [];
    let path = '';

    segments.forEach((segment) => {
      path += `/${segment}`;
      items.push({
        label: LABEL_MAP[segment] || segment,
        routerLink: path,
      });
    });

    this.items.set(items);
  }

  private isLikelyId(segment: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(segment);
  }
}