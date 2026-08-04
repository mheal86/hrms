import { Component, OnInit, OnDestroy, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Dashboard as DashboardService, DashboardSummary } from '../dashboard';
import { Employee } from '../../employee/employee';
import { Employee as EmployeeModel } from '../../employee/employee-model';
import { Chart, registerables, ChartData, ChartOptions, Plugin } from 'chart.js';
import { Spinner } from '../../../shared/spinner/spinner';
import { Auth } from '../../../core/auth';
import { Subject, takeUntil } from 'rxjs';
import { UIChart } from 'primeng/chart';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, Spinner, RouterLink, UIChart, Button, TableModule, TranslatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
  baseUrl = environment.baseUrl;
  summary = signal<DashboardSummary | null>(null);
  isLoading = signal(false);
  errorMessage = signal('');
  cols = [
    { field: 'departmentName', header: 'DASHBOARD.COL_DEPT' },
    { field: 'lastMonthCount', header: 'DASHBOARD.COL_LAST_MONTH' },
    { field: 'thisMonthCount', header: 'DASHBOARD.COL_THIS_MONTH' },
  ];
  recentCols = [
    { field: 'fullName', header: 'DASHBOARD.COL_FULL_NAME' },
    { field: 'email', header: 'DASHBOARD.COL_EMAIL' },
    { field: 'department', header: 'DASHBOARD.COL_DEPT' },
    { field: 'status', header: 'DASHBOARD.COL_STATUS' },
  ];

  recentEmployees = signal<EmployeeModel[]>([]);
  isLoadingRecent = signal(false);

  displayTotalEmployees = signal(0);
  displayActiveEmployees = signal(0);
  displayTotalDepartments = signal(0);
  displayTotalUsers = signal(0);

  chartData = signal<ChartData<'doughnut'> | null>(null);
  chartOptions = signal<ChartOptions<'doughnut'> | null>(null);
  chartColors = signal<string[]>([]);
  chartPlugins: Plugin[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private employeeService: Employee,
    public authService: Auth,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const currentSummary = this.summary();
      if (currentSummary) {
        this.updateChart(currentSummary);
      }
    });

    this.loadSummary();
    this.loadRecentEmployees();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSummary() {
    this.isLoading.set(true);
    this.dashboardService
      .getSummary()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.summary.set(data);
          this.isLoading.set(false);
          this.updateChart(data);

          this.animateCountUp(this.displayTotalEmployees, data.totalEmployees);
          this.animateCountUp(this.displayActiveEmployees, data.activeEmployees);
          this.animateCountUp(this.displayTotalDepartments, data.totalDepartments);
          this.animateCountUp(this.displayTotalUsers, data.totalUsers);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Không tải được dữ liệu');
          this.isLoading.set(false);
        },
      });
  }

  private animateCountUp(target: ReturnType<typeof signal<number>>, endValue: number) {
    const duration = 800; // ms
    const startTime = performance.now();

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuad: chậm dần về cuối, trông tự nhiên hơn tuyến tính
      const eased = 1 - (1 - progress) * (1 - progress);
      const currentValue = Math.round(eased * endValue);

      target.set(currentValue);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        target.set(endValue); // đảm bảo giá trị cuối chính xác tuyệt đối
      }
    };

    requestAnimationFrame(step);
  }

  loadRecentEmployees() {
    this.isLoadingRecent.set(true);
    this.employeeService
      .getAll(1, 5, '', 'createdAt', 'desc')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.recentEmployees.set(res.data);
          this.isLoadingRecent.set(false);
        },
        error: () => {
          this.isLoadingRecent.set(false);
        },
      });
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }

  getDepartmentName(dept: any): string {
    const fallback = this.translate.instant('COMMON.UNASSIGNED');
    if (!dept) return fallback;
    const name = typeof dept === 'object' ? dept.name || fallback : dept;
    const mapping: { [key: string]: string } = {
      'Phòng Nhân sự': 'DEPARTMENTS_LIST.HR',
      'Phòng Công nghệ thông tin': 'DEPARTMENTS_LIST.TECH',
      'Phòng Kế toán': 'DEPARTMENTS_LIST.FINANCE',
      'Phòng Marketing': 'DEPARTMENTS_LIST.MARKETING',
      'Phòng Kinh doanh': 'DEPARTMENTS_LIST.SALES',
      'Phòng Hành chính': 'DEPARTMENTS_LIST.ADMIN',
      'Phòng Nghiên cứu & Phát triển': 'DEPARTMENTS_LIST.RD',
      'Phòng R&D': 'DEPARTMENTS_LIST.RD',
      'Phòng Quản lý dự án': 'DEPARTMENTS_LIST.PROJECT',
      'Phòng Chăm sóc khách hàng': 'DEPARTMENTS_LIST.CUSTOMER_SERVICE',
      'Phòng Pháp chế': 'DEPARTMENTS_LIST.LEGAL',
      'Phòng Thiết kế': 'DEPARTMENTS_LIST.DESIGN',
      'Phòng Đào tạo': 'DEPARTMENTS_LIST.TRAINING',
    };
    const translationKey = mapping[name];
    if (translationKey) {
      const translated = this.translate.instant(translationKey);
      return translated !== translationKey ? translated : name;
    }
    return name;
  }

  @HostListener('window:themeChanged')
  onThemeChanged() {
    const currentSummary = this.summary();
    if (currentSummary) {
      this.updateChart(currentSummary);
    }
  }

  private updateChart(data: DashboardSummary) {
    const isDark = document.body.classList.contains('dark-theme');
    const rootStyle = getComputedStyle(document.documentElement);
    const textColor = isDark ? '#ffffff' : '#334155';

    const colors: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const val = rootStyle.getPropertyValue(`--chart-${i}`).trim();
      colors.push(val || (isDark ? '#818cf8' : '#4f46e5'));
    }

    const chartData = data.employeesByDepartment;
    const activeEmployeesTotal = data.activeEmployees;
    const backgroundColors = chartData.map((_, i) => colors[i % colors.length]);
    this.chartColors.set(backgroundColors);

    this.chartData.set({
      labels: chartData.map((d) => this.getDepartmentName(d.departmentName)),
      datasets: [
        {
          label: this.translate.instant('SIDEBAR.EMPLOYEES'),
          data: chartData.map((d) => d.thisMonthCount),
          backgroundColor: backgroundColors,
          borderColor: isDark ? '#1e293b' : '#ffffff',
          borderWidth: 3,
          hoverOffset: 10,
        },
      ],
    });

    this.chartOptions.set({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '55%',
      animation: {
        animateScale: true,
        animateRotate: true,
        duration: 1200,
        easing: 'easeOutQuart',
      },
      layout: {
        padding: {
          right: 10,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          titleColor: isDark ? '#f1f5f9' : '#0f172a',
          bodyColor: isDark ? '#cbd5e1' : '#334155',
          borderColor: isDark ? '#334155' : '#e2e8f0',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: (context: { label: string; raw: unknown }) => {
              const value = (context.raw as number) || 0;
              const empLabel = this.translate.instant('SIDEBAR.EMPLOYEES');
              return ` ${context.label}: ${value} ${empLabel}`;
            },
          },
        },
      },
    });

    const centerTextPlugin: Plugin = {
      id: 'centerText',
      beforeDraw: (chart: Chart) => {
        if (!chart.chartArea) return;
        const { ctx } = chart;
        ctx.save();

        const isDarkTheme = document.body.classList.contains('dark-theme');
        const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
        const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.font = "600 15px 'Inter', sans-serif";
        ctx.fillStyle = isDarkTheme ? '#94a3b8' : '#64748b';
        ctx.fillText(
          this.translate.instant('SIDEBAR.EMPLOYEES').toUpperCase(),
          centerX,
          centerY - 18,
        );

        ctx.font = "bold 36px 'Inter', sans-serif";
        ctx.fillStyle = isDarkTheme ? '#ffffff' : '#0f172a';
        ctx.fillText(activeEmployeesTotal.toString(), centerX, centerY + 18);
        ctx.restore();
      },
    };

    this.chartPlugins = [centerTextPlugin];
  }
}
