import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sendAppointmentConfirmationEmail, sendContactMessageEmail, verifyEmailConnection } from './emailService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
const ALLOW_ORIGIN = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: ALLOW_ORIGIN }));
app.use(express.json());

// Supabase removed – email-only service

// Test endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Email server is running' });
});

// OTP endpoints removed – email-only service

// Test email connection
app.get('/api/test-email', async (req, res) => {
  try {
    const isConnected = await verifyEmailConnection();
    res.json({
      success: isConnected,
      message: isConnected ? 'Email service is ready' : 'Email service is not ready'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to test email connection'
    });
  }
});

// Send appointment confirmation email endpoint
app.post('/api/send-appointment-confirmation', async (req, res) => {
  try {
    const { appointmentData } = req.body;

    if (!appointmentData || !appointmentData.email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Appointment data and email are required' 
      });
    }

    console.log('Received appointment confirmation request:', appointmentData);

    const emailSent = await sendAppointmentConfirmationEmail(appointmentData);

    if (emailSent) {
      res.json({ 
        success: true, 
        message: 'Appointment confirmation email sent successfully' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to send appointment confirmation email' 
      });
    }
  } catch (error: unknown) {
    console.error('Error in appointment confirmation endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Send contact message endpoint
app.post('/api/send-contact-message', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, subject, message, toEmail } = req.body;

    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'First name, last name, email, and message are required' 
      });
    }

    console.log('Received contact message request:', { firstName, lastName, email, subject });

    // Create email content
    const emailSubject = subject || `New Contact Message from ${firstName} ${lastName}`;
    const emailContent = `
      <h2>New Contact Message from Kaler Scan Centre Website</h2>
      <p><strong>From:</strong> ${firstName} ${lastName}</p>
      <p><strong>Email:</strong> ${email}</p>
      ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
      ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
      <p><strong>Message:</strong></p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
        ${message.replace(/\n/g, '<br>')}
      </div>
      <hr>
      <p style="color: #666; font-size: 12px;">
        This message was sent from the contact form on the Kaler Scan Centre website.
      </p>
    `;

    // Send email using the existing email service
    const emailSent = await sendContactMessageEmail(toEmail || 'mohikkler123@gmail.com', emailSubject, emailContent, email);

    if (emailSent) {
      res.json({ 
        success: true, 
        message: 'Contact message sent successfully' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to send contact message' 
      });
    }
  } catch (error: unknown) {
    console.error('Error in send-contact-message endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Email server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Test email: http://localhost:${PORT}/api/test-email`);
});

export default app; 