import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { CampRegistration } from '@/types/campRegistration';

export const qrCodeService = {
  /**
   * Generate QR code as data URL
   */
  async generateQRCode(qrCodeData: string): Promise<string> {
    try {
      const dataUrl = await QRCode.toDataURL(qrCodeData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return dataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  },

  /**
   * Generate unique QR code data string
   */
  generateQRCodeData(registrationId: string): string {
    // Create a unique identifier for the QR code
    const qrData = {
      type: 'camp_registration',
      id: registrationId,
      timestamp: Date.now(),
    };
    return JSON.stringify(qrData);
  },

  /**
   * Parse QR code data
   */
  parseQRCodeData(qrCodeData: string): { type: string; id: string; timestamp: number } | null {
    try {
      return JSON.parse(qrCodeData);
    } catch {
      return null;
    }
  },

  /**
   * Generate downloadable PDF with QR code and registration details
   */
  async generateRegistrationPDF(
    registration: CampRegistration,
    qrCodeDataUrl: string,
    type: 'invoice' | 'receipt'
  ): Promise<Blob> {
    const pdf = new jsPDF();
    
    // Header
    pdf.setFontSize(20);
    pdf.text('Amuse Kenya', 105, 20, { align: 'center' });
    
    pdf.setFontSize(16);
    const title = type === 'invoice' ? 'Registration Invoice' : 'Payment Receipt';
    pdf.text(title, 105, 30, { align: 'center' });
    
    // Registration Details
    pdf.setFontSize(12);
    let yPos = 45;
    
    pdf.text(`Registration Number: ${registration.registration_number || 'Pending'}`, 20, yPos);
    yPos += 10;
    pdf.text(`Camp Type: ${registration.camp_type.replace('-', ' ').toUpperCase()}`, 20, yPos);
    yPos += 10;
    pdf.text(`Parent Name: ${registration.parent_name}`, 20, yPos);
    yPos += 10;
    pdf.text(`Email: ${registration.email}`, 20, yPos);
    yPos += 10;
    pdf.text(`Phone: ${registration.phone}`, 20, yPos);
    yPos += 15;
    
    // Children Details
    pdf.setFontSize(14);
    pdf.text('Children Registered:', 20, yPos);
    yPos += 8;
    pdf.setFontSize(11);
    
    registration.children.forEach((child, index) => {
      pdf.text(`${index + 1}. ${child.childName} (Age: ${child.ageRange})`, 25, yPos);
      yPos += 6;
      pdf.text(`   Days: ${child.selectedDays.join(', ')}`, 25, yPos);
      yPos += 6;
      pdf.text(`   Sessions: ${child.selectedSessions.join(', ')}`, 25, yPos);
      yPos += 6;
      pdf.text(`   Amount: KES ${child.price.toFixed(2)}`, 25, yPos);
      yPos += 8;
    });
    
    // Total Amount
    pdf.setFontSize(14);
    pdf.text(`Total Amount: KES ${registration.total_amount.toFixed(2)}`, 20, yPos);
    yPos += 10;
    
    // Payment Status
    if (type === 'receipt') {
      pdf.text(`Payment Status: PAID`, 20, yPos);
      pdf.text(`Payment Method: ${registration.payment_method.toUpperCase()}`, 20, yPos + 8);
      if (registration.payment_reference) {
        pdf.text(`Payment Reference: ${registration.payment_reference}`, 20, yPos + 16);
      }
      yPos += 25;
    } else {
      pdf.text(`Payment Status: ${registration.payment_status.toUpperCase()}`, 20, yPos);
      yPos += 15;
    }
    
    // QR Code
    pdf.text('Scan QR Code for Quick Check-in:', 20, yPos);
    pdf.addImage(qrCodeDataUrl, 'PNG', 60, yPos + 5, 60, 60);
    
    // Footer
    pdf.setFontSize(10);
    pdf.text('Thank you for choosing Amuse Kenya!', 105, 280, { align: 'center' });
    pdf.text('For inquiries: info@amusekenya.co.ke', 105, 285, { align: 'center' });
    
    return pdf.output('blob');
  },

  /**
   * Download PDF
   */
  downloadPDF(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
