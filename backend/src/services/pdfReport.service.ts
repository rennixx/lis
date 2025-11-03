import PDFDocument from 'pdfkit';
import moment from 'moment';
import mongoose from 'mongoose';
import { uploadPDFToGridFS } from '../utils/gridfs';
import { ApiError } from '../utils/ApiError';

interface ReportData {
  order: any;
  patient: any;
  doctor: any;
  tests: any[];
  results: any[];
  reportNumber: string;
  reportDate: Date;
  clinicalInformation?: string;
  summary?: string;
  conclusion?: string;
  recommendations?: string;
}

interface PDFOptions {
  template?: 'standard' | 'detailed' | 'compact';
  includeBarcode?: boolean;
  includeQR?: boolean;
  includeNormalRanges?: boolean;
  includeDoctorNotes?: boolean;
  includeLabInfo?: boolean;
}

export class PDFReportService {
  private labInfo = {
    name: 'Central Laboratory Services',
    address: '123 Medical Center Drive, Healthcare City',
    phone: '+1 (555) 123-4567',
    email: 'lab@centrallab.com',
    website: 'www.centrallab.com',
    logo: '/assets/lab-logo.png', // This would be a base64 image or file path
    accreditation: 'ISO 15189:2022 Accredited Laboratory',
    licenseNo: 'LAB-2023-001'
  };

