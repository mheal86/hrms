# Hướng Dẫn Chi Tiết Về Logic Đa Ngôn Ngữ (i18n) Trong Hệ Thống HRMS

Tài liệu này giải thích chi tiết cơ chế hoạt động, kiến trúc, hướng dẫn thiết lập từ đầu, các rủi ro đi kèm và cách giải quyết các bài toán cụ thể khi triển khai đa ngôn ngữ (Internationalization - i18n) cho hệ thống HRMS bằng thư viện `@ngx-translate` và Angular 21.

---

## 🚀 Hướng Dẫn Thiết Lập Từ Đầu (Setup Steps)

Để thêm tính năng đa ngôn ngữ vào một dự án Angular mới hoặc dự án chưa có i18n, hãy thực hiện theo các bước sau:

### Bước 1: Cài đặt thư viện
Chạy lệnh npm để cài đặt bộ thư viện ngx-translate tương thích với Angular 18+:
```bash
npm install @ngx-translate/core @ngx-translate/http-loader --save
```

### Bước 2: Tạo các file ngôn ngữ (JSON)
Tạo thư mục `i18n` trong thư mục `public` (đối với Angular 18+) hoặc `src/assets` (đối với các bản cũ hơn). Tạo 2 file cấu hình:
1. `public/i18n/vi.json` (Tiếng Việt)
2. `public/i18n/en.json` (Tiếng Anh)

*Ví dụ cấu trúc file JSON:*
```json
{
  "COMMON": {
    "SAVE": "Lưu",
    "CANCEL": "Hủy"
  }
}
```

### Bước 3: Cấu hình Standalone Provider trong `app.config.ts`
Khai báo và liên kết `ngx-translate` với trình tải dữ liệu thông qua HTTP Client để Angular biết cách nạp các file JSON:
```typescript
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideTranslateService({
      defaultLanguage: 'vi', // Ngôn ngữ mặc định
      loader: provideTranslateHttpLoader({
        prefix: '/i18n/',    // Nơi chứa các file dịch
        suffix: '.json',
      }),
    }),
  ]
};
```

### Bước 4: Tạo dịch vụ quản lý ngôn ngữ `LanguageService`
Tạo một Service để quản lý việc đổi ngôn ngữ, lưu trạng thái lựa chọn của người dùng vào LocalStorage và liên kết validator thông báo lỗi.
*(Chi tiết code xem tại Q2 và Q4 bên dưới)*

### Bước 5: Khởi động dịch vụ trong `main.ts`
Để đảm bảo ngôn ngữ đã lưu được áp dụng ngay trước khi giao diện render, khởi chạy `LanguageService.init()` ngay khi ứng dụng bootstrap:
```typescript
bootstrapApplication(App, appConfig)
  .then((appRef) => {
    const langService = appRef.injector.get(LanguageService);
    langService.init();
  });
```

---

## ⚡ Các Rủi Ro Khi Triển Khai (Potential Risks)

| Tên Rủi Ro | Mô Tả Rủi Ro | Cách Khắc Phục Đang Áp Dụng |
| :--- | :--- | :--- |
| **Rò rỉ bộ nhớ (Memory Leak)** | Đăng ký sự kiện `.onLangChange` trong các component nhưng không hủy khi component bị hủy (`destroy`), gây lãng phí RAM. | Sử dụng RxJS `Subject` kết hợp với toán tử `takeUntil(this.destroy$)` trong mọi component có subscribe. |
| **Giao diện bị giật (FOUC - Flash of Untranslated Text)** | Khi trang vừa tải, file JSON chưa kịp load xong khiến người dùng thấy các mã code thô (ví dụ: `SIDEBAR.DASHBOARD`) trong 0.5s. | Thiết lập ngôn ngữ mặc định (`fallbackLang: 'vi'`) và sử dụng màn hình chờ Spinner cho đến khi dữ liệu nạp xong. |
| **Thiếu Key dịch thuật** | Khi thêm tính năng mới, lập trình viên quên khai báo key trong file `en.json` khiến giao diện tiếng Anh hiện mã key thô. | Luôn duy trì thuộc tính `fallbackLang: 'vi'`. Nếu thiếu key tiếng Anh, hệ thống tự động hiển thị tiếng Việt thay vì mã key thô. |
| **Xung đột validate của Formly** | Dùng chung một FormGroup duy nhất cho các nhóm form khác nhau khiến Formly ghi đè và làm mất trạng thái validate. | Sử dụng các FormGroup riêng biệt cho từng phần (ví dụ: `form` cho nhân viên, `accountForm` cho tài khoản). |

---

## 💬 Các Câu Hỏi Thường Gặp & Giải Thích Logic (Q&A)

### ❓ Q1: Làm thế nào ứng dụng tải (load) được các file ngôn ngữ? Tại sao phải đưa chúng vào thư mục `/public/i18n` thay vì `/src/assets`?

