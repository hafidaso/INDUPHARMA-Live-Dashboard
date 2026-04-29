import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow CORS for local testing if needed
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pdfBase64, reportId } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ error: 'Missing PDF data' });
    }

    // Gmail OAuth2 Credentials provided by user
    const userEmail = 'hafidabelaidagnaoui@gmail.com';
    const clientId = process.env.GMAIL_CLIENT_ID || '862451770929-jf1gcp1lr7inl2cltojrl44n461pd1hh.apps.googleusercontent.com';
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

    if (!clientSecret || !refreshToken) {
      console.error("Missing OAuth2 credentials in Vercel Environment Variables");
      return res.status(500).json({ error: 'Configuration email manquante sur le serveur (Vercel).' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: userEmail,
        clientId: clientId,
        clientSecret: clientSecret,
        refreshToken: refreshToken,
      },
    });

    const mailOptions = {
      from: `Indupharma Dashboard <${userEmail}>`,
      to: userEmail,
      subject: `Rapport de Production INDUPHARMA - ${reportId || 'Nouveau'}`,
      text: 'Veuillez trouver ci-joint le dernier rapport de production généré par le Dashboard INDUPHARMA.',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
          <h2 style="color: #1e40af;">Rapport de Production INDUPHARMA</h2>
          <p>Bonjour,</p>
          <p>Veuillez trouver ci-joint le <strong>Rapport de Production Quotidien</strong> (${reportId || ''}) généré automatiquement depuis la plateforme industrielle.</p>
          <br/>
          <p style="font-size: 12px; color: #6b7280;">Cet e-mail est généré automatiquement par le système.</p>
        </div>
      `,
      attachments: [
        {
          filename: `Rapport_${reportId || 'Indupharma'}.pdf`,
          content: pdfBase64.split('base64,')[1] || pdfBase64, // strip out data URI scheme if present
          encoding: 'base64',
          contentType: 'application/pdf',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
}
