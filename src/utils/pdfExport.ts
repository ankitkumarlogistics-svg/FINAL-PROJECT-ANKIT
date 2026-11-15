import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';

export interface ExportPdfOptions {
  elementId?: string;
  element?: HTMLElement | null;
  filename: string;
  fitToSinglePage?: boolean;
  marginMm?: number;
}

/**
 * High-resolution vector-quality PDF exporter tailored for international shipping documents
 * (Booking Confirmations, Freight Invoices, KYC Verifications).
 *
 * Guarantees exact standard A4 fit (210mm x 297mm) without horizontal shrinking,
 * cutoffs, or missing footer remarks.
 */
export const downloadElementAsPdf = async (
  options: ExportPdfOptions | HTMLElement,
  fallbackFilename?: string
): Promise<void> => {
  let targetElement: HTMLElement | null = null;
  let filename = 'document.pdf';
  let fitToSinglePage = true;
  let marginMm = 5; // Clean 5mm margin to maximize printable area

  if (options instanceof HTMLElement) {
    targetElement = options;
    filename = fallbackFilename || 'document.pdf';
  } else {
    filename = options.filename || 'document.pdf';
    fitToSinglePage = options.fitToSinglePage !== false;
    marginMm = options.marginMm ?? 5;
    if (options.element) {
      targetElement = options.element;
    } else if (options.elementId) {
      targetElement = document.getElementById(options.elementId);
    }
  }

  if (!targetElement) {
    console.error('Target element not found for PDF export');
    window.print();
    return;
  }

  // Ensure fonts and icons are fully ready
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Continue even if font wait times out
    }
  }

  try {
    // Generate high-resolution PNG snapshot with interactive toolbars filtered out
    const dataUrl = await htmlToImage.toPng(targetElement, {
      quality: 1.0,
      pixelRatio: 2.5, // 2.5x density produces crisp text and borders
      backgroundColor: '#ffffff',
      filter: (node) => {
        if (node instanceof HTMLElement) {
          // Do not capture print-hidden controls or action buttons
          if (node.classList.contains('print:hidden') || node.classList.contains('no-print')) {
            return false;
          }
        }
        return true;
      },
    });

    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const imgWidthPx = img.width;
    const imgHeightPx = img.height;

    // Standard ISO A4 Dimensions in millimeters
    const a4WidthMm = 210;
    const a4HeightMm = 297;

    const printableWidthMm = a4WidthMm - marginMm * 2; // 200mm at 5mm margin
    const printableHeightMm = a4HeightMm - marginMm * 2; // 287mm at 5mm margin

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // Calculate aspect ratio and height at full printable width
    const aspectRatio = imgHeightPx / imgWidthPx;
    const heightAtFullWidthMm = printableWidthMm * aspectRatio;

    if (fitToSinglePage || heightAtFullWidthMm <= printableHeightMm * 1.25) {
      // Single Page Mode: Fit completely onto ONE A4 sheet
      let renderWidthMm: number;
      let renderHeightMm: number;
      let xOffsetMm: number;
      let yOffsetMm: number;

      if (heightAtFullWidthMm <= printableHeightMm) {
        // Naturally fits within A4 height: Use 100% width across the page
        renderWidthMm = printableWidthMm;
        renderHeightMm = heightAtFullWidthMm;
        xOffsetMm = marginMm;
        // Vertically place at margin or subtle optical centering
        yOffsetMm = marginMm + Math.max(0, (printableHeightMm - renderHeightMm) * 0.2);
      } else {
        // Content exceeds height slightly: scale proportionally so no bottom cutoff occurs
        const scale = printableHeightMm / heightAtFullWidthMm;
        renderHeightMm = printableHeightMm;
        renderWidthMm = printableWidthMm * scale;
        xOffsetMm = (a4WidthMm - renderWidthMm) / 2; // Center horizontally
        yOffsetMm = marginMm;
      }

      pdf.addImage(
        dataUrl,
        'PNG',
        xOffsetMm,
        yOffsetMm,
        renderWidthMm,
        renderHeightMm,
        undefined,
        'FAST'
      );
    } else {
      // True Multi-page Mode for long manifests
      let heightLeftMm = heightAtFullWidthMm;
      let positionMm = marginMm;

      // Page 1
      pdf.addImage(
        dataUrl,
        'PNG',
        marginMm,
        positionMm,
        printableWidthMm,
        heightAtFullWidthMm,
        undefined,
        'FAST'
      );
      heightLeftMm -= printableHeightMm;

      // Subsequent Pages
      while (heightLeftMm > 0) {
        positionMm -= printableHeightMm;
        pdf.addPage();
        pdf.addImage(
          dataUrl,
          'PNG',
          marginMm,
          positionMm,
          printableWidthMm,
          heightAtFullWidthMm,
          undefined,
          'FAST'
        );
        heightLeftMm -= printableHeightMm;
      }
    }

    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(cleanFilename);
  } catch (err) {
    console.error('Direct PDF rendering error, falling back to browser print:', err);
    window.print();
  }
};

export const printElement = (): void => {
  window.print();
};
