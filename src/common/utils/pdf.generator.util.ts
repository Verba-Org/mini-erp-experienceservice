import { Injectable } from '@nestjs/common';
import { launch } from 'puppeteer';
import { compile } from 'handlebars';
// import all exports from fs and path modules
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfGeneratorUtil {
  async generatePdfFromTemplate(
    templateName: string,
    data: any,
  ): Promise<Buffer> {
    // Load the HTML template
    const templatePath = path.join(
      __dirname,
      '..', // up to src/common/
      '..', // up to src/
      'resources',
      'templates',
      `${templateName}.hbs`,
    );
    const templateContent = fs.readFileSync(templatePath, 'utf-8');

    // Compile the template with Handlebars
    const template = compile(templateContent);

    // Add inline logo image as base64
    const logoPath = path.join(
      __dirname,
      '..',
      '..',
      'resources',
      'templates',
      'logo.png',
    );
    const logoImage = fs.readFileSync(logoPath);
    const logoBase64 = `data:image/png;base64,${logoImage.toString('base64')}`;
    data.logoImage = logoBase64;

    // Generate the final HTML with data

    const html = template(data);

    // Launch Puppeteer to generate PDF
    const browser = await launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true, // Crucial for CSS colors/images
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
  }
}
