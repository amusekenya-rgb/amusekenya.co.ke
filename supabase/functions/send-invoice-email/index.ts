import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  line_total: number;
}

interface InvoiceEmailRequest {
  invoiceId: string;
  email: string;
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  notes?: string;
  paymentTerms: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🧾 send-invoice-email function started');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!resendApiKey) throw new Error('RESEND_API_KEY not configured');
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Supabase credentials not configured');

    const requestBody: InvoiceEmailRequest = await req.json();
    const { 
      invoiceId, email, invoiceNumber, customerName, totalAmount, 
      dueDate, items, subtotal, discountAmount, taxAmount, notes, paymentTerms 
    } = requestBody;

    console.log('📧 Sending invoice to:', email, 'Invoice:', invoiceNumber);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check email suppression
    const { data: suppression } = await supabase
      .from('email_suppressions')
      .select('email, suppression_type')
      .eq('email', email)
      .maybeSingle();

    if (suppression) {
      console.warn(`Email suppressed: ${email}`);
      return new Response(
        JSON.stringify({ error: `Email suppressed: ${suppression.suppression_type}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build items table
    const itemsHtml = items.length > 0 
      ? items.map(item => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.description}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">KES ${item.unit_price.toLocaleString()}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.discount_percent > 0 ? `${item.discount_percent}%` : '-'}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">KES ${item.line_total.toLocaleString()}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="5" style="padding: 12px; text-align: center;">Service charges as agreed</td></tr>`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: #2d5016; color: white; padding: 25px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">INVOICE</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${invoiceNumber}</p>
          </div>
          
          <div style="background-color: white; padding: 30px; border: 1px solid #ddd; border-top: none;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
              <div>
                <h3 style="color: #2d5016; margin: 0 0 10px 0;">From:</h3>
                <p style="margin: 0;">Amuse Kenya</p>
                <p style="margin: 0; color: #666;">Karura Forest, Gate F</p>
                <p style="margin: 0; color: #666;">Thigiri Ridge, Nairobi</p>
                <p style="margin: 0; color: #666;">info@amusekenya.co.ke</p>
              </div>
              <div style="text-align: right;">
                <h3 style="color: #2d5016; margin: 0 0 10px 0;">Bill To:</h3>
                <p style="margin: 0; font-weight: bold;">${customerName}</p>
                <p style="margin: 0; color: #666;">${email}</p>
              </div>
            </div>

            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0;"><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p style="margin: 5px 0 0 0;"><strong>Payment Terms:</strong> ${paymentTerms}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background-color: #2d5016; color: white;">
                  <th style="padding: 12px; text-align: left;">Description</th>
                  <th style="padding: 12px; text-align: center;">Qty</th>
                  <th style="padding: 12px; text-align: right;">Unit Price</th>
                  <th style="padding: 12px; text-align: center;">Discount</th>
                  <th style="padding: 12px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="text-align: right; margin-top: 20px;">
              <p style="margin: 5px 0;"><strong>Subtotal:</strong> KES ${subtotal.toLocaleString()}</p>
              ${discountAmount > 0 ? `<p style="margin: 5px 0; color: #28a745;"><strong>Discount:</strong> -KES ${discountAmount.toLocaleString()}</p>` : ''}
              ${taxAmount > 0 ? `<p style="margin: 5px 0;"><strong>Tax:</strong> KES ${taxAmount.toLocaleString()}</p>` : ''}
              <p style="margin: 15px 0 0 0; font-size: 20px; color: #2d5016;"><strong>Total Due: KES ${totalAmount.toLocaleString()}</strong></p>
            </div>

            ${notes ? `
              <div style="margin-top: 30px; padding: 15px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
                <strong>Notes:</strong> ${notes}
              </div>
            ` : ''}

            <div style="margin-top: 30px; padding: 20px; background-color: #e8f5e9; border-radius: 8px; border-left: 4px solid #2d5016;">
              <h3 style="margin-top: 0; color: #2d5016;">Payment Options</h3>
              <p style="margin: 5px 0;"><strong>M-Pesa:</strong> Pay Bill 247247, Account: AMUSE</p>
              <p style="margin: 5px 0;"><strong>Bank Transfer:</strong> Contact us for details</p>
              <p style="margin: 5px 0;"><strong>Cash:</strong> Pay on arrival</p>
            </div>
          </div>
          
          <div style="background-color: #2d5016; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
            <p style="margin: 0;">Questions? Contact us at info@amusekenya.co.ke or +254 114 705 763</p>
            <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.8;">&copy; 2025 Amuse Kenya. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    const resend = new Resend(resendApiKey);
    
    const emailResponse = await resend.emails.send({
      from: 'Amuse Kenya <info@amusekenya.co.ke>',
      to: [email],
      subject: `Invoice ${invoiceNumber} from Amuse Kenya`,
      html: emailHtml,
    });

    if (emailResponse.error) {
      throw new Error(emailResponse.error.message);
    }

    console.log('✅ Invoice email sent:', emailResponse);

    // Update invoice status to sent
    await supabase
      .from('invoices')
      .update({ status: 'sent' })
      .eq('id', invoiceId);

    // Track delivery
    await supabase
      .from('email_deliveries')
      .insert({
        email,
        message_id: emailResponse.data?.id || `resend-${Date.now()}`,
        recipient_type: 'invoice',
        email_type: 'invoice',
        subject: `Invoice ${invoiceNumber} from Amuse Kenya`,
        status: 'sent',
        sent_at: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error('❌ Error sending invoice email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
