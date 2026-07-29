import { Component, OnInit, OnDestroy, signal, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Dashboard as DashboardService, DashboardSummary } from '../dashboard';
import { Employee } from '../../employee/employee';
import { Employee as EmployeeModel } from '../../employee/employee-model';
import { Chart, registerables } from 'chart.js';
import { Spinner } from '../../../shared/spinner/spinner';
import { Auth } from '../../../core/auth';
import { Subject, takeUntil } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, Spinner, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {
  summary = signal<DashboardSummary | null>(null);
  isLoading = signal(false);
  errorMessage = signal('');

  recentEmployees = signal<EmployeeModel[]>([]);
  isLoadingRecent = signal(false);

  // Giá trị hiển thị trên UI, sẽ tự tăng dần từ 0 tới giá trị thật
  displayTotalEmployees = signal(0);
  displayActiveEmployees = signal(0);
  displayTotalDepartments = signal(0);
  displayTotalUsers = signal(0);

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chartInstance: Chart | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private employeeService: Employee,
    public authService: Auth
  ) { }

  ngOnInit() {
    this.loadSummary();
    this.loadRecentEmployees();
  }

  ngAfterViewInit() {
    // Canvas đã sẵn sàng trong DOM, nhưng lúc này data có thể chưa về kịp
    // nên việc vẽ chart thực sự được gọi trong loadSummary() sau khi có data
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
          setTimeout(() => this.renderChart(data), 150);

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
    if (!dept) return 'Chưa phân phòng';
    return typeof dept === 'object' ? (dept.name || 'Chưa phân phòng') : dept;
  }

  @HostListener('window:themeChanged')
  onThemeChanged() {
    const currentSummary = this.summary();
    if (currentSummary) {
      this.renderChart(currentSummary);
    }
  }

  private renderChart(data: DashboardSummary) {
    if (!this.chartCanvas) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const isDark = document.body.classList.contains('dark-theme');
    const rootStyle = getComputedStyle(document.documentElement);

    // Chữ màu trắng hoàn toàn ở Dark Mode, màu tối dễ nhìn ở Light Mode
    const textColor = isDark ? '#ffffff' : '#334155';

    // Đọc bảng màu CVD-friendly động từ các biến CSS hệ thống
    const colors: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const val = rootStyle.getPropertyValue(`--chart-${i}`).trim();
      colors.push(val || (isDark ? '#818cf8' : '#4f46e5')); // dự phòng nếu CSS chưa load kịp
    }

    // Lọc bỏ mục 'Tổng' để không vẽ vào biểu đồ Donut
    const chartData = data.employeesByDepartment.filter(d => d.departmentName !== 'Tổng');

    const backgroundColors = chartData.map((_, i) => colors[i % colors.length]);

    // Plugin tùy chỉnh để vẽ tổng số nhân viên ở giữa biểu đồ Donut
    const centerTextPlugin = {
      id: 'centerText',
      beforeDraw: (chart: any) => {
        if (!chart.chartArea) return;
        const { ctx } = chart;
        ctx.save();

        const total = chart.config.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
        const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
        const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Chữ phụ "NHÂN VIÊN" — to hơn
        ctx.font = "600 15px 'Inter', sans-serif";
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.fillText('NHÂN VIÊN', centerX, centerY - 18);

        // Số tổng chính — to và đậm hơn
        ctx.font = "bold 36px 'Inter', sans-serif";
        ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
        ctx.fillText(total.toString(), centerX, centerY + 18);

        ctx.restore();
      }
    };

    this.chartInstance = new Chart(this.chartCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: chartData.map((d) => d.departmentName),
        datasets: [
          {
            label: 'Nhân viên',
            data: chartData.map((d) => d.thisMonthCount),
            backgroundColor: backgroundColors,
            borderColor: isDark ? '#1e293b' : '#ffffff',
            borderWidth: 3,
            hoverOffset: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '55%', // Vòng béo hơn — giảm từ 70% xuống 55%
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 1200,
          easing: 'easeOutQuart'
        },
        layout: {
          padding: {
            right: 10,
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'right',
            align: 'center',
            labels: {
              color: textColor,
              padding: 14,
              boxWidth: 14,
              boxHeight: 14,
              usePointStyle: true,
              pointStyle: 'circle',
              font: {
                size: 13,
                family: "'Inter', sans-serif",
                weight: 500,
              }
            }
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
              label: (context) => {
                const value = context.raw || 0;
                return ` ${context.label}: ${value} nhân viên`;
              }
            }
          }
        },
      },
      plugins: [centerTextPlugin]
    });
  }
}