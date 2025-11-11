const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Send email using Postmark with suppression checking and delivery tracking
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @param {string} [options.emailType] - Type of email (confirmation, marketing, transactional, notification)
 * @param {string} [options.recipientType] - Type of recipient (lead, customer, registration)
 * @param {string} [options.recipientId] - ID of the recipient record
 */
const sendEmail = async (options) => {
  const { email, subject, html, emailType = 'transactional', recipientType, recipientId } = options;

  try {
    // Step 1: Check if email is suppressed
    const { data: suppression, error: suppressionError } = await supabase
      .from('email_suppressions')
      .select('email, suppression_type, reason')
      .eq('email', email)
      .maybeSingle();

    if (suppressionError) {
      console.error('Error checking email suppression:', suppressionError);
      // Continue with sending if we can't check (fail open)
    }

    if (suppression) {
      console.warn(`Email suppressed: ${email} (${suppression.suppression_type})`);
      throw new Error(`Cannot send to ${email}: ${suppression.suppression_type} - ${suppression.reason || 'No reason provided'}`);
    }

    // Step 2: Check if email is marked as invalid in leads table
    const { data: lead } = await supabase
      .from('leads')
      .select('email_valid')
      .eq('email', email)
      .maybeSingle();

    if (lead && lead.email_valid === false) {
      console.warn(`Email marked invalid in leads: ${email}`);
      throw new Error(`Cannot send to ${email}: marked as invalid`);
    }

    // Step 3: Send email via Postmark
    const postmarkApiKey = process.env.POSTMARK_API_KEY;
    if (!postmarkApiKey) {
      throw new Error('POSTMARK_API_KEY not configured');
    }

    const postmarkResponse = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': postmarkApiKey
      },
      body: JSON.stringify({
        From: process.env.EMAIL_FROM || 'noreply@forestcamp.com',
        To: email,
        Subject: subject,
        HtmlBody: html,
        MessageStream: 'outbound'
      })
    });

    if (!postmarkResponse.ok) {
      const errorData = await postmarkResponse.json();
      throw new Error(`Postmark error: ${errorData.Message || 'Unknown error'}`);
    }

    const result = await postmarkResponse.json();
    console.log('Email sent via Postmark:', result.MessageID);

    // Step 4: Track delivery in database
    try {
      await supabase
        .from('email_deliveries')
        .insert({
          email: email,
          message_id: result.MessageID,
          recipient_type: recipientType,
          recipient_id: recipientId,
          email_type: emailType,
          subject: subject,
          status: 'sent',
          postmark_data: result,
          sent_at: new Date().toISOString()
        });
    } catch (trackingError) {
      console.error('Error tracking email delivery:', trackingError);
      // Don't fail the email send if tracking fails
    }

    return result;

  } catch (error) {
    console.error('Error sending email:', error.message);
    throw error;
  }
};

module.exports = sendEmail;