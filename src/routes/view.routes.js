import { Router } from 'express';
import { emailService } from '../services/email.service.js';
import { escapeHtml } from '../utils/helpers.js';

const router = Router();

// Beautiful email viewer (same as before but cleaner)
router.get('/view/:address', (req, res) => {
  const address = req.params.address.toLowerCase().trim();
  const emails = emailService.getInbox(address);

  if (emails.length === 0) {
    return res.send(`<h2 style="text-align:center;margin-top:100px;color:#d32f2f;">No emails for ${address}</h2>`);
  }

  // Show latest email by default (you can extend later for multi-email view)
  const email = emails[0];

  const htmlBody = email.html 
    ? email.html 
    : `<pre style="padding:20px;font-family:monospace;white-space:pre-wrap;">${escapeHtml(email.text)}</pre>`;

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(email.subject)} | Temp Mail</title>
      <style>
        body { font-family: Arial, sans-serif; margin:0; padding:15px; background:#f5f5f5; }
        .header { background:white; padding:20px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); margin-bottom:15px; }
        .body { background:white; padding:25px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); }
        iframe { width:100%; height:80vh; border:none; border-radius:6px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${escapeHtml(email.subject)}</h1>
        <strong>From:</strong> ${escapeHtml(email.from)}<br>
        <strong>To:</strong> ${escapeHtml(email.to)}<br>
        <strong>Date:</strong> ${new Date(email.date).toLocaleString()}
      </div>
      <div class="body">
        ${email.html ? `<iframe sandbox="allow-same-origin" srcdoc="${escapeHtml(htmlBody)}"></iframe>` : htmlBody}
      </div>
    </body>
    </html>
  `);
});

export default router;