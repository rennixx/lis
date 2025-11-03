import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';

// GridFS connection helper
export let gfsBucket: GridFSBucket;

export const initGridFS = () => {
  if (!mongoose.connection.db) {
    throw new Error('Database connection not established');
  }

  gfsBucket = new GridFSBucket(mongoose.connection.db as any, {
    bucketName: 'reports'
  });

  return gfsBucket;
};

// Upload PDF to GridFS
export const uploadPDFToGridFS = async (
  pdfBuffer: Buffer,
  filename: string,
  metadata: any = {}
): Promise<mongoose.Types.ObjectId> => {
  console.log('🔧 [GRIDFS] Starting upload, filename:', filename, 'size:', pdfBuffer.length, 'bytes');

  if (!gfsBucket) {
    console.log('🔧 [GRIDFS] Initializing GridFS bucket...');
    initGridFS();
    console.log('🔧 [GRIDFS] GridFS bucket initialized');
  }

  return new Promise((resolve, reject) => {
    console.log('🔧 [GRIDFS] Creating readable stream...');
    const readableStream = new Readable();
    readableStream.push(pdfBuffer);
    readableStream.push(null);

    console.log('🔧 [GRIDFS] Opening upload stream...');
    const uploadStream = gfsBucket.openUploadStream(filename, {
      metadata: {
        ...metadata,
        uploadedAt: new Date(),
        contentType: 'application/pdf'
      }
    });

    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.error('🔧 [GRIDFS] Upload timeout after 10 seconds');
      readableStream.destroy();
      uploadStream.destroy();
      reject(new Error('GridFS upload timeout'));
    }, 10000); // 10 second timeout

    console.log('🔧 [GRIDFS] Starting pipe operation...');
    readableStream
      .pipe(uploadStream)
      .on('error', (error) => {
        console.error('🔧 [GRIDFS] Upload error:', error);
        clearTimeout(timeout);
        reject(error);
      })
      .on('finish', () => {
        console.log('🔧 [GRIDFS] Upload finished, file ID:', uploadStream.id);
        clearTimeout(timeout);
        resolve(uploadStream.id as mongoose.Types.ObjectId);
      });
  });
};

// Download PDF from GridFS
export const downloadPDFFromGridFS = async (fileId: mongoose.Types.ObjectId): Promise<Buffer> => {
  if (!gfsBucket) {
    initGridFS();
  }

  return new Promise((resolve, reject) => {
    const downloadStream = gfsBucket.openDownloadStream(fileId);
    const chunks: Buffer[] = [];

    downloadStream
      .on('error', (error) => {
        reject(error);
      })
      .on('data', (chunk) => {
        chunks.push(chunk);
      })
      .on('end', () => {
        resolve(Buffer.concat(chunks));
      });
  });
};

// Get PDF metadata from GridFS
export const getPDFMetadata = async (fileId: mongoose.Types.ObjectId): Promise<any> => {
  if (!gfsBucket) {
    initGridFS();
  }

  const files = await gfsBucket.find({ _id: fileId }).toArray();
  return files[0] || null;
};

// Delete PDF from GridFS
export const deletePDFFromGridFS = async (fileId: mongoose.Types.ObjectId): Promise<boolean> => {
  if (!gfsBucket) {
    initGridFS();
  }

  try {
    await gfsBucket.delete(fileId);
    return true;
  } catch (error) {
    throw error;
  }
};

// Get PDF stream for direct response
export const getPDFStream = (fileId: mongoose.Types.ObjectId) => {
  if (!gfsBucket) {
    initGridFS();
  }

  return gfsBucket.openDownloadStream(fileId);
};

// Check if PDF exists in GridFS
export const pdfExists = async (fileId: mongoose.Types.ObjectId): Promise<boolean> => {
  try {
    const metadata = await getPDFMetadata(fileId);
    return metadata !== null;
  } catch (error) {
    return false;
  }
};

// Get PDF file size from GridFS
export const getPDFSize = async (fileId: mongoose.Types.ObjectId): Promise<number> => {
  try {
    const metadata = await getPDFMetadata(fileId);
    return metadata?.length || 0;
  } catch (error) {
    return 0;
  }
};

// Clean up old PDFs (utility function for maintenance)
export const cleanupOldPDFs = async (daysOld: number = 30): Promise<number> => {
  if (!gfsBucket) {
    initGridFS();
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const oldFiles = await gfsBucket.find({
    'metadata.uploadedAt': { $lt: cutoffDate }
  }).toArray();

  let deletedCount = 0;

  for (const file of oldFiles) {
    try {
      await gfsBucket.delete(file._id);
      deletedCount++;
    } catch (error) {
      console.error(`Failed to delete file ${file._id}:`, error);
    }
  }

  return deletedCount;
};

// Initialize GridFS on module load
if (mongoose.connection.readyState === 1) {
  initGridFS();
} else {
  mongoose.connection.once('connected', () => {
    initGridFS();
  });
}