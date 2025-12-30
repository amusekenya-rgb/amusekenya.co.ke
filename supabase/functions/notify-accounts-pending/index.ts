import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fixed accounts email for notifications
const ACCOUNTS_EMAIL = "accounts@amusekenya.co.ke";

interface PendingCollectionNotification {
  childName: string;
  parentName: string;
  email: string;
  phone: string;
  amountDue: number;
  campType: string;
  registrationId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: PendingCollectionNotification = await req.json();
    console.log("Sending pending collection notification to:", ACCOUNTS_EMAIL);

    const formattedAmount = new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(data.amountDue);

    const emailResponse = await resend.emails.send({
      from: "Amuse Kenya <info@amusekenya.co.ke>",
      to: [ACCOUNTS_EMAIL],
      subject: `⚠️ Unpaid Check-in: ${data.childName} - ${formattedAmount}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2D5A3D 0%, #4A7C59 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">⚠️ Pending Collection Alert</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <p style="font-size: 16px; color: #333;">A child has checked in without full payment. Action required:</p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h2 style="color: #2D5A3D; margin-top: 0;">${data.childName}</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 40%;">Parent/Guardian:</td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">${data.parentName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Email:</td>
                  <td style="padding: 8px 0; color: #333;">${data.email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Phone:</td>
                  <td style="padding: 8px 0; color: #333;">${data.phone}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Camp Type:</td>
                  <td style="padding: 8px 0; color: #333; text-transform: capitalize;">${data.campType.replace(/-/g, " ")}</td>
                </tr>
                <tr style="background: #fef3c7;">
                  <td style="padding: 12px 8px; color: #92400e; font-weight: bold;">Amount Due:</td>
                  <td style="padding: 12px 8px; color: #92400e; font-weight: bold; font-size: 18px;">${formattedAmount}</td>
                </tr>
              </table>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              Please send an invoice or follow up for payment collection.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://amusekenya.co.ke/admin" 
                 style="background: #2D5A3D; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View in Accounts Portal
              </a>
            </div>
          </div>
          
          <div style="padding: 20px; background: #2D5A3D; text-align: center;">
            <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 12px;">
              Amuse Kenya - Camp Management System
            </p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-accounts-pending function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
