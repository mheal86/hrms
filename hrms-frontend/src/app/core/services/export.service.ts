import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { utils, write } from 'xlsx';
import { jsPDF, jsPDFOptions } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TranslateService } from '@ngx-translate/core';

interface WindowWithGlobal extends Window {
  global?: Window;
}

// Polyfill window.global cho thư viện SheetJS hoạt động chính xác trên môi trường trình duyệt
if (typeof window !== 'undefined' && (window as WindowWithGlobal).global === undefined) {
  (window as WindowWithGlobal).global = window;
}

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  private http = inject(HttpClient);
  private translate = inject(TranslateService);
  private robotoFontBase64: string | null = null;

  /**
   * Tải font Roboto hỗ trợ tiếng Việt có dấu từ tài nguyên cục bộ.
   * Kết quả sẽ được lưu tạm trong memory để tối ưu cho những lần export tiếp theo.
   */
  async getRobotoFont(): Promise<string> {
    if (this.robotoFontBase64) {
      return this.robotoFontBase64;
    }

    try {
      const url = '/fonts/Roboto-Regular.ttf';
      const arrayBuffer = await firstValueFrom(this.http.get(url, { responseType: 'arraybuffer' }));
      this.robotoFontBase64 = this.arrayBufferToBase64(arrayBuffer);
      return this.robotoFontBase64;
    } catch (error) {
      throw error;
    }
  }

  arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Xuất dữ liệu ra file Excel (.xlsx)
   * @param fileName Tên file xuất ra (không bao gồm đuôi file)
   * @param headers Danh sách tiêu đề cột
   * @param data Mảng dữ liệu tương ứng các hàng
   */
  exportExcel(fileName: string, headers: string[], data: (string | number | boolean | null)[][]) {
    try {
      const wsData = [headers, ...data];
      const ws = utils.aoa_to_sheet(wsData);

      // Tự động tính toán độ rộng của các cột
      const colWidths = headers.map((h, i) => {
        let maxLen = h.length;
        data.forEach((row) => {
          const cellValue = row[i] != null ? String(row[i]) : '';
          if (cellValue.length > maxLen) {
            maxLen = cellValue.length;
          }
        });
        // Bổ sung thêm khoảng trống (padding)
        return { wch: Math.max(maxLen + 3, 10) };
      });
      ws['!cols'] = colWidths;

      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Data');

      // Tạo buffer và lưu bằng Blob để tránh lỗi tương thích trình duyệt
      const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Tạo instance jsPDF (được tách ra để hỗ trợ việc viết unit test/mocking)
   */
  createPdf(options?: jsPDFOptions): jsPDF {
    return new jsPDF(options);
  }

  /**
   * Xuất dữ liệu ra file PDF (.pdf) hỗ trợ tiếng Việt
   * @param fileName Tên file xuất ra
   * @param title Tiêu đề bảng trong file PDF
   * @param headers Danh sách tiêu đề cột
   * @param data Mảng dữ liệu các dòng
   */
  async exportPDF(fileName: string, title: string, headers: string[], data: (string | number | boolean | null)[][]): Promise<void> {
    try {
      const doc = this.createPdf({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const fontBase64 = await this.getRobotoFont();
      if (fontBase64) {
        doc.addFileToVFS('Roboto-Regular.ttf', fontBase64);
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'bold');
        doc.setFont('Roboto');
      }

      // Tiêu đề chính
      doc.setFontSize(18);
      doc.text(title, 14, 20);

      // Ngày xuất dữ liệu phụ đề
      doc.setFontSize(10);
      doc.setTextColor(100);
      const currentLang = this.translate.currentLang() || 'vi';
      const locale = currentLang === 'vi' ? 'vi-VN' : 'en-US';
      const label = this.translate.instant('COMMON.EXPORT_DATE') || (currentLang === 'vi' ? 'Ngày xuất' : 'Export Date');
      const dateText = `${label}: ${new Date().toLocaleString(locale)}`;
      doc.text(dateText, 14, 26);

      // Tạo bảng qua jspdf-autotable
      autoTable(doc, {
        startY: 32,
        head: [headers],
        body: data,
        styles: {
          font: fontBase64 ? 'Roboto' : 'helvetica',
          fontStyle: 'normal',
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [67, 56, 202], // Màu theme chính Indigo-700
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          font: fontBase64 ? 'Roboto' : 'helvetica',
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252], // Slate-50 cho các hàng xen kẽ
          font: fontBase64 ? 'Roboto' : 'helvetica',
        },
        margin: { top: 30, right: 14, bottom: 15, left: 14 },
      });

      doc.save(`${fileName}.pdf`);
    } catch (error) {
      throw error;
    }
  }
}
