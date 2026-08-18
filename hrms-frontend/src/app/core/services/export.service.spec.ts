import { TestBed } from '@angular/core/testing';
import { ExportService } from './export.service';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { jsPDF } from 'jspdf';

describe('ExportService', () => {
  let service: ExportService;
  let mockHttp: jasmine.SpyObj<HttpClient>;
  let mockTranslate: jasmine.SpyObj<TranslateService>;

  const MOCK_ARRAY_BUFFER = new ArrayBuffer(8);
  const MOCK_FONT_BUFFER = new Uint8Array([1, 2, 3]).buffer;

  beforeEach(() => {
    mockHttp = jasmine.createSpyObj('HttpClient', ['get']);
    mockTranslate = jasmine.createSpyObj('TranslateService', ['instant', 'currentLang']);

    TestBed.configureTestingModule({
      providers: [
        ExportService,
        { provide: HttpClient, useValue: mockHttp },
        { provide: TranslateService, useValue: mockTranslate },
      ],
    });

    service = TestBed.inject(ExportService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('exportExcel', () => {
    let createSpy: jasmine.Spy;
    let revokeSpy: jasmine.Spy;
    let mockLink: HTMLAnchorElement;
    let appendSpy: jasmine.Spy;
    let removeSpy: jasmine.Spy;

    beforeEach(() => {
      createSpy = spyOn(window.URL, 'createObjectURL').and.returnValue('blob:mock-excel');
      revokeSpy = spyOn(window.URL, 'revokeObjectURL');

      const anchor = document.createElement('a');
      spyOn(anchor, 'click');
      mockLink = anchor;

      spyOn(document, 'createElement').and.callFake((tag: string) => {
        if (tag === 'a') return mockLink;
        return document.createElement(tag);
      });
      appendSpy = spyOn(document.body, 'appendChild');
      removeSpy = spyOn(document.body, 'removeChild');
    });

    it('should generate excel sheet, set filename, trigger download, and revoke blob URL', () => {
      service.exportExcel('test_file', ['Header 1', 'Header 2'], [['Val 1 Long Cell Value', 12345678901], [null, true]]);

      expect(createSpy).toHaveBeenCalled();
      expect(mockLink.download).toBe('test_file.xlsx');
      expect(mockLink.click).toHaveBeenCalled();
      expect(appendSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();
      expect(revokeSpy).toHaveBeenCalledWith('blob:mock-excel');
    });

    it('should throw if excel generation fails', () => {
      expect(() => {
        service.exportExcel('test_file', undefined as unknown as string[], undefined as unknown as (string | number | boolean | null)[][]);
      }).toThrow();
    });
  });

  describe('createPdf', () => {
    it('should return a valid jsPDF document with a save method', () => {
      const doc = service.createPdf();

      expect(doc).toBeDefined();
      expect(doc.save).toBeDefined();
    });
  });

  describe('exportPDF', () => {
    let saveSpy: jasmine.Spy;
    let textSpy: jasmine.Spy;
    let setFontSpy: jasmine.Spy;
    let addFontSpy: jasmine.Spy;
    let addFileSpy: jasmine.Spy;
    let getTextWidthSpy: jasmine.Spy;
    let setFontSizeSpy: jasmine.Spy;
    let setTextColorSpy: jasmine.Spy;

    beforeEach(() => {
      saveSpy = jasmine.createSpy('save').and.callFake(function (this: jsPDF) { return this; });
      textSpy = jasmine.createSpy('text').and.callFake(function (this: jsPDF) { return this; });
      setFontSpy = jasmine.createSpy('setFont').and.callFake(function (this: jsPDF) { return this; });
      addFontSpy = jasmine.createSpy('addFont').and.callFake(function (this: jsPDF) { return this; });
      addFileSpy = jasmine.createSpy('addFileToVFS').and.callFake(function (this: jsPDF) { return this; });
      getTextWidthSpy = jasmine.createSpy('getTextWidth').and.returnValue(10);
      setFontSizeSpy = jasmine.createSpy('setFontSize').and.callFake(function (this: jsPDF) { return this; });
      setTextColorSpy = jasmine.createSpy('setTextColor').and.callFake(function (this: jsPDF) { return this; });

      spyOn(service, 'createPdf').and.callFake(() => {
        const doc = new jsPDF();
        doc.save = saveSpy;
        doc.text = textSpy;
        doc.setFont = setFontSpy;
        doc.addFont = addFontSpy;
        doc.addFileToVFS = addFileSpy;
        doc.getTextWidth = getTextWidthSpy;
        doc.setFontSize = setFontSizeSpy;
        doc.setTextColor = setTextColorSpy;
        return doc;
      });
    });

    it('should load Roboto font, render title and headers, then save the file', async () => {
      mockHttp.get.and.returnValue(of(MOCK_ARRAY_BUFFER));
      mockTranslate.currentLang.and.returnValue('vi');
      mockTranslate.instant.and.callFake((key: string) => key);

      await service.exportPDF('test_pdf', 'Report Title', ['Col 1', 'Col 2'], [['Row 1 Col 1', 'Row 1 Col 2']]);

      expect(mockHttp.get).toHaveBeenCalledWith('/fonts/Roboto-Regular.ttf', jasmine.objectContaining({ responseType: 'arraybuffer' }));
      expect(addFileSpy).toHaveBeenCalled();
      expect(addFontSpy).toHaveBeenCalled();
      expect(textSpy).toHaveBeenCalledWith('Report Title', 14, 20);
      expect(saveSpy).toHaveBeenCalledWith('test_pdf.pdf');
    });

    it('should use the cached font and only fetch once across multiple calls', async () => {
      mockHttp.get.and.returnValue(of(MOCK_ARRAY_BUFFER));
      mockTranslate.currentLang.and.returnValue('vi');
      mockTranslate.instant.and.callFake((key: string) => key);

      await service.exportPDF('p1', 'T1', ['H'], [['D']]);
      await service.exportPDF('p2', 'T2', ['H'], [['D']]);

      expect(mockHttp.get).toHaveBeenCalledTimes(1);
    });

    it('should reject if font fetch fails', async () => {
      mockHttp.get.and.returnValue(throwError(() => new Error('Font load failed')));
      mockTranslate.currentLang.and.returnValue('vi');
      mockTranslate.instant.and.callFake((key: string) => key);

      await expectAsync(
        service.exportPDF('fallback_pdf', 'T', ['H'], [['D']])
      ).toBeRejected();
    });

    it('should reject if pdf save throws an error', async () => {
      mockHttp.get.and.returnValue(of(MOCK_ARRAY_BUFFER));
      mockTranslate.currentLang.and.returnValue('vi');
      mockTranslate.instant.and.callFake((key: string) => key);
      saveSpy.and.callFake(function (this: jsPDF) { throw new Error('Save error'); });

      await expectAsync(
        service.exportPDF('err_pdf', 'T', ['H'], [['D']])
      ).toBeRejected();
    });

    it('should use English locale when currentLang is "en"', async () => {
      mockHttp.get.and.returnValue(of(MOCK_ARRAY_BUFFER));
      mockTranslate.currentLang.and.returnValue('en');
      mockTranslate.instant.and.returnValue('');

      await service.exportPDF('en_pdf', 'Report Title', ['Col 1'], [['Val 1']]);

      expect(saveSpy).toHaveBeenCalledWith('en_pdf.pdf');
    });

    it('should fallback to "vi" locale when currentLang is falsy', async () => {
      mockHttp.get.and.returnValue(of(MOCK_ARRAY_BUFFER));
      mockTranslate.currentLang.and.returnValue('');
      mockTranslate.instant.and.returnValue('');

      await service.exportPDF('falsy_pdf', 'Report Title', ['Col 1'], [['Val 1']]);

      expect(saveSpy).toHaveBeenCalledWith('falsy_pdf.pdf');
    });
  });

  describe('arrayBufferToBase64', () => {
    it('should convert an ArrayBuffer to a base64 string', () => {
      const bytes = new Uint8Array([72, 101, 108, 108, 111]);
      const result = service.arrayBufferToBase64(bytes.buffer);

      expect(result).toBe(window.btoa('Hello'));
    });

    it('should return an empty string for an empty ArrayBuffer', () => {
      const emptyBuffer = new ArrayBuffer(0);
      const result = service.arrayBufferToBase64(emptyBuffer);

      expect(result).toBe('');
    });
  });

  describe('getRobotoFont', () => {
    it('should fetch the font, convert to base64, and cache the result', async () => {
      mockHttp.get.and.returnValue(of(MOCK_FONT_BUFFER));

      const result = await service.getRobotoFont();

      expect(mockHttp.get).toHaveBeenCalledWith('/fonts/Roboto-Regular.ttf', jasmine.objectContaining({ responseType: 'arraybuffer' }));
      expect(result).toBe(service.arrayBufferToBase64(MOCK_FONT_BUFFER));
    });

    it('should return the cached value and NOT call http.get again on subsequent calls', async () => {
      mockHttp.get.and.returnValue(of(MOCK_FONT_BUFFER));

      await service.getRobotoFont();
      await service.getRobotoFont();

      expect(mockHttp.get).toHaveBeenCalledTimes(1);
    });

    it('should reject if font fetch fails', async () => {
      mockHttp.get.and.returnValue(throwError(() => new Error('Network error')));

      await expectAsync(service.getRobotoFont()).toBeRejected();
    });
  });
});
