import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { Breadcrumb as PrimeBreadcrumb } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';

const LABEL_MAP: Record<string, string> = {
  dashboard: 'SIDEBAR.DASHBOARD',
  departments: 'SIDEBAR.DEPARTMENTS',
  employees: 'SIDEBAR.EMPLOYEES',
  profile: 'SIDEBAR.PROFILE',
  new: 'COMMON.ADD',
  edit: 'COMMON.EDIT',
};

@Component({
  selector: 'app-breadcrumb',
  imports: [CommonModule, PrimeBreadcrumb],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.scss',
})
export class Breadcrumb implements OnInit, OnDestroy {
  items = signal<MenuItem[]>([]);

  // destroy$ đóng vai trò như một "công tắc điều khiển từ xa" để báo tín hiệu hủy đăng ký
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.buildBreadcrumb(this.router.url);
    });

    this.buildBreadcrumb(this.router.url);

    // Lắng nghe sự kiện chuyển trang của router
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        // takeUntil: Nói với RxJS "chỉ hứng sự kiện CHO ĐẾN KHI nút destroy$ phát tín hiệu"
        takeUntil(this.destroy$),
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
      const translationKey = LABEL_MAP[segment];
      items.push({
        label: translationKey ? this.translate.instant(translationKey) : segment,
        routerLink: path,
      });
    });

    this.items.set(items);
  }

  private isLikelyId(segment: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(segment);
  }
}
