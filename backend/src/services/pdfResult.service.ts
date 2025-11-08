import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import { GridFSBucket } from 'mongodb';
import mongoose from 'mongoose';
import moment from 'moment';

interface ResultData {
  result: any;
  patient?: any;
  order?: any;
  test?: any;
}

interface ResultPDFOptions {
  template?: 'standard' | 'compact' | 'detailed' | 'cbc-style';
  includeLabInfo?: boolean;
  includePatientInfo?: boolean;
  includeDoctorInfo?: boolean;
}

interface PDFResult {
  fileBuffer: Buffer;
  filename: string;
  fileSize: number;
}

export class PdfResultService {
  private gridFSBucket?: GridFSBucket;

  constructor() {
    // Initialize GridFS bucket when connection is ready
    mongoose.connection.on('connected', () => {
      this.gridFSBucket = new GridFSBucket(mongoose.connection.db as any, {
        bucketName: 'pdfs'
      });
    });
  }

  // Lab configuration
  private labConfig = {
    name: 'LAB SIIS',
    address: 'A103-104, Tulsi Complex, Near Crystal Mall, S G Road, Ahmedabad',
    phone: '88668 02121',
    email: 'info@labsiis.com',
    website: 'www.labsiis.com',
    logo: '/assets/lab-logo.png',
    accreditation: 'ISO 15189:2022 Accredited Laboratory',
    licenseNo: 'LAB-2023-001'
  };

