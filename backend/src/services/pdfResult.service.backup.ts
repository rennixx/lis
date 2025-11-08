import PDFDocument from 'pdfkit';
import moment from 'moment';
import mongoose from 'mongoose';
import { uploadPDFToGridFS } from '../utils/gridfs';
import { ApiError } from '../utils/ApiError';

interface ResultData {
  result: any;
  patient?: any;
  order?: any;
  test?: any;
}

interface ResultPDFOptions {
  template?: 'standard' | 'compact' | 'detailed' | 'cbc-style';
  includePatientInfo?: boolean;
  includeReferenceRange?: boolean;
  includeNormalRange?: boolean;
  includeBarcode?: boolean;
  includeQR?: boolean;
  includeLabInfo?: boolean;
}

export class PDFResultService {
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

  async generateResultPDF(
    resultData: ResultData,
    options: ResultPDFOptions = {}
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
          Title: `Laboratory Result - ${resultData.result.testName}`,
          Author: 'Central Laboratory Services',
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
      // Handle populated test data for getting test name and code
      const testName = resultData.result.testName ||
                      resultData.test?.testName ||
                      resultData.test?.name ||
                      'Unknown Test';
      const testCode = resultData.result.testCode ||
                      resultData.test?.testCode ||
                      resultData.test?.code ||
                      'UNKNOWN';

      const filename = `Result_${testCode}_${testName}_${moment().format('YYYY-MM-DD_HH-mm-ss')}.pdf`;
      const fileSize = fileBuffer.length;

      console.log(`Result PDF generated in ${generationTime}ms, size: ${fileSize} bytes`);

      return { fileBuffer, filename, fileSize };
    } catch (error) {
      console.error('Result PDF generation error:', error);
      throw new ApiError('Failed to generate result PDF', 500);
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

  private async generateStandardResultPDF(
    doc: any,
    result: any,
    patient?: any,
    order?: any,
    test?: any,
    options: ResultPDFOptions = {}
  ): Promise<void> {
    let yPosition = 80;

    // Lab Header
    if (options.includeLabInfo !== false) {
      await this.addLabHeader(doc, yPosition);
      yPosition += 80;
    }

    // Title Section
    doc.fontSize(20).font('Helvetica-Bold').text('LABORATORY TEST RESULT', 50, yPosition, { align: 'center' });
    yPosition += 35;

    // Patient Information
    if (options.includePatientInfo !== false && patient) {
      doc.fontSize(12).font('Helvetica-Bold').text('PATIENT INFORMATION', 50, yPosition);
      yPosition += 20;

      doc.fontSize(10).font('Helvetica');
      doc.text(`Name: ${patient.firstName || ''} ${patient.lastName || ''}`, 70, yPosition);
      yPosition += 15;
      doc.text(`MRN: ${patient.mrn || 'N/A'}`, 70, yPosition);
      yPosition += 15;
      doc.text(`Age/Sex: ${patient.age || 'N/A'} / ${patient.gender || 'N/A'}`, 70, yPosition);
      yPosition += 15;
      doc.text(`Phone: ${patient.phone || 'N/A'}`, 70, yPosition);
      yPosition += 25;
    }

    // Test Information
    doc.fontSize(12).font('Helvetica-Bold').text('TEST INFORMATION', 50, yPosition);
    yPosition += 20;

    doc.fontSize(10).font('Helvetica');
    // Handle populated test data
    const testName = result.testName ||
                    test?.testName ||
                    test?.name ||
                    'Unknown Test';
    const testCode = result.testCode ||
                    test?.testCode ||
                    test?.code ||
                    'UNKNOWN';

    doc.text(`Test Name: ${testName}`, 70, yPosition);
    yPosition += 15;
    doc.text(`Test Code: ${testCode}`, 70, yPosition);
    yPosition += 15;
    doc.text(`Order Number: ${result.orderNumber || 'N/A'}`, 70, yPosition);
    yPosition += 15;
    doc.text(`Specimen Type: ${result.specimenType || 'N/A'}`, 70, yPosition);
    yPosition += 15;
    doc.text(`Collection Date: ${result.collectionDate ? moment(result.collectionDate).format('YYYY-MM-DD') : 'N/A'}`, 70, yPosition);
    yPosition += 15;
    doc.text(`Analysis Date: ${result.analysisDate ? moment(result.analysisDate).format('YYYY-MM-DD') : 'N/A'}`, 70, yPosition);
    yPosition += 25;

    // Result Section - Highlight this as the main focus
    doc.fontSize(12).font('Helvetica-Bold').text('TEST RESULT', 50, yPosition);
    yPosition += 20;

    // Create a highlighted box for the result
    const resultBoxY = yPosition - 10;
    doc.rect(45, resultBoxY, 510, 80).fillAndStroke('#f0f9ff', '#0ea5e9');

    doc.fontSize(14).font('Helvetica-Bold').fill('#0c4a6e');
    doc.text(`Result Value: ${result.value || 'N/A'} ${result.unit || ''}`, 60, yPosition + 10);
    yPosition += 25;

    doc.fontSize(12).font('Helvetica').fill('#0c4a6e');
    doc.text(`Reference Range: ${result.referenceRange || 'N/A'}`, 60, yPosition);
    yPosition += 20;

    // Status indicator
    const statusColor = result.isAbnormal ? '#dc2626' : '#059669';
    const statusText = result.isAbnormal ? 'ABNORMAL' : 'NORMAL';
    doc.fillColor(statusColor).font('Helvetica-Bold').text(`Status: ${statusText}`, 60, yPosition);
    doc.fillColor('black');
    yPosition += 25;

    if (result.criticalValue) {
      doc.fillColor('#dc2626').font('Helvetica-Bold').text('⚠ CRITICAL VALUE', 60, yPosition);
      doc.fillColor('black');
      yPosition += 20;
    }

    // Additional Information
    if (result.method || result.equipment) {
      doc.fontSize(12).font('Helvetica-Bold').text('METHODOLOGY', 50, yPosition);
      yPosition += 20;

      doc.fontSize(10).font('Helvetica');
      if (result.method) {
        doc.text(`Method: ${result.method}`, 70, yPosition);
        yPosition += 15;
      }
      if (result.equipment) {
        doc.text(`Equipment: ${result.equipment}`, 70, yPosition);
        yPosition += 15;
      }
      yPosition += 10;
    }

    // Notes and Comments
    if (result.notes || result.comments) {
      doc.fontSize(12).font('Helvetica-Bold').text('NOTES & COMMENTS', 50, yPosition);
      yPosition += 20;

      doc.fontSize(10).font('Helvetica');
      if (result.notes) {
        doc.text(`Notes: ${result.notes}`, 70, yPosition);
        yPosition += 15;
      }
      if (result.comments) {
        doc.text(`Comments: ${result.comments}`, 70, yPosition);
        yPosition += 15;
      }
      yPosition += 10;
    }

    // Verification Information
    if (result.verifiedByUser || result.verificationDate) {
      doc.fontSize(12).font('Helvetica-Bold').text('VERIFICATION', 50, yPosition);
      yPosition += 20;

      doc.fontSize(10).font('Helvetica');
      if (result.verifiedByUser) {
        doc.text(`Verified By: ${result.verifiedByUser}`, 70, yPosition);
        yPosition += 15;
      }
      if (result.verificationDate) {
        doc.text(`Verification Date: ${moment(result.verificationDate).format('YYYY-MM-DD HH:mm')}`, 70, yPosition);
        yPosition += 15;
      }
      yPosition += 10;
    }

    // Footer with timestamps
    this.addFooter(doc, result, patient, order);
  }

  private async generateCompactResultPDF(
    doc: any,
    result: any,
    patient?: any,
    order?: any,
    test?: any,
    options: ResultPDFOptions = {}
  ): Promise<void> {
    let yPosition = 80;

    // Compact header
    doc.fontSize(16).font('Helvetica-Bold').text('LABORATORY RESULT', 50, yPosition, { align: 'center' });
    yPosition += 30;

    // Patient info (compact)
    if (patient) {
      doc.fontSize(10).font('Helvetica').text(
        `Patient: ${patient.firstName || ''} ${patient.lastName || ''} (${patient.mrn || 'N/A'})`,
        50, yPosition
      );
      yPosition += 20;
    }

    // Test info (compact)
    doc.fontSize(10).font('Helvetica-Bold').text(`Test: ${result.testName || 'N/A'} (${result.testCode || 'N/A'})`, 50, yPosition);
    yPosition += 20;

    // Result (prominent)
    doc.fontSize(14).font('Helvetica-Bold').text(`Result: ${result.value || 'N/A'} ${result.unit || ''}`, 50, yPosition);
    yPosition += 20;

    doc.fontSize(10).font('Helvetica').text(`Reference: ${result.referenceRange || 'N/A'}`, 50, yPosition);
    yPosition += 20;

    // Status
    const statusColor = result.isAbnormal ? '#dc2626' : '#059669';
    const statusText = result.isAbnormal ? 'ABNORMAL' : 'NORMAL';
    doc.fillColor(statusColor).font('Helvetica-Bold').text(`Status: ${statusText}`, 50, yPosition);
    doc.fillColor('black');
    yPosition += 20;

    // Additional info
    if (result.collectionDate) {
      doc.text(`Collected: ${moment(result.collectionDate).format('YYYY-MM-DD')}`, 50, yPosition);
      yPosition += 15;
    }

    if (result.verifiedByUser) {
      doc.text(`Verified by: ${result.verifiedByUser}`, 50, yPosition);
      yPosition += 15;
    }

    // Footer
    this.addFooter(doc, result, patient, order);
  }

  private async generateDetailedResultPDF(
    doc: any,
    result: any,
    patient?: any,
    order?: any,
    test?: any,
    options: ResultPDFOptions = {}
  ): Promise<void> {
    let yPosition = 80;

    // Detailed lab header
    if (options.includeLabInfo !== false) {
      await this.addDetailedLabHeader(doc, yPosition);
      yPosition += 120;
    }

    // Title with barcode space
    doc.fontSize(20).font('Helvetica-Bold').text('DETAILED LABORATORY TEST RESULT', 50, yPosition, { align: 'center' });
    yPosition += 35;

    // Add space for barcode
    doc.rect(200, yPosition, 200, 50).stroke();
    doc.fontSize(8).font('Helvetica').text(`${result._id}`, 250, yPosition + 20, { align: 'center' });
    yPosition += 60;

    // Comprehensive patient information
    if (patient) {
      doc.fontSize(12).font('Helvetica-Bold').text('PATIENT DEMOGRAPHICS', 50, yPosition);
      yPosition += 20;

      doc.fontSize(10).font('Helvetica');
      const patientInfo = [
        `Name: ${patient.firstName || ''} ${patient.lastName || ''}`,
        `MRN: ${patient.mrn || 'N/A'}`,
        `Date of Birth: ${patient.dateOfBirth ? moment(patient.dateOfBirth).format('YYYY-MM-DD') : 'N/A'}`,
        `Age: ${patient.age || 'N/A'}`,
        `Gender: ${patient.gender || 'N/A'}`,
        `Blood Type: ${patient.bloodType || 'N/A'}`,
        `Phone: ${patient.phone || 'N/A'}`,
        `Email: ${patient.email || 'N/A'}`,
        `Address: ${patient.address || 'N/A'}`
      ];

      patientInfo.forEach(info => {
        doc.text(info, 70, yPosition);
        yPosition += 15;
      });
      yPosition += 10;
    }

    // Comprehensive test information
    doc.fontSize(12).font('Helvetica-Bold').text('TEST DETAILS', 50, yPosition);
    yPosition += 20;

    doc.fontSize(10).font('Helvetica');
    const testInfo = [
      `Test Name: ${result.testName || 'N/A'}`,
      `Test Code: ${result.testCode || 'N/A'}`,
      `Order Number: ${result.orderNumber || 'N/A'}`,
      `Specimen Type: ${result.specimenType || 'N/A'}`,
      `Collection Date/Time: ${result.collectionDate ? moment(result.collectionDate).format('YYYY-MM-DD HH:mm') : 'N/A'}`,
      `Analysis Date/Time: ${result.analysisDate ? moment(result.analysisDate).format('YYYY-MM-DD HH:mm') : 'N/A'}`,
      `Result Entry Date/Time: ${result.createdAt ? moment(result.createdAt).format('YYYY-MM-DD HH:mm') : 'N/A'}`,
      `Turnaround Time: ${result.turnaroundTime ? `${result.turnaroundTime} minutes` : 'N/A'}`,
      `Equipment: ${result.equipment || 'N/A'}`,
      `Method: ${result.method || 'N/A'}`
    ];

    testInfo.forEach(info => {
      doc.text(info, 70, yPosition);
      yPosition += 15;
    });
    yPosition += 10;

    // Detailed result section with normal ranges
    doc.fontSize(12).font('Helvetica-Bold').text('RESULT ANALYSIS', 50, yPosition);
    yPosition += 20;

    // Result box with enhanced styling
    doc.rect(45, yPosition - 10, 510, 100).fillAndStroke('#f8fafc', '#334155');

    doc.fontSize(16).font('Helvetica-Bold').fill('#0f172a');
    doc.text(`Result: ${result.value || 'N/A'} ${result.unit || ''}`, 60, yPosition + 10);
    yPosition += 25;

    doc.fontSize(11).font('Helvetica').fill('#475569');
    doc.text(`Reference Range: ${result.referenceRange || 'N/A'}`, 60, yPosition);
    yPosition += 20;

    if (options.includeNormalRange !== false && result.normalRange) {
      doc.text(`Normal Range: ${JSON.stringify(result.normalRange)}`, 60, yPosition);
      yPosition += 20;
    }

    // Status with enhanced styling
    const statusColor = result.isAbnormal ? '#dc2626' : '#059669';
    const statusText = result.isAbnormal ? 'ABNORMAL' : 'NORMAL';
    doc.fillColor(statusColor).font('Helvetica-Bold').fontSize(12).text(`Status: ${statusText}`, 60, yPosition);
    doc.fillColor('black');
    yPosition += 25;

    if (result.criticalValue) {
      doc.fillColor('#dc2626').font('Helvetica-Bold').text('⚠ CRITICAL VALUE - Immediate attention required', 60, yPosition);
      doc.fillColor('black');
      yPosition += 20;
    }

    yPosition += 20;

    // Quality control information
    if (result.qualityControl) {
      doc.fontSize(12).font('Helvetica-Bold').text('QUALITY CONTROL', 50, yPosition);
      yPosition += 20;

      doc.fontSize(10).font('Helvetica');
      if (result.qualityControl.controlId) {
        doc.text(`Control ID: ${result.qualityControl.controlId}`, 70, yPosition);
        yPosition += 15;
      }
      if (result.qualityControl.accepted !== undefined) {
        const qcStatus = result.qualityControl.accepted ? 'Accepted' : 'Rejected';
        const qcColor = result.qualityControl.accepted ? '#059669' : '#dc2626';
        doc.fillColor(qcColor).text(`QC Status: ${qcStatus}`, 70, yPosition);
        doc.fillColor('black');
        yPosition += 15;
      }
      yPosition += 10;
    }

    // Notes and methodology
    if (result.notes || result.comments || result.method) {
      doc.fontSize(12).font('Helvetica-Bold').text('ADDITIONAL INFORMATION', 50, yPosition);
      yPosition += 20;

      doc.fontSize(10).font('Helvetica');
      if (result.method) {
        doc.text(`Methodology: ${result.method}`, 70, yPosition);
        yPosition += 15;
      }
      if (result.notes) {
        doc.text(`Notes: ${result.notes}`, 70, yPosition);
        yPosition += 15;
      }
      if (result.comments) {
        doc.text(`Comments: ${result.comments}`, 70, yPosition);
        yPosition += 15;
      }
      yPosition += 10;
    }

    // Verification and audit trail
    doc.fontSize(12).font('Helvetica-Bold').text('VERIFICATION & AUDIT TRAIL', 50, yPosition);
    yPosition += 20;

    doc.fontSize(10).font('Helvetica');
    if (result.enteredByUser) {
      doc.text(`Entered By: ${result.enteredByUser}`, 70, yPosition);
      yPosition += 15;
    }
    if (result.verifiedByUser) {
      doc.text(`Verified By: ${result.verifiedByUser}`, 70, yPosition);
      yPosition += 15;
    }
    if (result.verificationDate) {
      doc.text(`Verification Date: ${moment(result.verificationDate).format('YYYY-MM-DD HH:mm:ss')}`, 70, yPosition);
      yPosition += 15;
    }

    // Audit trail
    doc.text(`Created: ${moment(result.createdAt).format('YYYY-MM-DD HH:mm:ss')}`, 70, yPosition);
    yPosition += 15;
    doc.text(`Last Updated: ${moment(result.updatedAt).format('YYYY-MM-DD HH:mm:ss')}`, 70, yPosition);
    yPosition += 15;

    // Detailed footer
    this.addDetailedFooter(doc, result, patient, order);
  }

  private async addLabHeader(doc: any, yPosition: number): Promise<void> {
    // Lab name and info
    doc.fontSize(14).font('Helvetica-Bold').text(this.labInfo.name, 50, yPosition, { align: 'center' });
    yPosition += 20;

    doc.fontSize(10).font('Helvetica').text(this.labInfo.address, 50, yPosition, { align: 'center' });
    yPosition += 15;

    doc.fontSize(10).font('Helvetica').text(`${this.labInfo.phone} | ${this.labInfo.email}`, 50, yPosition, { align: 'center' });
    yPosition += 15;

    doc.fontSize(9).font('Helvetica-Oblique').text(this.labInfo.accreditation, 50, yPosition, { align: 'center' });
    yPosition += 15;

    // Separator line
    doc.moveTo(50, yPosition).lineTo(560, yPosition).stroke();
  }

  private async addDetailedLabHeader(doc: any, yPosition: number): Promise<void> {
    // Enhanced lab header with more details
    doc.fontSize(16).font('Helvetica-Bold').text(this.labInfo.name, 50, yPosition, { align: 'center' });
    yPosition += 25;

    doc.fontSize(10).font('Helvetica').text(this.labInfo.address, 50, yPosition, { align: 'center' });
    yPosition += 15;

    doc.fontSize(10).font('Helvetica').text(`Phone: ${this.labInfo.phone} | Email: ${this.labInfo.email}`, 50, yPosition, { align: 'center' });
    yPosition += 15;

    doc.fontSize(10).font('Helvetica').text(`Website: ${this.labInfo.website}`, 50, yPosition, { align: 'center' });
    yPosition += 15;

    doc.fontSize(9).font('Helvetica-Oblique').text(this.labInfo.accreditation, 50, yPosition, { align: 'center' });
    yPosition += 15;

    doc.fontSize(9).font('Helvetica').text(`License No: ${this.labInfo.licenseNo}`, 50, yPosition, { align: 'center' });
    yPosition += 20;

    // Enhanced separator
    doc.moveTo(50, yPosition).lineTo(560, yPosition).lineWidth(2).stroke();
    doc.lineWeight(1);
  }

  private addFooter(doc: any, result: any, patient?: any, order?: any): void {
    const pageHeight = doc.page.height;
    let yPosition = pageHeight - 100;

    // Separator line
    doc.moveTo(50, yPosition).lineTo(560, yPosition).stroke();
    yPosition += 15;

    // Footer information
    doc.fontSize(8).font('Helvetica');
    doc.text(`Result ID: ${result._id}`, 50, yPosition);
    doc.text(`Generated on: ${moment().format('YYYY-MM-DD HH:mm:ss')}`, 300, yPosition, { align: 'center' });
    doc.text(`Page 1 of 1`, 560, yPosition, { align: 'right' });
    yPosition += 12;

    doc.text(`${this.labInfo.name} - ${this.labInfo.accreditation}`, 50, yPosition);
    yPosition += 12;

    // Disclaimer
    doc.fontSize(7).font('Helvetica-Oblique').text(
      'This is a computer-generated document. No signature is required.',
      50, yPosition
    );
  }

  private addDetailedFooter(doc: any, result: any, patient?: any, order?: any): void {
    const pageHeight = doc.page.height;
    let yPosition = pageHeight - 120;

    // Enhanced separator
    doc.moveTo(50, yPosition).lineTo(560, yPosition).lineWidth(2).stroke();
    doc.lineWeight(1);
    yPosition += 20;

    // Comprehensive footer information
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text(`Result ID: ${result._id}`, 50, yPosition);
    doc.text(`Report Generated: ${moment().format('YYYY-MM-DD HH:mm:ss')}`, 350, yPosition);
    yPosition += 15;

    doc.fontSize(8).font('Helvetica');
    doc.text(`Order: ${result.orderNumber || 'N/A'}`, 50, yPosition);
    doc.text(`Test Code: ${result.testCode || 'N/A'}`, 200, yPosition);
    doc.text(`Status: ${result.status}`, 350, yPosition);
    doc.text(`Page 1 of 1`, 560, yPosition, { align: 'right' });
    yPosition += 15;

    doc.text(`${this.labInfo.name} - ${this.labInfo.accreditation}`, 50, yPosition);
    doc.text(`License: ${this.labInfo.licenseNo}`, 350, yPosition);
    yPosition += 15;

    // Detailed disclaimer
    doc.fontSize(7).font('Helvetica-Oblique');
    const disclaimer = 'This document contains confidential patient information. Handle with care and maintain confidentiality. ' +
                      'This is a computer-generated report and does not require a manual signature. ' +
                      'For questions or concerns, please contact the laboratory.';

    doc.text(disclaimer, 50, yPosition, { width: 510, align: 'justify' });
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
    console.log('🎯 [CBC TEMPLATE] Result data:', JSON.stringify(result, null, 2));
    console.log('🎯 [CBC TEMPLATE] Patient data:', JSON.stringify(patient, null, 2));

    // Helper function for drawing lines
    const drawLine = (x1: number, y1: number, x2: number, y2: number, width: number = 1) => {
      doc.moveTo(x1, y1).lineTo(x2, y2).lineWidth(width).stroke();
    };

    // Helper function for drawing rectangles with background
    const drawRect = (x: number, y: number, width: number, height: number, fillColor?: string) => {
      if (fillColor) {
        doc.fillColor(fillColor).rect(x, y, width, height).fill();
        doc.fillColor('black');
      }
      doc.rect(x, y, width, height).stroke();
    };

    let yPosition = 0;

    // Header with gradient effect (simulated with blue background)
    drawRect(0, yPosition, 612, 80, '#0066cc');
    doc.fillColor('white');

    // Lab title
    doc.fontSize(28).font('Helvetica-Bold');
    doc.text('💧 LAB SIIS', 306, yPosition + 25, { align: 'center' });

    doc.fontSize(12).font('Helvetica');
    doc.text('PATHOLOGY SOFTWARE', 306, yPosition + 45, { align: 'center' });

    // Lab address on the right
    doc.fontSize(11).text('A103-104, Tulsi Complex,', 562, yPosition + 20, { align: 'right' });
    doc.text('Near Crystal mall,', 562, yPosition + 35, { align: 'right' });
    doc.text('S G Road, Ahmedabad', 562, yPosition + 50, { align: 'right' });

    yPosition += 80;

    // Sample report badge
    doc.save();
    doc.fillColor('#ff0066');
    doc.translate(20, yPosition + 20);
    doc.rotate(-45 * Math.PI / 180);
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Sample Report', -30, 0, { align: 'center' });
    doc.restore();
    doc.fillColor('black');

    yPosition += 20;

    // Patient information section with border
    drawRect(20, yPosition, 572, 160);

    // Left column - Patient details
    drawRect(20, yPosition, 286, 160);

    doc.fontSize(14).font('Helvetica');
    const patientName = `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || '_____________________';
    const age = patient?.dateOfBirth ? moment().diff(moment(patient.dateOfBirth), 'years') : '___';
    const gender = patient?.gender || '___';
    const patientId = patient?.patientId || '_________________';

    doc.text('Name:', 30, yPosition + 20);
    doc.text(patientName, 150, yPosition + 20);

    doc.text('Age:', 30, yPosition + 40);
    doc.text(age, 150, yPosition + 40);
    doc.text(' Years', 170, yPosition + 40);

    doc.text('Sex:', 30, yPosition + 60);
    doc.text(gender, 150, yPosition + 60);

    doc.text('PID:', 30, yPosition + 80);
    doc.text(patientId, 150, yPosition + 80);

    // QR Code placeholder
    drawRect(30, yPosition + 100, 80, 80);
    // Simulate QR code pattern
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if ((i + j) % 2 === 0) {
          doc.rect(30 + i * 10, yPosition + 100 + j * 10, 10, 10).fill();
        }
      }
    }

    // Right column - Sample details
    doc.text('Sample Collected At:', 306, yPosition + 20);
    doc.fontSize(13);
    doc.text('125, Shivam Bungalow, S G', 306, yPosition + 40);
    doc.text('Road, Ahmedabad', 306, yPosition + 55);

    doc.fontSize(14);
    doc.text('Ref. By:', 306, yPosition + 80);
    const doctorName = result.orderedByUser || 'Doctor Name';
    doc.text(`Dr. ${doctorName}`, 356, yPosition + 80);

    // Timestamps
    const registeredDate = result.createdAt ? moment(result.createdAt).format('DD/MM/YYYY h:mm A') : '__/__/____ __:__ AM/PM';
    const collectedDate = result.collectionDate ? moment(result.collectionDate).format('DD/MM/YYYY h:mm A') : '__/__/____ __:__ AM/PM';
    const receivedDate = result.createdAt ? moment(result.createdAt).format('DD/MM/YYYY h:mm A') : '__/__/____ __:__ AM/PM';
    const reportedDate = result.analysisDate ? moment(result.analysisDate).format('DD/MM/YYYY h:mm A') : '__/__/____ __:__ AM/PM';

    doc.text('Registered on:', 306, yPosition + 110);
    doc.text(registeredDate, 395, yPosition + 110);

    doc.text('Collected on:', 306, yPosition + 130);
    doc.text(collectedDate, 395, yPosition + 130);

    doc.text('Received on:', 306, yPosition + 150);
    doc.text(receivedDate, 395, yPosition + 150);

    doc.text('Reported on:', 306, yPosition + 170);
    doc.text(reportedDate, 395, yPosition + 170);

    yPosition += 180;

    // Test header
    drawRect(20, yPosition, 572, 35, '#f0f0f0');
    doc.fontSize(16).font('Helvetica-Bold');
    doc.text('Complete Blood Count (CBC)', 306, yPosition + 12, { align: 'center' });

    yPosition += 35;

    // Test table
    const tableHeaders = ['Investigation', 'Result', 'Ref. Value', 'Unit'];
    const columnWidths = [200, 100, 150, 122];
    let xPos = 20;

    // Table header
    drawRect(20, yPosition, 572, 25, '#e0e0e0');
    doc.fontSize(13).font('Helvetica-Bold');
    tableHeaders.forEach((header, index) => {
      doc.text(header, xPos + 10, yPosition + 15);
      xPos += columnWidths[index];
    });

    yPosition += 25;

    // Primary sample type row
    doc.fontSize(13).font('Helvetica-Oblique');
    doc.text('Primary Sample Type: Blood', 30, yPosition + 15);
    yPosition += 25;

    // Test categories and results
    const testCategories = [
      {
        name: 'HEMOGLOBIN',
        tests: [
          { name: 'Hemoglobin (Hb)', value: result.value || '_____', refRange: '13.0 - 17.0', unit: 'g/dL' }
        ]
      },
      {
        name: 'RBC COUNT',
        tests: [
          { name: 'Total RBC count', value: '_____', refRange: '4.5 - 5.5', unit: 'mill/cumm' }
        ]
      },
      {
        name: 'BLOOD INDICES',
        tests: [
          { name: 'Packed Cell Volume (PCV)', value: '_____', refRange: '40 - 50', unit: '%', isLow: true },
          { name: 'Mean Corpuscular Volume', value: '_____', refRange: '50 - 62', unit: '%' },
          { name: 'RDW', value: '_____', refRange: '11.6 - 14.0', unit: '%' }
        ]
      },
      {
        name: 'WBC COUNT',
        tests: [
          { name: 'Total WBC count', value: '_____', refRange: '4000-11000', unit: 'cumm' }
        ]
      },
      {
        name: 'DIFFERENTIAL WBC COUNT',
        tests: [
          { name: 'Neutrophils', value: '_____', refRange: '50 - 62', unit: '%' },
          { name: 'Lymphocytes', value: '_____', refRange: '20 - 40', unit: '%' },
          { name: 'Eosinophils', value: '_____', refRange: '00 - 06', unit: '%' },
          { name: 'Monocytes', value: '_____', refRange: '00 - 10', unit: '%' },
          { name: 'Basophils', value: '_____', refRange: '00 - 02', unit: '%' }
        ]
      },
      {
        name: 'PLATELET COUNT',
        tests: [
          { name: 'Platelet Count', value: '_____', refRange: '150000 - 410000', unit: 'cumm' }
        ]
      }
    ];

    testCategories.forEach(category => {
      // Category header
      drawRect(20, yPosition, 572, 20, '#f8f8f8');
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text(category.name, 30, yPosition + 13);
      yPosition += 20;

      // Test rows
      category.tests.forEach(test => {
        drawRect(20, yPosition, 572, 20);
        xPos = 20;

        // Investigation
        doc.fontSize(13).text(`  ${test.name}`, xPos + 10, yPosition + 13);
        xPos += columnWidths[0];

        // Result
        doc.fontSize(13);
        if (test.value && test.refRange && this.isValueBelowRange(test.value, test.refRange)) {
          doc.fillColor('#d00').font('Helvetica-Bold').text(test.value, xPos + 10, yPosition + 13);
          doc.fillColor('black').font('Helvetica');
        } else {
          doc.text(test.value, xPos + 10, yPosition + 13);
        }
        xPos += columnWidths[1];

        // Reference range
        doc.text(test.refRange, xPos + 10, yPosition + 13);
        xPos += columnWidths[2];

        // Unit
        doc.text(test.unit, xPos + 10, yPosition + 13);

        yPosition += 20;
      });
    });

    yPosition += 10;

    // Instruments section
    doc.fontSize(13);
    doc.text('Instruments: Fully automated cell counter - Mindray 300', 20, yPosition);

    yPosition += 30;

    // Interpretation section
    doc.text('Interpretation:', 20, yPosition);
    drawRect(20, yPosition + 20, 572, 40);
    yPosition += 70;

    // End of report
    doc.fontSize(12).text('Thanks for Reference   ***End of Report***', 306, yPosition, { align: 'center' });

    yPosition += 30;

    // Signatures
    const signatures = [
      { name: 'Dr. Kavya Sharma', title: 'MD (Pathologist)' },
      { name: 'Dr. Sachin Patil', title: 'Pathologist' },
      { name: 'Priyaka Patel', title: 'Lab Technician' }
    ];

    const signatureWidth = 180;
    const signatureX = 60;

    signatures.forEach((sig, index) => {
      const xPos = signatureX + (index * signatureWidth);

      // Signature line
      drawLine(xPos, yPosition, xPos + signatureWidth - 40, yPosition);

      // Name
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text(sig.name, xPos + 40, yPosition + 10);

      // Title
      doc.fontSize(11).fillColor('#666');
      doc.text(sig.title, xPos + 40, yPosition + 25);
      doc.fillColor('black');
    });

    yPosition += 70;

    // Page info
    doc.fontSize(11).fillColor('#666');
    const generatedDate = moment().format('DD/MM/YYYY h:mm A');
    doc.text(`Generated on: ${generatedDate}`, 306, yPosition, { align: 'center' });
    doc.text('Page 1 of 1', 306, yPosition + 15, { align: 'center' });
    doc.fillColor('black');

    yPosition += 40;

    // Contact bar with gradient (simulated)
    const contactBarY = yPosition;
    // Draw gradient effect by drawing multiple rectangles
    for (let i = 0; i < 10; i++) {
      const alpha = i / 10;
      const r = Math.floor(255 * (1 - alpha));
      const g = 0;
      const b = Math.floor(102 * alpha + 102 * (1 - alpha));
      drawRect(20 + i * 57, contactBarY, 57, 30, `rgb(${r},${g},${b})`);
    }

    doc.fillColor('white');
    doc.fontSize(14);
    doc.text('Home Collection Available | Contact Us on: 88668 02121', 306, contactBarY + 10, { align: 'center' });
    doc.text('www.drlogy.com', 306, contactBarY + 25, { align: 'center' });
    doc.text('Click to Contact Us 📞 💬 ✉', 306, contactBarY + 40, { align: 'center' });
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