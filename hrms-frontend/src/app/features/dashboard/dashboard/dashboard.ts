import { Component, OnInit, OnDestroy, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Dashboard as DashboardService } from '../../../core/services/dashboard.service';
import { DashboardSummary } from '../../../core/models/dashboard-model';
import { Employee } from '../../../core/services/employee.service';
import { Employee as EmployeeModel } from '../../../core/models/employee-model';
import { Chart, registerables, ChartData, ChartOptions, Plugin, TooltipItem } from 'chart.js';
import { Spinner } from '../../../shared/spinner/spinner';
import { Auth } from '../../../core/services/auth';
import { finalize, Subject, takeUntil } from 'rxjs';
import { UIChart } from 'primeng/chart';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';
import { LanguageService } from '../../../core/services/language.service';
import { getInitials } from '../../../core/utils/employee-utils';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, Spinner, RouterLink, UIChart, Button, TableModule, TranslatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
  getInitials = getInitials;
  baseUrl = environment.baseUrl;
  summary = signal<DashboardSummary | undefined>(undefined);
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

  get statCards() {
    return [
      {
        icon: 'pi pi-users',
        iconClass: 'bg-primary-soft',
        label: 'DASHBOARD.EMPLOYEES_CARD',
        active: this.displayActiveEmployees(),
        total: this.displayTotalEmployees(),
        hasSubValue: true,
      },
      {
        icon: 'pi pi-building',
        iconClass: 'bg-info-soft',
        label: 'DASHBOARD.DEPARTMENTS_CARD',
        value: this.displayTotalDepartments(),
        hasSubValue: false,
      },
      {
        icon: 'pi pi-user',
        iconClass: 'bg-warning-soft',
        label: 'DASHBOARD.ACCOUNTS_CARD',
        value: this.displayTotalUsers(),
        hasSubValue: false,
      },
    ];
  }

  chartData = signal<ChartData<'doughnut'> | undefined>(undefined);
  chartOptions = signal<ChartOptions<'doughnut'> | undefined>(undefined);
  chartColors = signal<string[]>([]);
  chartPlugins: Plugin[] = [];

  destroy$ = new Subject<void>();

  constructor(
    public dashboardService: DashboardService,
    public employeeService: Employee,
    public authService: Auth,
    public translate: TranslateService,
    public languageService: LanguageService,
  ) { }

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
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (data) => {
          this.summary.set(data);
          this.updateChart(data);
          this.animateCountUp(this.displayTotalEmployees, data.totalEmployees);
          this.animateCountUp(this.displayActiveEmployees, data.activeEmployees);
          this.animateCountUp(this.displayTotalDepartments, data.totalDepartments);
          this.animateCountUp(this.displayTotalUsers, data.totalUsers);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || this.translate.instant('DEPARTMENT.LOAD_ERROR'));
        },
      });
  }

  animateCountUp(target: ReturnType<typeof signal<number>>, endValue: number) {
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
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingRecent.set(false)),
      )
      .subscribe({
        next: (res) => {
          this.recentEmployees.set(res.data);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || this.translate.instant('EMPLOYEE.LOAD_ERROR'));
        },
      });
  }

  @HostListener('window:themeChanged')
  onThemeChanged() {
    const currentSummary = this.summary();
    if (currentSummary) {
      this.updateChart(currentSummary);
    }
  }

  updateChart(data: DashboardSummary) {
    const isDark = document.body.classList.contains('dark-theme');
    const rootStyle = getComputedStyle(document.documentElement);

    const colors: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const val = rootStyle.getPropertyValue(`--chart-${i}`).trim();
      colors.push(val || (isDark ? '#818cf8' : '#4f46e5'));
    }

    const chartData = data.employeesByDepartment;
    const totalEmployeesCount = data.activeEmployees;
    const backgroundColors = chartData.map((_item: { departmentName: string; lastMonthCount: number; thisMonthCount: number; totalCount: number }, i: number) => colors[i % colors.length]);
    this.chartColors.set(backgroundColors);

    this.chartData.set({
      labels: chartData.map((d: { departmentName: string; lastMonthCount: number; thisMonthCount: number; totalCount: number }) =>
        this.languageService.getDepartmentName(d.departmentName)
      ),
      datasets: [
        {
          label: this.translate.instant('SIDEBAR.EMPLOYEES'),
          data: chartData.map((d: { departmentName: string; lastMonthCount: number; thisMonthCount: number; totalCount: number }) => d.totalCount),
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
            label: (context: TooltipItem<'doughnut'>) => {
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
        ctx.fillText(totalEmployeesCount.toString(), centerX, centerY + 18);
        ctx.restore();
      },
    };
    this.chartPlugins = [centerTextPlugin];
  }
}