#### **Giải thích:**
Trong cấu hình Angular thế hệ mới (Angular 18+), cấu trúc dự án được tối giản hóa. Theo cấu hình trong file `angular.json`, thư mục chứa tài nguyên tĩnh phục vụ cho môi trường Client (Browser) được chỉ định là `public`:
```json
"assets": [
  {
    "glob": "**/*",
    "input": "public"
  }
]
```
Nếu ta đặt các file dịch trong `src/assets`, Angular Compiler sẽ không copy chúng vào thư mục đích khi build, dẫn đến lỗi **404 Not Found** khi trình duyệt gửi request tải file dịch. Do đó, toàn bộ file dịch được đặt tại `public/i18n/vi.json` và `public/i18n/en.json`, giúp chúng được phục vụ trực tiếp tại root URL `/i18n/...`.

---

### ❓ Q2: Làm sao ứng dụng nhớ được ngôn ngữ người dùng đã chọn ở lần truy cập trước đó?

#### **Giải thích:**
Mỗi khi người dùng thay đổi ngôn ngữ thông qua Navbar Dropdown, hệ thống sẽ lưu mã ngôn ngữ (`vi` hoặc `en`) vào `localStorage` của trình duyệt. 
Khi ứng dụng khởi động lại (bootstrapping), dịch vụ `LanguageService` sẽ được gọi ngay lập tức trong `main.ts` để đọc giá trị đã lưu này. Nếu không tìm thấy (lần đầu truy cập), ứng dụng sẽ tự động chọn tiếng Việt (`vi`) làm mặc định.

#### **Minh họa code `language.service.ts`:**
```typescript
export const LANG_STORAGE_KEY = 'hrms_lang';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  currentLang = signal<SupportedLang>('vi');

  init(): void {
    // Đọc ngôn ngữ từ localStorage hoặc mặc định là 'vi'
    const saved = localStorage.getItem(LANG_STORAGE_KEY) as SupportedLang;
    const lang = saved === 'en' || saved === 'vi' ? saved : 'vi';
    
    this.currentLang.set(lang);
    this.translate.use(lang); // Kích hoạt ngôn ngữ cho ngx-translate
  }

  switchLang(lang: SupportedLang): void {
    this.currentLang.set(lang);
    this.translate.use(lang);
    localStorage.setItem(LANG_STORAGE_KEY, lang); // Lưu lại lựa chọn
  }
}
```

---

### ❓ Q3: Tại sao khi đổi ngôn ngữ, toàn bộ chữ thay đổi ngay lập tức mà không cần reload trang?

#### **Giải thích:**
Có hai trường hợp cập nhật chữ trên giao diện:
1. **Trong HTML Template**: Ta sử dụng Pipe `| translate`. Pipe này được kết nối trực tiếp với luồng dữ liệu (RxJS Observable) bên trong `TranslateService`. Khi hàm `translate.use()` được gọi, một sự kiện đổi ngôn ngữ phát ra, báo cho Angular làm sạch và render lại các thẻ HTML có gắn pipe này với giá trị dịch mới.
   ```html
   <span>{{ 'SIDEBAR.DASHBOARD' | translate }}</span>
   ```

2. **Trong code TypeScript (Ví dụ: Biểu đồ Donut hoặc Breadcrumb)**: Các thành phần này không dùng pipe HTML trực tiếp mà tính toán dữ liệu bằng các mảng hoặc plugin vẽ canvas. Để dịch động, ta phải lắng nghe sự kiện `translate.onLangChange` và thực hiện tính toán lại nhãn ngay lập tức.

#### **Minh họa code cập nhật biểu đồ trong `dashboard.ts`:**
```typescript
ngOnInit() {
  // Đăng ký lắng nghe sự kiện đổi ngôn ngữ để vẽ lại biểu đồ
  this.translate.onLangChange
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      const currentSummary = this.summary();
      if (currentSummary) {
        this.updateChart(currentSummary); // Vẽ lại biểu đồ và dịch lại các chữ vẽ thủ công
      }
    });
}
```

---

### ❓ Q4: Tại sao các thông báo lỗi đỏ (Validation Message) dưới các ô nhập liệu của Formly có thể dịch động được?

#### **Giải thích:**
Mặc định, Formly định nghĩa các thông báo lỗi tĩnh trong file cấu hình `app.config.ts`. Tuy nhiên, cấu hình tĩnh sẽ không nhận biết được sự thay đổi ngôn ngữ khi runtime. 
Để giải quyết triệt để, chúng ta đăng ký các hàm callback thông báo lỗi trực tiếp vào `FormlyConfig` thông qua `LanguageService.init()`. Mỗi khi Formly yêu cầu hiển thị lỗi, nó sẽ chạy hàm callback này để lấy ra bản dịch mới nhất bằng cách gọi `this.translate.instant(...)`.

