// Resend-based confirmation email sender
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChildDetails {
  childName: string;
  dateOfBirth?: string;
  ageRange?: string;
  selectedDates?: string[];
  selectedSessions?: Record<string, string>;
  sessionTypes?: Record<string, string>; // Fallback
  price?: number;
  totalPrice?: number; // Fallback
  specialNeeds?: string;
}

interface ProgramConfirmationRequest {
  email: string;
  programType: string;
  registrationDetails: {
    parentName?: string;
    campTitle?: string;
    children?: ChildDetails[];
    campType?: string;
    registrationId?: string;
    registrationNumber?: string;
    // Other program-specific fields
    childName?: string;
    schoolName?: string;
    eventDate?: string;
    eventType?: string;
    numberOfGuests?: string;
    message?: string;
  };
  invoiceDetails?: {
    totalAmount: number;
    paymentMethod: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🚀 send-confirmation-email function started');
  console.log(`📍 Request method: ${req.method}`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // Get environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('🔑 Environment check:', {
      hasResendKey: !!resendApiKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });

    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY not configured');
      throw new Error('Email service not configured');
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Supabase credentials not configured');
      throw new Error('Supabase credentials not configured');
    }

    // Parse request body
    const requestBody = await req.text();
    console.log('📦 Raw request body length:', requestBody.length);
    
    const { email, programType, registrationDetails, invoiceDetails }: ProgramConfirmationRequest = JSON.parse(requestBody);
    console.log('📧 Sending confirmation to:', email, 'for program:', programType);
    console.log('📋 Registration details:', JSON.stringify(registrationDetails));

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email is suppressed
    const { data: suppression, error: suppressionError } = await supabase
      .from('email_suppressions')
      .select('email, suppression_type, reason')
      .eq('email', email)
      .maybeSingle();

    if (suppressionError) {
      console.error('Error checking suppression:', suppressionError);
    }

    if (suppression) {
      console.warn(`Email suppressed: ${email} (${suppression.suppression_type})`);
      return new Response(
        JSON.stringify({ 
          error: `Cannot send to ${email}: ${suppression.suppression_type}`,
          suppressed: true 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract parent name with fallback
    const parentName = registrationDetails?.parentName || 'Valued Customer';
    
    // Get camp/program title - use provided title or derive from programType
    let programTitle = registrationDetails?.campTitle || '';
    
    if (!programTitle) {
      switch (programType) {
        case 'kenyan-experiences':
          programTitle = 'Kenyan Experiences (5-Day Program)';
          break;
        case 'homeschooling':
          programTitle = 'Homeschooling Outdoor Experience';
          break;
        case 'school-experience':
          programTitle = 'School Experience Program';
          break;
        case 'team-building':
          programTitle = 'Team Building Experience';
          break;
        case 'parties':
          programTitle = 'Party Experience';
          break;
        case 'day-camps':
          programTitle = 'Nairobi Day Camps';
          break;
        case 'holiday-camp':
          programTitle = registrationDetails?.campTitle || 'Holiday Camp';
          break;
        case 'little-forest':
          programTitle = 'Little Forest Explorers';
          break;
        default:
          programTitle = 'Amuse Kenya Program';
      }
    }

    // Build children details section for camp registrations
    let childrenSection = '';
    if (registrationDetails?.children && registrationDetails.children.length > 0) {
      const childrenHtml = registrationDetails.children.map((child, index) => {
        const selectedDates = child.selectedDates?.join(', ') || 'Not specified';
        // Handle both naming conventions: selectedSessions (from form) or sessionTypes (legacy)
        const sessionsData = child.selectedSessions || child.sessionTypes;
        const sessions = sessionsData 
          ? Object.entries(sessionsData).map(([date, type]) => `${date}: ${type === 'full' ? 'Full Day' : 'Half Day'}`).join(', ')
          : 'Not specified';
        // Handle both naming conventions: price (from form) or totalPrice (legacy)
        const childPrice = child.price || child.totalPrice;
        
        return `
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
            <h4 style="margin: 0 0 10px 0; color: #2d5016;">Child ${index + 1}: ${child.childName || 'Not provided'}</h4>
            <p style="margin: 5px 0;"><strong>Age Group:</strong> ${child.ageRange || 'Not specified'}</p>
            <p style="margin: 5px 0;"><strong>Selected Dates:</strong> ${selectedDates}</p>
            <p style="margin: 5px 0;"><strong>Sessions:</strong> ${sessions}</p>
            ${child.specialNeeds ? `<p style="margin: 5px 0;"><strong>Special Needs:</strong> ${child.specialNeeds}</p>` : ''}
            ${childPrice ? `<p style="margin: 5px 0;"><strong>Amount:</strong> KES ${childPrice.toLocaleString()}</p>` : ''}
          </div>
        `;
      }).join('');
      
      childrenSection = `
        <div style="margin: 20px 0;">
          <h3 style="color: #2d5016;">Registered Children</h3>
          ${childrenHtml}
        </div>
      `;
    }

    // Build program-specific details
    let programDetails = '';
    switch (programType) {
      case 'kenyan-experiences':
        programDetails = `
          <div style="margin: 20px 0;">
            <h3 style="color: #2d5016;">Program Information</h3>
            <ul style="padding-left: 20px;">
              <li><strong>Duration:</strong> 5 Days</li>
              <li><strong>Activities:</strong> Cultural immersion, nature walks, traditional crafts</li>
              <li><strong>Location:</strong> Various locations across Kenya</li>
            </ul>
          </div>
        `;
        break;
      case 'homeschooling':
        programDetails = `
          <div style="margin: 20px 0;">
            <h3 style="color: #2d5016;">Program Information</h3>
            <ul style="padding-left: 20px;">
              <li><strong>Focus:</strong> Nature-based learning and outdoor education</li>
              <li><strong>Activities:</strong> Science experiments, nature exploration, hands-on learning</li>
              <li><strong>Location:</strong> Karura Forest, Nairobi</li>
            </ul>
          </div>
        `;
        break;
      case 'school-experience':
        programDetails = `
          <div style="margin: 20px 0;">
            <h3 style="color: #2d5016;">Program Information</h3>
            <ul style="padding-left: 20px;">
              <li><strong>Type:</strong> Educational outdoor experience for schools</li>
              <li><strong>Activities:</strong> Team building, environmental education, adventure activities</li>
              <li><strong>Location:</strong> Karura Forest, Nairobi</li>
            </ul>
          </div>
        `;
        break;
      case 'team-building':
        programDetails = `
          <div style="margin: 20px 0;">
            <h3 style="color: #2d5016;">Program Information</h3>
            <ul style="padding-left: 20px;">
              <li><strong>Focus:</strong> Corporate team building and bonding</li>
              <li><strong>Activities:</strong> Challenge courses, problem-solving activities, outdoor adventures</li>
              <li><strong>Location:</strong> Karura Forest, Nairobi</li>
            </ul>
          </div>
        `;
        break;
      case 'parties':
        programDetails = `
          <div style="margin: 20px 0;">
            <h3 style="color: #2d5016;">Event Information</h3>
            <ul style="padding-left: 20px;">
              <li><strong>Type:</strong> Birthday parties and special celebrations</li>
              <li><strong>Activities:</strong> Games, nature activities, customized experiences</li>
              <li><strong>Location:</strong> Karura Forest, Nairobi</li>
            </ul>
          </div>
        `;
        break;
      case 'day-camps':
      case 'holiday-camp':
      case 'little-forest':
        programDetails = `
          <div style="margin: 20px 0;">
            <h3 style="color: #2d5016;">Camp Information</h3>
            <ul style="padding-left: 20px;">
              <li><strong>Location:</strong> Karura Forest, Nairobi</li>
              <li><strong>Time:</strong> 8:00 AM - 5:00 PM (Full Day) / 8:00 AM - 12:00 PM (Half Day)</li>
              <li><strong>Activities:</strong> Nature exploration, adventure activities, team games, creative crafts</li>
              <li><strong>What to Bring:</strong> Comfortable clothes, closed shoes, water bottle, sunscreen, packed lunch (full day)</li>
            </ul>
          </div>
        `;
        break;
      default:
        programDetails = '';
    }

    // Build invoice section if provided
    let invoiceSection = '';
    if (invoiceDetails && invoiceDetails.totalAmount) {
      invoiceSection = `
        <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2d5016;">
          <h3 style="margin-top: 0; color: #2d5016;">Payment Summary</h3>
          <p style="font-size: 18px; margin: 10px 0;"><strong>Total Amount:</strong> KES ${invoiceDetails.totalAmount.toLocaleString()}</p>
          <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${invoiceDetails.paymentMethod === 'cash' ? 'Cash (Pay on arrival)' : invoiceDetails.paymentMethod}</p>
          ${registrationDetails?.registrationId ? `<p style="margin: 5px 0;"><strong>Registration ID:</strong> ${registrationDetails.registrationId.substring(0, 8).toUpperCase()}</p>` : ''}
        </div>
      `;
    }

    // Build complete email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: #2d5016; color: white; padding: 25px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Amuse Kenya</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Transformative Outdoor Experiences</p>
          </div>
          
          <div style="background-color: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
            <h2 style="color: #2d5016; margin-top: 0;">Registration Confirmed! 🎉</h2>
            
            <p style="font-size: 16px;">Dear <strong>${parentName}</strong>,</p>
            
            <p>Thank you for registering for <strong>${programTitle}</strong>. We're excited to have you join us for an unforgettable outdoor experience!</p>
            
            ${childrenSection}
            
            ${invoiceSection}
            
            ${programDetails}
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h3 style="margin-top: 0; color: #856404;">What's Next?</h3>
              <ol style="padding-left: 20px; margin-bottom: 0;">
                <li>Our team will contact you within 24 hours to confirm your booking</li>
                <li>You'll receive detailed instructions about what to bring</li>
                <li>Arrive 15 minutes before the scheduled start time</li>
              </ol>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <h3 style="color: #2d5016;">Need Help?</h3>
              <p style="margin: 5px 0;">
                <strong>📧 Email:</strong> info@amusekenya.co.ke<br>
                <strong>📞 Phone:</strong> +254 114 705 763<br>
                <strong>🌐 Website:</strong> <a href="https://amusekenya.co.ke" style="color: #2d5016;">amusekenya.co.ke</a><br>
                <strong>📍 Location:</strong> Karura Forest, Gate F, Thigiri Ridge, Nairobi
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>Follow us on social media for updates and photos!</p>
            <p style="margin-top: 10px;">&copy; 2025 Amuse Kenya. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    // Initialize Resend and send email - Updated 2025-06-04 to use verified domain
    const resend = new Resend(resendApiKey);
    const senderEmail = 'Amuse Kenya <info@amusekenya.co.ke>';
    
    console.log('📤 Sending email via Resend...');
    console.log('📧 From:', senderEmail);
    console.log('📧 To:', email);
    console.log('📧 Subject:', `Registration Confirmed - ${programTitle}`);
    
    let emailResponse;
    try {
      emailResponse = await resend.emails.send({
        from: senderEmail,
        to: [email],
        subject: `Registration Confirmed - ${programTitle}`,
        html: emailHtml,
      });
      
      console.log('📧 Resend response:', JSON.stringify(emailResponse));
    } catch (resendError: any) {
      console.error('❌ Resend API error:', resendError);
      console.error('❌ Resend error message:', resendError?.message);
      throw new Error(`Resend API error: ${resendError?.message || 'Unknown Resend error'}`);
    }

    // Check if Resend returned an error in the response
    if (emailResponse.error) {
      console.error('❌ Resend returned error:', JSON.stringify(emailResponse.error));
      throw new Error(`Resend error: ${emailResponse.error.message || JSON.stringify(emailResponse.error)}`);
    }

    console.log('✅ Email sent successfully:', JSON.stringify(emailResponse));

    // Track delivery in database
    const messageId = emailResponse.data?.id || `resend-${Date.now()}`;
    
    try {
      await supabase
        .from('email_deliveries')
        .insert({
          email: email,
          message_id: messageId,
          recipient_type: 'registration',
          email_type: 'confirmation',
          subject: `Registration Confirmed - ${programTitle}`,
          status: 'sent',
          postmark_data: { provider: 'resend', message_id: messageId },
          sent_at: new Date().toISOString()
        });
      console.log('📊 Email delivery tracked in database');
    } catch (trackingError) {
      console.error('⚠️ Error tracking email delivery:', trackingError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: emailResponse
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error: any) {
    console.error('❌ Error in send-confirmation-email:', error);
    console.error('❌ Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack || 'No stack trace available'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
};

serve(handler);
