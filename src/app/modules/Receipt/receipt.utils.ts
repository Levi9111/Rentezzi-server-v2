import { Response } from 'express';
import https from 'https';
import http from 'http';

// ─── Stream PDF from Cloudinary URL to response ───────────────────────────────
// Used by the GET /:id/pdf download endpoint
// Pipes the Cloudinary-hosted PDF directly to the client without downloading
// it to the server first — memory efficient for large files
export const streamPdfToResponse = (
  pdfUrl: string,
  res: Response,
  filename: string,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const protocol = pdfUrl.startsWith('https') ? https : http;

    protocol
      .get(pdfUrl, (fileRes) => {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${filename}.pdf"`,
        );

        fileRes.pipe(res);

        fileRes.on('end', resolve);
        fileRes.on('error', reject);
      })
      .on('error', reject);
  });
};
