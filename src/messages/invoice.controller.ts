import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { GoogleCloudStorageUtil } from 'src/common/utils/google-cloud-storage.util';

@Controller('view')
export class InvoiceLinkController {
  constructor(private readonly storageService: GoogleCloudStorageUtil) {}

  @Get(':orderNumber')
  async redirectToInvoice(
    @Param('orderNumber') orderNumber: string,
    @Res() res: Response,
  ) {
    // 1. Generate the signed URL on the fly
    const fileName = `invoice_${orderNumber}.pdf`;
    const longUrl = await this.storageService.getSignedUrlOnly(fileName);

    // 2. Redirect the user's browser
    return res.redirect(longUrl);
  }
}
