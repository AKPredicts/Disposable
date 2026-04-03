const express = require('express');
const cors = require('cors');
const { simpleParser } = require('mailparser');

const app = express();

app.use(cors());

// Handle all possible ways CatchMail might send the email
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.text({ type: '*/*', limit: '50mb' }));

let mailboxes = {};   // Stores the latest email for each address

app.post('/incoming', async (req, res) => {
    try {
        console.log('\n📨 === NEW EMAIL RECEIVED ===');

        // Extract raw email from any possible field
        let rawEmail = '';

        if (typeof req.body === 'string' && req.body.length > 10) {
            rawEmail = req.body;
        } else if (req.body) {
            const b = req.body;
            rawEmail = b.raw || b.message || b.email || b.content || 
                       b.rawEmail || b.body || '';
        }

        if (!rawEmail) {
            console.log('⚠️ No raw email content found');
            return res.status(400).send('No email content');
        }

        console.log(`Raw email size: ${rawEmail.length} characters`);

        // Parse the email properly
        const parsed = await simpleParser(rawEmail);

        // Get basic info
        const from = parsed.from?.text || 'Unknown Sender';
        const to = parsed.to?.text || 'Unknown Recipient';
        const subject = parsed.subject || '(No Subject)';
        const date = parsed.date || new Date();

        console.log(`From: ${from}`);
        console.log(`To:   ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Date: ${date}`);

        // Store the full email
        const emailData = {
            from: from,
            to: to,
            subject: subject,
            date: date,
            text: parsed.text || '(No plain text)',
            html: parsed.html || parsed.textAsHtml || '',
            timestamp: Date.now(),
            rawLength: rawEmail.length
        };

        // Store using the "To" address as key (most common for catch-all/temp inboxes)
        const toAddress = to.toLowerCase().trim()
                            .replace(/^.*<(.+)>.*$/, '$1')   // extract email if it's "Name <email>"
                            || 'unknown';

        mailboxes[toAddress] = emailData;

        console.log(`✅ EMAIL SAVED for: ${toAddress}`);
        console.log(`   📧 Subject: ${subject}`);
        console.log(`   📄 Has HTML: ${!!emailData.html}`);
        console.log(`   📝 Text length: ${emailData.text.length}`);

        // Auto delete after 15 minutes
        setTimeout(() => {
            if (mailboxes[toAddress]?.timestamp === emailData.timestamp) {
                delete mailboxes[toAddress];
                console.log(`🗑️ Auto-deleted: ${toAddress}`);
            }
        }, 15 * 60 * 1000);

        res.sendStatus(200);

    } catch (err) {
        console.error('❌ Error processing incoming email:', err.message);
        res.sendStatus(500);
    }
});

// ==================== NICE EMAIL VIEWER ====================
// Shows the email exactly like a real email client
app.get('/view/:address', (req, res) => {
    const address = req.params.address.toLowerCase().trim();
    const email = mailboxes[address];

    if (!email) {
        return res.send(`
            <h2 style="color: #d32f2f; text-align: center; margin-top: 50px;">
                No email found for ${address}
            </h2>
            <p style="text-align: center;">It may have expired or no email has arrived yet.</p>
        `);
    }

    const htmlBody = email.html 
        ? email.html 
        : `<pre style="font-family: monospace; white-space: pre-wrap; padding: 20px;">${escapeHtml(email.text)}</pre>`;

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${escapeHtml(email.subject)} | Email View</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 15px; background: #f5f5f5; }
                .header { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 15px; }
                .body { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); min-height: 70vh; }
                iframe { width: 100%; height: 85vh; border: none; border-radius: 6px; }
                .meta { color: #555; line-height: 1.6; }
                h1 { margin: 0 0 15px 0; font-size: 1.6em; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${escapeHtml(email.subject)}</h1>
                <div class="meta">
                    <strong>From:</strong> ${escapeHtml(email.from)}<br>
                    <strong>To:</strong> ${escapeHtml(email.to)}<br>
                    <strong>Date:</strong> ${new Date(email.date).toLocaleString()}
                </div>
            </div>

            <div class="body">
                ${email.html 
                    ? `<iframe sandbox="allow-same-origin" srcdoc="${escapeHtml(htmlBody)}"></iframe>`
                    : htmlBody
                }
            </div>
        </body>
        </html>
    `);
});

function escapeHtml(text) {
    return text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&#039;');
}

// Keep your original endpoints
app.get('/all-messages', (req, res) => res.json(mailboxes));

app.get('/check/:address', (req, res) => {
    const address = req.params.address.toLowerCase();
    const found = mailboxes[address];
    if (found) {
        res.json({ status: 'success', data: found });
    } else {
        res.status(404).json({ status: 'error', message: 'No email or expired' });
    }
});

app.get('/', (req, res) => res.send('Sniper API is Active.'));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
