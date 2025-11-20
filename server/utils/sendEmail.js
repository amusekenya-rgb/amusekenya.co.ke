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

    // Step 3: Send email via SendGrid
    const sendGridApiKey = process.env.SENDGRID_API_KEY;
    if (!sendGridApiKey) {
      throw new Error('SENDGRID_API_KEY not configured');
    }

    const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: email }]
        }],
        from: {
          email: 'peterokata47@gmail.com',
          name: 'Amuse Kenya'
        },
        subject: subject,
        content: [{
          type: 'text/html',
          value: html
        }]
      })
    });

    if (!sendGridResponse.ok) {
      const errorText = await sendGridResponse.text();
      throw new Error(`SendGrid error: ${errorText || 'Unknown error'}`);
    }

    // SendGrid returns X-Message-Id header
    const messageId = sendGridResponse.headers.get('X-Message-Id') || `sendgrid-${Date.now()}`;
    console.log('Email sent via SendGrid:', messageId);

    // Step 4: Track delivery in database
    try {
      await supabase
        .from('email_deliveries')
        .insert({
          email: email,
          message_id: messageId,
          recipient_type: recipientType,
          recipient_id: recipientId,
          email_type: emailType,
          subject: subject,
          status: 'sent',
          postmark_data: { provider: 'sendgrid', message_id: messageId },
          sent_at: new Date().toISOString()
        });
    } catch (trackingError) {
      console.error('Error tracking email delivery:', trackingError);
      // Don't fail the email send if tracking fails
    }

    return { MessageID: messageId, provider: 'sendgrid' };

  } catch (error) {
    console.error('Error sending email:', error.message);
    throw error;
  }
};

module.exports = sendEmail;