const express = require('express');
const cors = require('cors');
const { simpleParser } = require('mailparser');
const app = express();

app.use(cors());

// CatchMail sends multipart/form-data OR raw body — handle both
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.text({ type: '*/*', limit: '10mb' }));

let mailboxes = {};

app.post('/incoming', async (req, res) => {
    try {
        // ── DEBUG: see exactly what CatchMail sends ──
        console.log('\n📨 INCOMING WEBHOOK');
        console.log('Content-Type:', req.headers['content-type']);
        console.log('Body keys:', Object.keys(req.body || {}));

        // CatchMail typically sends these fields:
        const body = req.body;

        // Try every possible field name CatchMail might use
        const rawEmail = body.message
            || body.raw
            || body.email
            || body.content
            || body.rawEmail
            || body.body
            || (typeof body === 'string' ? body : null)
            || '';

        // Extract envelope fields (CatchMail sends these separately)
        const from = body.from || body.sender || body.mailfrom || 'unknown@unknown.com';
        const to   = body.to   || body.recipient || body.rcpt || body.envelope_to || 'unknown@snipertoolx.com';
        const subject = body.subject || '(No Subject)';

        console.log('FROM:', from);
        console.log('TO:', to);
        console.log('SUBJECT:', subject);
        console.log('RAW EMAIL LENGTH:', rawEmail.length);
        console.log('RAW PREVIEW:', rawEmail.slice(0, 400));

        // Parse the raw MIME email
        const parsed = await simpleParser(rawEmail);

        const targetEmail = (parsed.to?.text || to).toLowerCase().trim();

        const emailData = {
            from:      parsed.from?.text || from,
            to:        targetEmail,
            subject:   parsed.subject   || subject,
            text:      parsed.text      || '(No plain text)',
            html:      parsed.html      || '',
            timestamp: Date.now()
        };

        mailboxes[targetEmail] = emailData;

        console.log(`\n🎯 TARGET HIT: ${targetEmail}`);
        console.log(`📧 Subject: ${emailData.subject}`);
        console.log(`📝 Text preview: ${emailData.text.slice(0, 100)}`);
        console.log(`🌐 Has HTML: ${emailData.html.length > 0}`);

        // AUTO-DELETE after 15 minutes
        setTimeout(() => {
            if (mailboxes[targetEmail]?.timestamp === emailData.timestamp) {
                delete mailboxes[targetEmail];
                console.log(`🗑️ AUTO-DELETE: ${targetEmail} cleared.`);
            }
        }, 15 * 60 * 1000);

        res.sendStatus(200);
    } catch (err) {
        console.error('❌ Parsing Error:', err.message);
        console.error(err.stack);
        res.sendStatus(500);
    }
});

app.get('/all-messages', (req, res) => {
    res.json(mailboxes);
});

app.get('/check/:address', (req, res) => {
    const address = req.params.address.toLowerCase();
    const found = mailboxes[address];
    if (found) {
        res.json({ status: 'success', data: found });
    } else {
        res.status(404).json({ status: 'error', message: 'Inbox empty or expired.' });
    }
});

app.get('/', (req, res) => res.send('Sniper API is Active.'));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server live on ${PORT}`));
