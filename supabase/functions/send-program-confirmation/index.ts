import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const postmarkApiKey = Deno.env.get("POSTMARK_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ProgramConfirmationRequest {
  email: string;
  name: string;
  programType: 'kenyan-experiences' | 'homeschooling' | 'school-experience' | 'team-building' | 'parties' | 'day-camps' | 'holiday-camp';
  details: any;
  totalAmount?: number;
  registrationId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const postmarkApiKey = Deno.env.get('POSTMARK_API_KEY');
    if (!postmarkApiKey) {
      throw new Error('POSTMARK_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, name, programType, details, totalAmount, registrationId }: ProgramConfirmationRequest = await req.json();

    // Check if email is suppressed before sending (non-blocking)
    let isSuppressed = false;
    try {
      const { data: suppression } = await supabase
        .from('email_suppressions')
        .select('suppression_type, reason')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (suppression) {
        console.log(`Email suppressed (${suppression.suppression_type}): ${email}`);
        isSuppressed = true;
      }
    } catch (error) {
      console.error('Error checking suppression (continuing anyway):', error);
      // Continue with sending even if check fails
    }

    if (isSuppressed) {
      return new Response(
        JSON.stringify({ error: 'Email address is suppressed' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    console.log('Sending program confirmation email to:', email, 'for program:', programType);

    // Generate program-specific content
    let programTitle = '';
    let programDetails = '';
    let invoiceAmount = totalAmount || 0;

    switch (programType) {
      case 'kenyan-experiences':
        programTitle = 'Kenyan Experiences (5-Day Adventure)';
        programDetails = `
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Circuit:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.circuit}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Participants:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.participants?.length || 0}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Transport Required:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.transport ? 'Yes' : 'No'}</td></tr>
        `;
        break;
      case 'homeschooling':
        programTitle = 'Homeschooling Outdoor Experiences';
        programDetails = `
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Package:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.package}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Number of Children:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.children?.length || 0}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Focus Areas:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.focus?.join(', ') || 'N/A'}</td></tr>
        `;
        break;
      case 'school-experience':
        programTitle = 'School Experience Package';
        programDetails = `
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>School:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.schoolName}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Package:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.package}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Students:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.numberOfStudents}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Location:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.location}</td></tr>
        `;
        break;
      case 'team-building':
        programTitle = 'Team Building Experience';
        programDetails = `
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Occasion:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.occasion}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Package:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.package}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Event Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.eventDate}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Location:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.location}</td></tr>
        `;
        break;
      case 'parties':
        programTitle = 'Party Booking';
        programDetails = `
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Occasion:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.occasion}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Package:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.packageType}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Guests:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.guestsNumber}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Event Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.eventDate}</td></tr>
        `;
        break;
      case 'day-camps':
      case 'holiday-camp':
        programTitle = details.campTitle || 'Holiday Camp Registration';
        const childrenDetails = details.children?.map((child: any, idx: number) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Child ${idx + 1}:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${child.childName || child.name} (${child.ageRange || 'N/A'})</td>
          </tr>
        `).join('') || '';
        programDetails = `
          ${childrenDetails}
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Number of Children:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.children?.length || 0}</td></tr>
        `;
        break;
    }

    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const invoiceNumber = `INV-${Date.now()}`;

    // Construct HTML email with thank you note and invoice
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Registration Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f9;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7f9; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #2F5233 0%, #4A7C4E 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Amuse Bush Camp</h1>
                      <p style="color: #e8f5e9; margin: 10px 0 0 0; font-size: 14px;">Creating Unforgettable Outdoor Experiences</p>
                    </td>
                  </tr>
                  
                  <!-- Thank You Section -->
                  <tr>
                    <td style="padding: 40px 30px; background-color: #ffffff;">
                      <h2 style="color: #2F5233; margin: 0 0 20px 0; font-size: 24px;">Thank You for Your Registration!</h2>
                      
                      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
                        Dear <strong>${name}</strong>,
                      </p>
                      
                      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
                        We are thrilled to confirm your registration for <strong>${programTitle}</strong>. 
                        Your adventure with us is about to begin, and we can't wait to welcome you to the Amuse Bush Camp family!
                      </p>
                      
                      <div style="background-color: #f0f8f0; border-left: 4px solid #4A7C4E; padding: 20px; margin: 25px 0; border-radius: 4px;">
                        <h3 style="color: #2F5233; margin: 0 0 15px 0; font-size: 18px;">Registration Details</h3>
                        <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px; color: #333333;">
                          ${programDetails}
                        </table>
                      </div>
                      
                      <div style="background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0; border-radius: 4px;">
                        <h3 style="color: #f57c00; margin: 0 0 10px 0; font-size: 16px;">📋 What's Next?</h3>
                        <ul style="margin: 10px 0; padding-left: 20px; color: #333333; font-size: 14px; line-height: 1.8;">
                          <li>Our team will review your registration within 24-48 hours</li>
                          <li>We will contact you via email or phone to confirm availability and finalize details</li>
                          <li>Payment instructions will be provided upon confirmation</li>
                          <li>You'll receive a detailed information packet with everything you need to know</li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Invoice Section -->
                  <tr>
                    <td style="padding: 0 30px 40px 30px; background-color: #ffffff;">
                      <div style="border: 2px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                        <div style="background-color: #2F5233; padding: 20px; text-align: center;">
                          <h2 style="color: #ffffff; margin: 0; font-size: 22px;">INVOICE</h2>
                        </div>
                        
                        <div style="padding: 30px;">
                          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                            <tr>
                              <td style="color: #666666; font-size: 14px;">
                                <strong>Invoice Number:</strong> ${invoiceNumber}<br>
                                <strong>Date:</strong> ${currentDate}<br>
                                <strong>Registration ID:</strong> ${registrationId || 'Pending'}
                              </td>
                              <td align="right" style="color: #666666; font-size: 14px;">
                                <strong>Amuse Bush Camp</strong><br>
                                Karura Forest, Gate F<br>
                                Nairobi, Kenya
                              </td>
                            </tr>
                          </table>
                          
                          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; border-top: 2px solid #e0e0e0; border-bottom: 2px solid #e0e0e0;">
                            <tr>
                              <th style="padding: 15px 0; text-align: left; color: #2F5233; font-size: 14px; border-bottom: 1px solid #e0e0e0;">DESCRIPTION</th>
                              <th style="padding: 15px 0; text-align: right; color: #2F5233; font-size: 14px; border-bottom: 1px solid #e0e0e0;">AMOUNT</th>
                            </tr>
                            <tr>
                              <td style="padding: 15px 0; color: #333333; font-size: 14px;">${programTitle}</td>
                              <td style="padding: 15px 0; text-align: right; color: #333333; font-size: 14px;">${invoiceAmount > 0 ? `KES ${invoiceAmount.toLocaleString()}` : 'TBD'}</td>
                            </tr>
                          </table>
                          
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="text-align: right; padding: 10px 0; font-size: 16px; color: #666666;">
                                <strong>Subtotal:</strong>
                              </td>
                              <td style="text-align: right; padding: 10px 0 10px 20px; font-size: 16px; color: #666666; width: 120px;">
                                ${invoiceAmount > 0 ? `KES ${invoiceAmount.toLocaleString()}` : 'TBD'}
                              </td>
                            </tr>
                            <tr>
                              <td style="text-align: right; padding: 10px 0; font-size: 18px; color: #2F5233; border-top: 2px solid #2F5233;">
                                <strong>TOTAL DUE:</strong>
                              </td>
                              <td style="text-align: right; padding: 10px 0 10px 20px; font-size: 18px; color: #2F5233; font-weight: bold; border-top: 2px solid #2F5233; width: 120px;">
                                ${invoiceAmount > 0 ? `KES ${invoiceAmount.toLocaleString()}` : 'TBD'}
                              </td>
                            </tr>
                          </table>
                          
                          ${invoiceAmount === 0 ? `
                          <div style="background-color: #e3f2fd; padding: 15px; margin-top: 20px; border-radius: 4px; border-left: 4px solid #2196f3;">
                            <p style="margin: 0; color: #1565c0; font-size: 14px;">
                              <strong>Note:</strong> Final pricing will be confirmed by our team based on your specific requirements. 
                              You will receive an updated invoice with the exact amount before any payment is required.
                            </p>
                          </div>
                          ` : `
                          <div style="background-color: #f1f8e9; padding: 15px; margin-top: 20px; border-radius: 4px; border-left: 4px solid #8bc34a;">
                            <h4 style="margin: 0 0 10px 0; color: #558b2f; font-size: 16px;">Payment Instructions</h4>
                            <p style="margin: 0 0 10px 0; color: #333333; font-size: 14px;">
                              Please make payment to the following account:
                            </p>
                            <table cellpadding="0" cellspacing="0" style="font-size: 14px; color: #333333;">
                              <tr><td style="padding: 3px 0;"><strong>Bank:</strong></td><td style="padding: 3px 0 3px 10px;">To be provided</td></tr>
                              <tr><td style="padding: 3px 0;"><strong>Account Name:</strong></td><td style="padding: 3px 0 3px 10px;">Amuse Bush Camp</td></tr>
                              <tr><td style="padding: 3px 0;"><strong>Reference:</strong></td><td style="padding: 3px 0 3px 10px;">${invoiceNumber}</td></tr>
                            </table>
                          </div>
                          `}
                        </div>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Contact Section -->
                  <tr>
                    <td style="padding: 30px; background-color: #f9f9f9; border-top: 1px solid #e0e0e0;">
                      <h3 style="color: #2F5233; margin: 0 0 15px 0; font-size: 18px;">Need Assistance?</h3>
                      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
                        Our team is here to help! If you have any questions or need to make changes to your registration, 
                        please don't hesitate to reach out.
                      </p>
                      <table cellpadding="0" cellspacing="0" style="font-size: 14px; color: #333333;">
                        <tr>
                          <td style="padding: 5px 0;">
                            <strong>📧 Email:</strong> <a href="mailto:info@amusebushcamp.com" style="color: #4A7C4E; text-decoration: none;">info@amusebushcamp.com</a>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 5px 0;">
                            <strong>📞 Phone:</strong> <a href="tel:+254700000000" style="color: #4A7C4E; text-decoration: none;">+254 700 000 000</a>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 5px 0;">
                            <strong>📍 Location:</strong> Karura Forest, Gate F, Thigiri Ridge, Nairobi
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #2F5233; padding: 25px 30px; text-align: center;">
                      <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px 0; font-weight: 500;">
                        We look forward to creating unforgettable memories with you! 🌿
                      </p>
                      <p style="color: #b8d4ba; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} Amuse Bush Camp. All rights reserved.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // Send email using Postmark
    const emailResponse = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': postmarkApiKey || '',
      },
      body: JSON.stringify({
        From: 'info@amusebushcamp.com',
        To: email,
        Subject: `Registration Confirmed - ${programTitle}`,
        HtmlBody: htmlContent,
        TextBody: `Thank you for registering for ${programTitle}! We have received your registration and will be in touch soon. Invoice Number: ${invoiceNumber}`,
        MessageStream: 'outbound',
        TrackOpens: true,
        TrackLinks: 'HtmlOnly'
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Postmark API error:', errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const result = await emailResponse.json();
    console.log("Email sent successfully via Postmark:", result);

    // Track email delivery (non-blocking, don't fail if this fails)
    try {
      await supabase
        .from('email_deliveries')
        .insert({
          email: email.toLowerCase(),
          message_id: result.MessageID,
          recipient_type: 'registration',
          recipient_id: registrationId,
          email_type: 'confirmation',
          subject: `Registration Confirmed - ${programTitle}`,
          status: 'sent',
          postmark_data: result
        });
    } catch (error) {
      console.error('Error tracking email delivery (non-critical):', error);
      // Continue - don't fail the request if tracking fails
    }

    return new Response(JSON.stringify({ success: true, messageId: result.MessageID }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-program-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
