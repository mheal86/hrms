import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map, merge, of, Subject, takeUntil } from 'rxjs';
import { Breadcrumb as PrimeBreadcrumb } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';

const LABEL_MAP: Record<string, string> = {
  dashboard: 'SIDEBAR.DASHBOARD',
  departments: 'SIDEBAR.DEPARTMENTS',
  employees: 'SIDEBAR.EMPLOYEES',
  profile: 'SIDEBAR.PROFILE',
  'audit-logs': 'SIDEBAR.AUDIT_LOGS',
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
  router = inject(Router);
  translate = inject(TranslateService);

  items = signal<MenuItem[]>([]);

  destroy$ = new Subject<void>();

  ngOnInit() {
    this.listenToRouteChanges();
  }

  listenToRouteChanges() {
    merge(
      of(this.router.url),
      this.router.events.pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        map((event) => event.urlAfterRedirects),
      ),
      this.translate.onLangChange.pipe(map(() => this.router.url)),
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(this.buildBreadcrumb);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  buildBreadcrumb = (url: string) => {
    const cleanUrl = url.split('?')[0];
    const rawSegments = cleanUrl.split('/').filter(Boolean);
    const hasId = rawSegments.some((s) => this.isLikelyId(s));
    const segments = rawSegments.filter((s) => !this.isLikelyId(s));

    let path = '';
    const items: MenuItem[] = segments.map((segment) => {
      path += `/${segment}`;
      const translationKey = LABEL_MAP[segment];
      return {
        label: translationKey ? this.translate.instant(translationKey) : segment,
        routerLink: path,
      };
    });

    if (hasId && !rawSegments.includes('edit')) {
      items.push({
        label: this.translate.instant('COMMON.DETAILS'),
      });
    }

    this.items.set(items);
  };

  isLikelyId(segment: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(segment);
  }
}
