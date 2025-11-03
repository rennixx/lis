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
  template?: 'standard' | 'compact' | 'detailed';
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
      const filename = `Result_${resultData.result.testCode || resultData.result.testName}_${moment().format('YYYY-MM-DD_HH-mm-ss')}.pdf`;
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
    const template = options.template || 'standard';

    // Set default font
    doc.font('Helvetica');

    // Generate PDF based on template
    switch (template) {
      case 'compact':
        await this.generateCompactResultPDF(doc, result, patient, order, test, options);
        break;
      case 'detailed':
        await this.generateDetailedResultPDF(doc, result, patient, order, test, options);
        break;
      default:
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
    doc.text(`Test Name: ${result.testName || 'N/A'}`, 70, yPosition);
    yPosition += 15;
    doc.text(`Test Code: ${result.testCode || 'N/A'}`, 70, yPosition);
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
}