  async generateReportPDF(
    reportData: ReportData,
    options: PDFOptions = {}
  ): Promise<{ fileBuffer: Buffer; filename: string; fileSize: number }> {
    const startTime = Date.now();

    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        },
        info: {
          Title: `Laboratory Report - ${reportData.patient.firstName} ${reportData.patient.lastName}`,
          Author: 'Central Laboratory Services',
          Subject: 'Medical Laboratory Report',
          Keywords: 'laboratory, report, medical',
          CreationDate: new Date(),
          Creator: 'LIS System'
        }
      });

      // Collect PDF chunks
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));

      // Generate PDF content
      await this.generatePDFContent(doc, reportData, options);

      // Finalize PDF
      doc.end();

      // Wait for PDF to be generated
      const fileBuffer = await new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
        doc.on('error', reject);
      });

      const generationTime = Date.now() - startTime;
      const filename = `Report_${reportData.reportNumber}_${moment().format('YYYY-MM-DD_HH-mm-ss')}.pdf`;
      const fileSize = fileBuffer.length;

      console.log(`PDF generated in ${generationTime}ms, size: ${fileSize} bytes`);

      return { fileBuffer, filename, fileSize };
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new ApiError('Failed to generate PDF report', 500);
    }
  }

  private async generatePDFContent(
    doc: any, // PDFKit document
    data: ReportData,
    options: PDFOptions
  ): Promise<void> {
    const template = options.template || 'standard';

    // Add lab header
    await this.addLabHeader(doc, data);

    // Add patient information
    await this.addPatientInfo(doc, data, options);

    // Add doctor and clinical information
    await this.addClinicalInfo(doc, data, options);

    // Group results by category
    const groupedResults = this.groupResultsByCategory(data.results, data.tests);

    // Add test results
    await this.addTestResults(doc, groupedResults, options);

    // Add summary and conclusions
    await this.addSummary(doc, data, options);

    // Add footer with page numbers
    this.addFooter(doc);

    // Add barcode/QR if requested
    if (options.includeBarcode || options.includeQR) {
      await this.addBarcodes(doc, data, options);
    }
  }

  private async addLabHeader(doc: any, data: ReportData): Promise<void> {
    // Lab name and title
    doc.fontSize(20).font('Helvetica-Bold').text(this.labInfo.name, { align: 'center' });

    // Accreditation
    doc.fontSize(10).font('Helvetica-Oblique').text(this.labInfo.accreditation, { align: 'center' });

    // Report title
    doc.moveDown(0.5);
    doc.fontSize(16).font('Helvetica-Bold').text('LABORATORY TEST REPORT', { align: 'center' });

    // Report number and date
    doc.fontSize(12).font('Helvetica');
    doc.text(`Report No: ${data.reportNumber}`, { align: 'center' });
    doc.text(`Date: ${moment(data.reportDate).format('MMMM DD, YYYY')}`, { align: 'center' });

    // Horizontal line
    doc.moveDown(0.5);
    doc.strokeColor('#cccccc').lineWidth(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);
  }

  private async addPatientInfo(doc: any, data: ReportData, options: PDFOptions): Promise<void> {
    doc.fontSize(14).font('Helvetica-Bold').text('PATIENT INFORMATION');

    doc.strokeColor('#cccccc').lineWidth(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);

    doc.fontSize(11).font('Helvetica');

    // Two-column layout for patient info
    const patientData = [
      { label: 'Name:', value: `${data.patient.firstName} ${data.patient.lastName}` },
      { label: 'MRN:', value: data.patient.mrn || 'N/A' },
      { label: 'Age:', value: `${data.patient.age || 'N/A'} ${data.patient.ageUnit || 'years'}` },
      { label: 'Gender:', value: data.patient.gender || 'N/A' },
      { label: 'Phone:', value: data.patient.phone || 'N/A' },
      { label: 'Email:', value: data.patient.email || 'N/A' }
    ];

    const leftColumn = patientData.slice(0, 3);
    const rightColumn = patientData.slice(3);

    // Left column
    leftColumn.forEach(item => {
      doc.font('Helvetica-Bold').text(item.label, 50, doc.y, { continued: true });
      doc.font('Helvetica').text(` ${item.value}`, { width: 200 });
    });

    // Right column
    const startY = doc.y - (leftColumn.length * 15);
    rightColumn.forEach(item => {
      doc.font('Helvetica-Bold').text(item.label, 300, startY + rightColumn.indexOf(item) * 15, { continued: true });
      doc.font('Helvetica').text(` ${item.value}`, { width: 200 });
    });

    doc.moveDown(1);
  }

  private async addClinicalInfo(doc: any, data: ReportData, options: PDFOptions): Promise<void> {
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica-Bold').text('CLINICAL INFORMATION');

    doc.strokeColor('#cccccc').lineWidth(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);

    doc.fontSize(11).font('Helvetica');

    // Requesting doctor
    doc.font('Helvetica-Bold').text('Requesting Doctor: ', { continued: true });
    doc.font('Helvetica').text(`${data.doctor.firstName} ${data.doctor.lastName}`);

    if (data.doctor.department) {
      doc.font('Helvetica-Bold').text('Department: ', { continued: true });
      doc.font('Helvetica').text(data.doctor.department);
    }

    // Clinical information
    if (data.clinicalInformation) {
      doc.font('Helvetica-Bold').text('Clinical Notes: ', { continued: false });
      doc.moveDown(0.2);
      doc.font('Helvetica').text(data.clinicalInformation, { align: 'justify' });
    }

    doc.moveDown(0.5);
  }

  private groupResultsByCategory(results: any[], tests: any[]): Map<string, any[]> {
    const grouped = new Map<string, any[]>();

    results.forEach(result => {
      const test = tests.find(t => t._id.toString() === result.test.toString());
      const category = test?.category || 'General';

      if (!grouped.has(category)) {
        grouped.set(category, []);
      }

      grouped.get(category)!.push({
        ...result,
        testInfo: test
      });
    });

    // Sort categories alphabetically
    const sortedCategories = Array.from(grouped.keys()).sort();
    const sortedGrouped = new Map<string, any[]>();
    sortedCategories.forEach(category => {
      sortedGrouped.set(category, grouped.get(category)!);
    });

    return sortedGrouped;
  }

  private async addTestResults(doc: any, groupedResults: Map<string, any[]>, options: PDFOptions): Promise<void> {
    doc.fontSize(14).font('Helvetica-Bold').text('TEST RESULTS');

    doc.strokeColor('#cccccc').lineWidth(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);

    let totalTests = 0;
    let abnormalCount = 0;
    let criticalCount = 0;

    // Process each category
    for (const [category, categoryResults] of groupedResults) {
      // Category header
      doc.fontSize(12).font('Helvetica-Bold').text(category.toUpperCase());
      doc.moveDown(0.2);

      // Table headers
      const tableTop = doc.y;
      const headers = ['Test Name', 'Result', 'Normal Range', 'Status'];
      const columnWidths = [180, 100, 120, 80];
      let xPos = 50;

      // Table header row
      doc.fontSize(10).font('Helvetica-Bold');
      headers.forEach((header, index) => {
        doc.text(header, xPos, tableTop, { width: columnWidths[index] });
        xPos += columnWidths[index];
      });

      // Horizontal line after headers
      doc.strokeColor('#000000').lineWidth(0.5);
      doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).stroke();
      doc.moveDown(0.3);

      // Table data
      doc.fontSize(10).font('Helvetica');
      categoryResults.forEach(result => {
        totalTests++;

        const isAbnormal = result.isAbnormal || false;
        const isCritical = result.criticalValue || false;

        if (isAbnormal) abnormalCount++;
        if (isCritical) criticalCount++;

        // Set text color based on result status
        if (isCritical) {
          doc.fillColor('#ff0000'); // Red for critical
        } else if (isAbnormal) {
          doc.fillColor('#ff6600'); // Orange for abnormal
        } else {
          doc.fillColor('#000000'); // Black for normal
        }

        xPos = 50;
        const rowY = doc.y;

        // Test name
        doc.text(result.testInfo?.name || 'Unknown Test', xPos, rowY, { width: columnWidths[0] });
        xPos += columnWidths[0];

        // Result value with unit
        const resultText = `${result.value || 'N/A'} ${result.testInfo?.unit || ''}`;
        doc.text(resultText, xPos, rowY, { width: columnWidths[1] });
        xPos += columnWidths[1];

        // Normal range
        let normalRangeText = 'N/A';
        if (result.testInfo?.normalRange) {
          const { min, max } = result.testInfo.normalRange;
          if (min !== undefined && max !== undefined) {
            normalRangeText = `${min} - ${max}`;
          } else if (min !== undefined) {
            normalRangeText = `> ${min}`;
          } else if (max !== undefined) {
            normalRangeText = `< ${max}`;
          }
        }
        doc.text(normalRangeText, xPos, rowY, { width: columnWidths[2] });
        xPos += columnWidths[2];

        // Status
        let statusText = 'Normal';
        if (isCritical) statusText = 'Critical';
        else if (isAbnormal) statusText = 'Abnormal';
        else if (result.status === 'pending') statusText = 'Pending';

        doc.text(statusText, xPos, rowY, { width: columnWidths[3] });

        doc.moveDown(0.4);
      });

      // Reset color
      doc.fillColor('#000000');

      // Add some spacing between categories
      doc.moveDown(0.3);

      // Check if we need a new page
      if (doc.y > 650) {
        doc.addPage();
      }
    }

    // Summary statistics
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold').text('SUMMARY STATISTICS');
    doc.moveDown(0.2);

    doc.fontSize(10).font('Helvetica');
    const summaryStats = [
      `Total Tests: ${totalTests}`,
      `Normal Results: ${totalTests - abnormalCount}`,
      `Abnormal Results: ${abnormalCount}`,
      `Critical Results: ${criticalCount}`
    ];

    summaryStats.forEach((stat, index) => {
      doc.text(stat, 50 + (index % 2) * 250, doc.y);
      if (index % 2 === 1) doc.moveDown(0.3);
    });

    doc.moveDown(0.5);
  }

  private async addSummary(doc: any, data: ReportData, options: PDFOptions): Promise<void> {
    if (data.summary || data.conclusion || data.recommendations) {
      doc.fontSize(14).font('Helvetica-Bold').text('SUMMARY & CONCLUSIONS');

      doc.strokeColor('#cccccc').lineWidth(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.3);

      doc.fontSize(11).font('Helvetica');

      if (data.summary) {
        doc.font('Helvetica-Bold').text('Summary: ', { continued: true });
        doc.font('Helvetica').text(data.summary);
        doc.moveDown(0.3);
      }

      if (data.conclusion) {
        doc.font('Helvetica-Bold').text('Conclusion: ', { continued: true });
        doc.font('Helvetica').text(data.conclusion);
        doc.moveDown(0.3);
      }

      if (data.recommendations) {
        doc.font('Helvetica-Bold').text('Recommendations: ', { continued: true });
        doc.font('Helvetica').text(data.recommendations);
        doc.moveDown(0.3);
      }
    }
  }

  private addFooter(doc: any): void {
    const pages = doc.bufferedPageRange();
    const totalPages = pages.count;

    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);

      // Footer line
      const footerY = doc.page.height - 70;
      doc.strokeColor('#cccccc').lineWidth(0.5);
      doc.moveTo(50, footerY).lineTo(545, footerY).stroke();

      // Lab information
      doc.fontSize(8).font('Helvetica');
      doc.fillColor('#666666');
      doc.text(this.labInfo.address, 50, footerY + 10);
      doc.text(`Tel: ${this.labInfo.phone} | Email: ${this.labInfo.email}`, 50, footerY + 20);
      doc.text(`License No: ${this.labInfo.licenseNo}`, 50, footerY + 30);

      // Page number
      doc.text(`Page ${i + 1} of ${totalPages}`, 545, footerY + 20, { align: 'right' });

      // Disclaimer
      doc.fontSize(7).font('Helvetica-Oblique');
      const disclaimer = 'This report is for medical professional use only. Interpretation should be done by qualified healthcare professionals.';
      doc.text(disclaimer, 50, footerY + 45, { align: 'center' });

      // Signature area (only on last page)
      if (i === totalPages - 1) {
        doc.moveDown(1);
        doc.fontSize(10).font('Helvetica-Bold').text('Pathologist Signature:', 50, footerY + 65);
        doc.text('...................................................', 180, footerY + 65);
        doc.text('Date & Time:', 400, footerY + 65);
        doc.text('...................................................', 450, footerY + 65);
      }

      doc.fillColor('#000000');
    }
  }

  private async addBarcodes(doc: any, data: ReportData, options: PDFOptions): Promise<void> {
    // This is a placeholder for barcode/QR code generation
    // In a real implementation, you would use a library like 'bwip-js' or 'qrcode'

    if (options.includeBarcode) {
      // Add barcode placeholder
      doc.fontSize(8).font('Helvetica');
      doc.text(`Report ID: ${data.reportNumber}`, 50, 30);
      doc.text('Barcode: [BARCODE PLACEHOLDER]', 50, 40);
    }

    if (options.includeQR) {
      // Add QR code placeholder
      doc.text('QR Code: [QR CODE PLACEHOLDER]', 400, 30);
    }
  }

  // Method to save PDF to GridFS
  async savePDFToGridFS(
    reportData: ReportData,
    reportId: string,
    options: PDFOptions = {}
  ): Promise<{ fileBuffer: Buffer; fileId: mongoose.Types.ObjectId; filename: string; fileSize: number }> {
    try {
      console.log('🔧 [PDF] Starting PDF generation for report:', reportId);
      const { fileBuffer, filename, fileSize } = await this.generateReportPDF(reportData, options);
      console.log('🔧 [PDF] PDF generated successfully, size:', fileSize, 'bytes');

      console.log('🔧 [PDF] Starting GridFS upload...');
      const fileId = await uploadPDFToGridFS(fileBuffer, filename, {
        reportId,
        reportNumber: reportData.reportNumber,
        patientId: reportData.patient?._id || null,
        orderId: reportData.order?._id || null,
        generatedAt: new Date(),
        template: options.template || 'standard'
      });
      console.log('🔧 [PDF] GridFS upload completed, file ID:', fileId);

      return { fileBuffer, fileId, filename, fileSize };
    } catch (error) {
      console.error('Error saving PDF to GridFS:', error);
      throw new ApiError('Failed to save PDF report', 500);
    }
  }

  // Method to generate bulk reports
  async generateBulkReports(
    reports: Array<{ reportData: ReportData; reportId: string }>,
    options: PDFOptions = {}
  ): Promise<Array<{ fileId: mongoose.Types.ObjectId; filename: string; fileSize: number }>> {
    const results = [];

    for (const { reportData, reportId } of reports) {
      try {
        const result = await this.savePDFToGridFS(reportData, reportId, options);
        results.push({
          fileId: result.fileId,
          filename: result.filename,
          fileSize: result.fileSize
        });
      } catch (error) {
        console.error(`Error generating report for ${reportId}:`, error);
        // Continue with other reports
      }
    }

    return results;
  }
}