  async generateResultPDF(
    resultData: ResultData,
    options: ResultPDFOptions = {}
  ): Promise<{ fileBuffer: Buffer; filename: string; fileSize: number }> {
    const startTime = Date.now();

    try {
      // Create PDF document with proper A4 sizing
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 20,
          bottom: 20,
          left: 20,
          right: 20
        },
        info: {
          Title: `Laboratory Result - ${resultData.result.testName || 'CBC Test'}`,
          Author: 'LAB SIIS',
          Subject: 'Medical Laboratory Test Result',
          Keywords: 'laboratory, result, medical, test',
          CreationDate: new Date(),
          Creator: 'LIS System'
        }
      });

      // Collect PDF chunks
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));

      // Generate PDF content
      await this.generateResultPDFContent(doc, resultData, options);

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
      const testName = resultData.result.testName || resultData.test?.testName || 'CBC Test';
      const testCode = resultData.result.testCode || resultData.test?.testCode || 'CBC';
      const filename = `${testName}_${testCode}_${new Date().toISOString().split('T')[0]}.pdf`;

      console.log(`🎯 [PDF SERVICE] PDF generated successfully in ${generationTime}ms, size: ${fileBuffer.length} bytes`);

      return {
        fileBuffer,
        filename,
        fileSize: fileBuffer.length
      };

    } catch (error) {
      console.error('❌ [PDF SERVICE] Error generating PDF:', error);
      throw error;
    }
  }

  private async generateResultPDFContent(
    doc: any, // PDFKit document
    resultData: ResultData,
    options: ResultPDFOptions = {}
  ): Promise<void> {
    const { result, patient, order, test } = resultData;
    const template = options.template || 'cbc-style';

    // Set default font
    doc.font('Helvetica');

    // Generate PDF based on template
    console.log(`📄 [PDF SERVICE] Using template: ${template}`);
    switch (template) {
      case 'compact':
        console.log(`📄 [PDF SERVICE] Generating compact PDF`);
        await this.generateCompactResultPDF(doc, result, patient, order, test, options);
        break;
      case 'detailed':
        console.log(`📄 [PDF SERVICE] Generating detailed PDF`);
        await this.generateDetailedResultPDF(doc, result, patient, order, test, options);
        break;
      case 'cbc-style':
        console.log(`📄 [PDF SERVICE] Generating CBC-style PDF`);
        await this.generateCBCStyleResultPDF(doc, result, patient, order, test, options);
        break;
      default:
        console.log(`📄 [PDF SERVICE] Generating standard PDF (default)`);
        await this.generateStandardResultPDF(doc, result, patient, order, test, options);
    }
  }

  private async generateCBCStyleResultPDF(
    doc: any,
    result: any,
    patient?: any,
    order?: any,
    test?: any,
    options: ResultPDFOptions = {}
  ): Promise<void> {
    console.log('🎯 [CBC TEMPLATE] Starting CBC-style PDF generation');

    // Helper function for drawing lines
    const drawLine = (x1: number, y1: number, x2: number, y2: number, width: number = 1) => {
      doc.moveTo(x1, y1).lineTo(x2, y2).lineWidth(width).stroke();
    };

    // Helper function for drawing rectangles
    const drawRect = (x: number, y: number, width: number, height: number, fillColor?: string) => {
      if (fillColor) {
        doc.fillColor(fillColor).rect(x, y, width, height).fill();
        doc.fillColor('black');
      }
      doc.rect(x, y, width, height).stroke();
    };

    // Constants for A4 layout
    const pageWidth = 595.28; // A4 width in points
    const pageHeight = 841.89; // A4 height in points
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    let yPosition = margin;

    // Header section - full width with left-aligned text
    drawRect(margin, yPosition, contentWidth, 50, '#0066cc');
    doc.fillColor('white');

    // Lab title - left-aligned for better control
    doc.fontSize(18).font('Helvetica-Bold');
    doc.text('LAB SIIS - PATHOLOGY', margin + 15, yPosition + 15);

    doc.fontSize(9).font('Helvetica');
    doc.text('A103-104, Tulsi Complex, Near Crystal Mall, S G Road, Ahmedabad', margin + 15, yPosition + 35);
    doc.fillColor('black');

    yPosition += 60;

    // Patient information section - compact
    drawRect(margin, yPosition, contentWidth, 70);

    // Left column - improved patient data extraction
    doc.fontSize(10).font('Helvetica');

    // Debug patient data
    console.log('👤 [PDF PATIENT] Patient data:', patient);
    console.log('👤 [PDF PATIENT] Result data:', result);

    // Try multiple field names for patient info
    const firstName = patient?.firstName || patient?.first_name || patient?.name?.split(' ')[0] || result?.patientFirstName || result?.patient?.firstName || '';
    const lastName = patient?.lastName || patient?.last_name || patient?.name?.split(' ').slice(1).join(' ') || result?.patientLastName || result?.patient?.lastName || '';
    const patientName = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : 'John Doe'; // Default fallback

    // Try multiple sources for age
    let age = 'N/A';
    if (patient?.dateOfBirth || patient?.dob) {
      const dob = patient.dateOfBirth || patient.dob;
      age = `${moment().diff(moment(dob), 'years')} years`;
    } else if (patient?.age) {
      age = `${patient.age} years`;
    } else if (result?.patientAge) {
      age = `${result.patientAge} years`;
    }

    const gender = patient?.gender || patient?.sex || result?.patientGender || result?.patient?.gender || 'Male';
    const patientId = patient?.patientId || patient?.id || patient?.mrn || result?.patientId || result?.patient?.patientId || 'PID001';

    // Left column with better spacing
    doc.text('Name:', margin + 10, yPosition + 12);
    doc.font('Helvetica-Bold').text(patientName, margin + 55, yPosition + 12);

    doc.font('Helvetica').text('Age/Sex:', margin + 10, yPosition + 27);
    doc.font('Helvetica-Bold').text(`${age} / ${gender}`, margin + 55, yPosition + 27);

    doc.font('Helvetica').text('Patient ID:', margin + 10, yPosition + 42);
    doc.font('Helvetica-Bold').text(patientId, margin + 65, yPosition + 42);

    // Right column with better alignment
    const sampleType = result.sampleType || test?.sampleType || order?.sampleType ||
                      result.specimen || test?.specimen || 'Blood Sample';
    const collectionDate = result.collectionDate || order?.collectionDate || result.collectedAt ||
                          result.collectedDate || new Date();
    const reportDate = result.reportDate || result.createdAt || result.updatedAt || new Date();

    const rightColumnX = margin + 280; // Adjusted for better spacing
    const rightValueX = margin + 330;

    doc.font('Helvetica').text('Sample:', rightColumnX, yPosition + 12);
    doc.font('Helvetica-Bold').text(sampleType, rightValueX, yPosition + 12);

    doc.font('Helvetica').text('Collection:', rightColumnX, yPosition + 27);
    doc.font('Helvetica-Bold').text(
      collectionDate ? moment(collectionDate).format('DD/MM/YYYY') : moment().format('DD/MM/YYYY'),
      rightValueX, yPosition + 27
    );

    doc.font('Helvetica').text('Report:', rightColumnX, yPosition + 42);
    doc.font('Helvetica-Bold').text(
      moment(reportDate).format('DD/MM/YYYY HH:mm'),
      rightValueX, yPosition + 42
    );

    yPosition += 80;

    // Test title - use actual test name
    const testName = test?.testName || test?.name || result.testName || result.name || 'LABORATORY TEST RESULT';
    doc.fontSize(14).font('Helvetica-Bold').text(testName.toUpperCase(), margin, yPosition);
    yPosition += 20;

    // Results table
    const tableHeaders = ['Test Name', 'Result', 'Reference', 'Unit'];
    const columnWidths = [160, 80, 140, 80];
    const tableWidth = columnWidths.reduce((a, b) => a + b, 0);

    // Table header
    drawRect(margin, yPosition, tableWidth, 18, '#e8e8e8');
    doc.fontSize(9).font('Helvetica-Bold').fillColor('black');

    let xPos = margin;
    tableHeaders.forEach((header, index) => {
      doc.text(header, xPos + 4, yPosition + 5);
      xPos += columnWidths[index];
    });

    yPosition += 18;

    // Process actual test results dynamically
    const testResults = this.processTestResults(result, test);

    // Draw test results with row height check
    const rowHeight = 16;
    testResults.forEach((testItem, index) => {
      // Check if we have space for another row
      if (yPosition + rowHeight > pageHeight - 80) {
        doc.addPage();
        yPosition = margin;

        // Redraw header on new page
        drawRect(margin, yPosition, tableWidth, 18, '#e8e8e8');
        doc.fontSize(9).font('Helvetica-Bold').fillColor('black');
        xPos = margin;
        tableHeaders.forEach((header, idx) => {
          doc.text(header, xPos + 4, yPosition + 5);
          xPos += columnWidths[idx];
        });
        yPosition += 18;
      }

      // Alternate row colors
      if (index % 2 === 0) {
        drawRect(margin, yPosition, tableWidth, rowHeight, '#f8f8f8');
      }

      xPos = margin;

      // Test name
      doc.fontSize(8).font('Helvetica').text(testItem.name, xPos + 4, yPosition + 3);
      xPos += columnWidths[0];

      // Result with abnormal value highlighting
      const isAbnormal = testItem.value && testItem.refRange && this.isValueBelowRange(testItem.value, testItem.refRange);
      if (isAbnormal) {
        doc.font('Helvetica-Bold').fillColor('#d00');
      } else {
        doc.font('Helvetica').fillColor('black');
      }
      doc.fontSize(9).text(testItem.value, xPos + 4, yPosition + 3);
      xPos += columnWidths[1];

      // Reference range
      doc.font('Helvetica').fillColor('black').fontSize(8).text(testItem.refRange, xPos + 4, yPosition + 3);
      xPos += columnWidths[2];

      // Unit
      doc.fontSize(8).text(testItem.unit, xPos + 4, yPosition + 3);

      yPosition += rowHeight;
    });

    // Table border
    drawRect(margin, yPosition - (testResults.length * rowHeight) - 18, tableWidth, (testResults.length * rowHeight) + 18);

    // Vertical column lines
    xPos = margin;
    columnWidths.forEach((width, index) => {
      if (index < columnWidths.length - 1) {
        xPos += width;
        drawLine(xPos, yPosition - (testResults.length * rowHeight) - 18, xPos, yPosition);
      }
    });

    yPosition += 25;

    // Signature section
    const signatureWidth = contentWidth / 3;
    drawRect(margin, yPosition, signatureWidth, 40);
    drawRect(margin + signatureWidth, yPosition, signatureWidth, 40);
    drawRect(margin + (2 * signatureWidth), yPosition, signatureWidth, 40);

    doc.fontSize(8).font('Helvetica');
    doc.text('Pathologist', margin + 8, yPosition + 8);
    doc.text('Lab Incharge', margin + signatureWidth + 8, yPosition + 8);
    doc.text('Medical Technologist', margin + (2 * signatureWidth) + 8, yPosition + 8);

    // Signature lines
    drawLine(margin + 8, yPosition + 25, margin + signatureWidth - 8, yPosition + 25);
    drawLine(margin + signatureWidth + 8, yPosition + 25, margin + (2 * signatureWidth) - 8, yPosition + 25);
    drawLine(margin + (2 * signatureWidth) + 8, yPosition + 25, margin + contentWidth - 8, yPosition + 25);

    yPosition += 50;

    // Footer notes (simplified, no blue bar)
    doc.fontSize(7).fillColor('#666');
    doc.text('* This report is generated by an automated system and should be verified by a qualified professional.', margin, yPosition);
    yPosition += 10;
    doc.text('* Reference ranges may vary depending on laboratory, equipment, and methodology used.', margin, yPosition);
    yPosition += 10;
    doc.text(`Generated on: ${moment().format('DD/MM/YYYY hh:mm A')} | Page 1 of 1`, margin, yPosition);
    doc.fillColor('black');
  }

  // Fallback templates (simplified)
  private async generateStandardResultPDF(
    doc: any,
    result: any,
    patient?: any,
    order?: any,
    test?: any,
    options: ResultPDFOptions = {}
  ): Promise<void> {
    this.generateCBCStyleResultPDF(doc, result, patient, order, test, options);
  }

  private async generateCompactResultPDF(
    doc: any,
    result: any,
    patient?: any,
    order?: any,
    test?: any,
    options: ResultPDFOptions = {}
  ): Promise<void> {
    this.generateCBCStyleResultPDF(doc, result, patient, order, test, options);
  }

  private async generateDetailedResultPDF(
    doc: any,
    result: any,
    patient?: any,
    order?: any,
    test?: any,
    options: ResultPDFOptions = {}
  ): Promise<void> {
    this.generateCBCStyleResultPDF(doc, result, patient, order, test, options);
  }

  // Process test results dynamically based on result and test data
  private processTestResults(result: any, test?: any): Array<{name: string, value: string, refRange: string, unit: string}> {
    console.log('🔄 [PDF SERVICE] Processing test results:', { result, test });

    const testResults: Array<{name: string, value: string, refRange: string, unit: string}> = [];

    // If result has components (like CBC with multiple parameters)
    if (result.components && Array.isArray(result.components)) {
      console.log('🔄 [PDF SERVICE] Found components in result:', result.components);
      result.components.forEach((component: any) => {
        testResults.push({
          name: component.name || component.parameter || 'Unknown',
          value: component.value || component.result || 'N/A',
          refRange: component.referenceRange || component.refRange || 'N/A',
          unit: component.unit || ''
        });
      });
    }
    // If result has a simple value structure
    else if (result.value !== undefined) {
      console.log('🔄 [PDF SERVICE] Using simple result value');
      testResults.push({
        name: test?.testName || test?.name || result.testName || 'Test Result',
        value: result.value.toString(),
        refRange: result.referenceRange || result.refRange || test?.referenceRange || 'N/A',
        unit: result.unit || test?.unit || ''
      });
    }
    // If result has values object (for multi-parameter tests)
    else if (result.values && typeof result.values === 'object') {
      console.log('🔄 [PDF SERVICE] Found values object:', result.values);
      Object.entries(result.values).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          const val = (value as any).value || (value as any).result || 'N/A';
          const ref = (value as any).referenceRange || (value as any).refRange || 'N/A';
          const unit = (value as any).unit || '';

          testResults.push({
            name: this.formatTestName(key),
            value: val.toString(),
            refRange: ref,
            unit: unit
          });
        } else {
          testResults.push({
            name: this.formatTestName(key),
            value: value.toString(),
            refRange: 'N/A',
            unit: ''
          });
        }
      });
    }
    // Default fallback - show test info
    else {
      console.log('🔄 [PDF SERVICE] Using fallback test data');
      const testName = test?.testName || test?.name || result.testName || 'Unknown Test';
      testResults.push({
        name: testName,
        value: result.result || result.value || 'N/A',
        refRange: test?.referenceRange || 'N/A',
        unit: test?.unit || ''
      });
    }

    console.log('🔄 [PDF SERVICE] Processed test results:', testResults);
    return testResults;
  }

  // Format test names for better display
  private formatTestName(name: string): string {
    return name
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  // Helper method to check if value is below reference range
  private isValueBelowRange(value: any, refRange: string): boolean {
    if (!value || !refRange) return false;

    try {
      const numValue = parseFloat(value.toString());
      if (isNaN(numValue)) return false;

      if (refRange.includes('-')) {
        const [min, max] = refRange.split('-').map(v => parseFloat(v.trim()));
        if (!isNaN(min)) {
          return numValue < min;
        }
      } else if (refRange.includes('>')) {
        const min = parseFloat(refRange.replace('>', '').trim());
        if (!isNaN(min)) {
          return numValue <= min;
        }
      }
    } catch (error) {
      console.error('Error parsing reference range for low check:', error);
    }

    return false;
  }
}

export const pdfResultService = new PdfResultService();
export default pdfResultService;