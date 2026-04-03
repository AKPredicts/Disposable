const express = require('express');
const cors = require('cors'); // Make sure to run: npm install cors
const { simpleParser } = require('mailparser');
const app = express();

// Enable CORS so your website can talk to this server
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// This is your temporary "inbox" storage
let mailboxes = {};

app.post('/incoming', async (req, res) => {
    try {
        const { from, to, subject, content } = req.body;
        const parsed = await simpleParser(content);
        const targetEmail = to.toLowerCase();

        // Structure the data for the frontend
        const emailData = {
            from,
            subject,
            text: parsed.text || "No plain text found",
            html: parsed.html || "",
            timestamp: Date.now()
        };

        // Save to memory
        mailboxes[targetEmail] = emailData;

        console.log(`\n🎯 TARGET HIT: ${targetEmail}`);
        console.log(`Subject: ${subject}`);

        // AUTO-DELETE after 15 minutes (900,000ms)
        setTimeout(() => {
            if (mailboxes[targetEmail] && mailboxes[targetEmail].timestamp === emailData.timestamp) {
                delete mailboxes[targetEmail];
                console.log(`🗑️ AUTO-DELETE: ${targetEmail} cleared from memory.`);
            }
        }, 15 * 60 * 1000);

        res.sendStatus(200);
    } catch (err) {
        console.error("Parsing Error:", err);
        res.sendStatus(500);
    }
});

// NEW ROUTE: For your dashboard to see EVERYTHING
app.get('/all-messages', (req, res) => {
    res.json(mailboxes);
});

// ROUTE: For a specific address (if needed by your bot)
app.get('/check/:address', (req, res) => {
    const address = req.params.address.toLowerCase();
    const found = mailboxes[address];
    if (found) {
        res.json({ status: "success", data: found });
    } else {
        res.status(404).json({ status: "error", message: "Inbox empty or expired." });
    }
});

app.get('/', (req, res) => res.send('Sniper API is Active.'));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server live on ${PORT}`));
