import { simpleParser } from 'mailparser';
import { emailService } from '../services/email.service.js';
import { extractEmail } from '../utils/helpers.js';

export const handleIncomingEmail = async (req, res) => {
  try {
    console.log('\n📨 === NEW EMAIL RECEIVED ===');

    let rawEmail = '';

    // Support raw text body (from new Worker) + fallback for JSON
    if (typeof req.body === 'string' && req.body.length > 50) {
      rawEmail = req.body;
    } else if (req.body?.content || req.body?.raw || req.body?.message) {
      rawEmail = req.body.content || req.body.raw || req.body.message;
    }

    if (!rawEmail) {
      console.log('⚠️ No raw email content found');
      return res.status(400).json({ error: 'No email content received' });
    }

    console.log(`Raw email size: ${rawEmail.length} characters`);

    const parsed = await simpleParser(rawEmail);

    const from = parsed.from?.text || 'Unknown Sender';
    const toRaw = parsed.to?.text || 'unknown';
    const toAddress = extractEmail(toRaw);

    // Read extra headers sent by the Worker
    const originalTo = req.headers['x-original-to'] || toRaw;
    const originalFrom = req.headers['x-original-from'] || from;

    const emailData = {
      from,
      to: toRaw,
      originalTo,           // Useful for knowing which domain it came to
      subject: parsed.subject || '(No Subject)',
      date: parsed.date || new Date(),
      text: parsed.text || '(No plain text)',
      html: parsed.html || parsed.textAsHtml || '',
      rawLength: rawEmail.length,
      receivedAt: new Date()
    };

    const savedEmail = emailService.addEmail(toAddress, emailData);

    console.log(`✅ SAVED for: ${toAddress} | Subject: ${savedEmail.subject}`);
    console.log(`   📧 Domain: ${originalTo}`);

    res.sendStatus(200);

  } catch (err) {
    console.error('❌ Error processing incoming email:', err.message);
    res.status(500).json({ error: 'Failed to process email' });
  }
};