#### **Minh họa code trong `language.service.ts`:**
```typescript
init(): void {
  // Đăng ký động các hàm lấy lỗi validation
  this.formlyConfig.addValidatorMessage('required', () => 
    this.translate.instant('VALIDATION.REQUIRED')
  );
  this.formlyConfig.addValidatorMessage('email', () => 
    this.translate.instant('VALIDATION.EMAIL')
  );
  
  // Các validator tự định nghĩa
  this.formlyConfig.addValidatorMessage('futureDate', () => 
    this.translate.instant('VALIDATION.FUTURE_DATE')
  );
}
```

---

### ❓ Q5: Đối với các lỗi logic nghiệp vụ từ Backend trả về bằng Tiếng Việt (Ví dụ: "Không thể xóa phòng ban vì còn nhân viên"), làm thế nào để dịch sang Tiếng Anh?

#### **Giải thích:**
Backend API trả về thông báo lỗi dạng chuỗi cứng tiếng Việt (`message`). Nếu Client hiển thị trực tiếp chuỗi này thì chế độ tiếng Anh sẽ bị lẫn tiếng Việt.
Giải pháp là chúng ta thiết kế Backend trả về thêm các mã dữ liệu đi kèm (Metadata) - cụ thể ở đây là `employeeCount` (số lượng nhân viên còn lại).
Tại Frontend, trong hàm xử lý lỗi, ta kiểm tra sự hiện diện của `employeeCount`. Nếu có, ta sẽ bỏ qua chuỗi thông báo thô của backend và sử dụng key dịch của frontend để hiển thị nội dung tiếng Việt/tiếng Anh chuẩn xác, truyền tham số số lượng nhân viên vào.

#### **Minh họa code xử lý lỗi xóa phòng ban trong `department-list.ts`:**
```typescript
this.departmentService.delete(dept._id).subscribe({
  next: () => {
    this.notificationService.success(this.translate.instant('DEPARTMENT.DELETE_SUCCESS'));
  },
  error: (err) => {
    const employeeCount = err.error?.employeeCount;
    // Nếu lỗi do phòng ban còn nhân viên
    if (employeeCount !== undefined && employeeCount !== null) {
      this.notificationService.error(
        this.translate.instant('DEPARTMENT.DELETE_HAS_EMPLOYEES_ERROR', { count: employeeCount })
      );
    } else {
      // Các lỗi hệ thống khác thì hiển thị chuỗi lỗi thô
      this.notificationService.error(
        err.error?.message || this.translate.instant('DEPARTMENT.DELETE_ERROR')
      );
    }
  }
});
```

---

### ❓ Q6 (Mức độ: Dễ): Tại sao trong file JSON ngôn ngữ ta nên lồng các key thành nhiều cấp (như `COMMON.SAVE`, `SIDEBAR.DASHBOARD`) thay vì viết phẳng một hàng?

#### **Giải thích:**
Việc lồng ghép (nesting) các nhóm ngôn ngữ mang lại 3 lợi ích thực tế:
1. **Tránh trùng lặp key (Namespace)**: Nút "Hủy" trong Form và nút "Hủy" trong Dialog xác nhận có thể có ngữ cảnh dịch khác nhau ở các ngôn ngữ khác. Lồng ghép giúp tách biệt không gian tên.
2. **Dễ bảo trì**: Phân chia khoa học theo phân hệ (ví dụ: `DASHBOARD`, `EMPLOYEE`, `VALIDATION`) giúp lập trình viên tìm và sửa key nhanh chóng.
3. **Tiết kiệm dung lượng**: Hạn chế việc lặp đi lặp lại các tiền tố dài dòng.

*Ví dụ viết đúng:*
```json
{
  "COMMON": {
    "SAVE": "Lưu"
  },
  "EMPLOYEE": {
    "SAVE": "Lưu nhân viên"
  }
}
```

---

### ❓ Q7 (Mức độ: Dễ): Làm thế nào để truyền một biến động vào câu dịch (ví dụ: hiển thị "Xóa nhân viên Nguyễn Văn A" thay vì chỉ có "Xóa nhân viên")?

#### **Giải thích:**
Thư viện `ngx-translate` hỗ trợ truyền tham số động vào chuỗi dịch bằng cú pháp dấu ngoặc nhọn kép `{{tên_biến}}` trong file JSON. Khi gọi dịch ở HTML hoặc TS, ta truyền kèm một object chứa giá trị của biến đó.

#### **Minh họa cấu trúc trong JSON:**
```json
"DELETE_CONFIRM": "Bạn có chắc muốn xóa nhân viên \"{{name}}\"?"
```

