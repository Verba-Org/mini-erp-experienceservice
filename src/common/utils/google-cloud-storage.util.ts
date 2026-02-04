import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleCloudStorageUtil {
  private storage: Storage;
  private bucketName: string; // Create this in Google Cloud Console

  constructor(private readonly configService: ConfigService) {
    this.storage = new Storage({
      keyFilename: path.join(
        __dirname,
        '../../resources/gcp/google-cloud-credentials.json',
      ),
      projectId: this.configService.get('GCP_PROJECT_ID'),
    });

    const bucketNameFromEnv = this.configService.get('GCP_BUCKET_NAME');
    if (!bucketNameFromEnv) {
      throw new Error(
        'GCP_BUCKET_NAME is not defined in environment variables',
      );
    }
    this.bucketName = bucketNameFromEnv;
  }

  async uploadAndGetSignedUrl(
    fileName: string,
    fileBuffer: Buffer,
  ): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(`invoices/${fileName}`);

    // 1. Upload the PDF
    await file.save(fileBuffer, {
      contentType: 'application/pdf',
      resumable: false,
    });

    // 2. Generate a Signed URL (Secure & Temporary)
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 1 * 60 * 60 * 1000, // Expires in 24 hours
    });

    return url;
  }

  // Method to get signed URL only (if file already exists)
  async getSignedUrlOnly(fileName: string): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(`invoices/${fileName}`);

    // Generate a Signed URL (Secure & Temporary)
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 1 * 60 * 60 * 1000, // Expires in 1 hour
    });

    return url;
  }
}