#### **Sử dụng trong HTML Template:**
```html
<p>{{ 'EMPLOYEE.DELETE_CONFIRM' | translate: { name: emp.firstName } }}</p>
```

#### **Sử dụng trong TypeScript:**
```typescript
this.translate.instant('EMPLOYEE.DELETE_CONFIRM', { name: 'Nguyễn Văn A' });
```

---

### ❓ Q8 (Mức độ: Trung bình): Tại sao ta không nên dùng trực tiếp hàm `.instant('KEY')` khi khai báo thuộc tính lớp (ví dụ: `title = this.translate.instant('TITLE')`)?

#### **Giải thích:**
Hàm `this.translate.instant('KEY')` là một hàm đồng bộ (synchronous). Nó sẽ cố gắng lấy bản dịch ngay lập tức tại thời điểm hàm chạy.
Nếu ta gọi nó ngay lúc khởi tạo class:
1. Lúc đó file JSON ngôn ngữ chưa được tải xong qua HTTP, kết quả trả về sẽ chính là mã key thô `'TITLE'`.
2. Khi người dùng bấm chuyển đổi ngôn ngữ, biến `title` này sẽ không tự động cập nhật vì nó chỉ được gán giá trị một lần duy nhất lúc khởi tạo.

#### **Cách xử lý đúng:**
Dùng hàm `.stream('KEY')` hoặc dùng thuộc tính `getter` động, hoặc subscribe sự kiện chuyển ngôn ngữ:
```typescript
// Cách 1: Sử dụng getter để luôn luôn đọc giá trị mới nhất tại thời điểm render
get title(): string {
  return this.translate.instant('TITLE');
}

// Cách 2: Lắng nghe stream bất đồng bộ
this.translate.stream('TITLE').subscribe(res => this.title = res);
```

---

### ❓ Q9 (Mức độ: Trung bình): Làm thế nào để định dạng hiển thị ngày tháng hoặc tiền tệ tự động thay đổi theo ngôn ngữ đã chọn?

#### **Giải thích:**
Sử dụng các pipe định dạng chuẩn của Angular như `date` và `currency` kết hợp với việc thiết lập locale động trong ứng dụng.
Trong `LanguageService`, khi ngôn ngữ thay đổi, ta có thể đăng ký cập nhật locale tương ứng của Angular để các pipe trên tự động nhận biết.

#### **Minh họa code sử dụng trong HTML:**
```html
<!-- Khi ở tiếng Việt hiển thị: 31/07/2026. Khi ở tiếng Anh hiển thị: Jul 31, 2026 -->
<p>{{ employee.hireDate | date:'mediumDate':undefined:languageService.currentLang() }}</p>
```

---

### ❓ Q10 (Mức độ: Trung bình): Điều gì xảy ra nếu file dịch `en.json` bị mất hoặc đường truyền mạng bị lỗi không tải được file dịch?

#### **Giải thích:**
Hệ thống xử lý lỗi này qua 2 lớp phòng vệ:
1. **Fallback Language (Ngôn ngữ dự phòng)**: Trong `app.config.ts`, ta cấu hình `fallbackLang: 'vi'`. Nếu file tiếng Anh tải lỗi hoặc thiếu một số key cụ thể, thư viện sẽ tự động trích xuất nội dung từ file tiếng Việt (`vi.json`) để hiển thị, tránh hiển thị mã key thô.
2. **Trình xử lý lỗi HTTP**: Khi việc tải file dịch thất bại hoàn toàn (Lỗi 404/500 mạng), ngx-translate sẽ kích hoạt một trình xử lý lỗi mặc định, giữ nguyên hiển thị ngôn ngữ trước đó hoặc sử dụng ngôn ngữ cài đặt sẵn cục bộ nếu có.

---

## 🛠️ Hướng Dẫn Phát Triển (Dành Cho Lập Trình Viên)

Khi thêm một giao diện hoặc tính năng mới, hãy tuân thủ quy trình sau để đảm bảo đa ngôn ngữ hoạt động tốt:

### 1. Khai báo Key dịch thuật
Thêm key vào cả 2 file:
* `public/i18n/vi.json`
* `public/i18n/en.json`

*Chú ý: Định dạng JSON phải đồng bộ cấu trúc phân cấp.*

### 2. Sử dụng trong Template HTML
Import `TranslatePipe` vào thuộc tính `imports` của Standalone Component, sau đó sử dụng trong template:
```html
<button class="btn btn-primary">
  {{ 'COMMON.SAVE' | translate }}
</button>
```

### 3. Sử dụng trong Code TypeScript
Tiêm `TranslateService` vào constructor và sử dụng:
```typescript
import { TranslateService } from '@ngx-translate/core';

constructor(private translate: TranslateService) {}

showInfo() {
  const msg = this.translate.instant('EMPLOYEE.DELETE_SUCCESS');
  console.log(msg);
}
```
