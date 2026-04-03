const express = require('express');
const { simpleParser } = require('mailparser');
const app = express();

app.use(express.json({ limit: '10mb' }));

// 1. Create the in-memory "Inbox"
let mailboxes = {}; 

app.post('/incoming', async (req, res) => {
    try {
        const { from, to, subject, content } = req.body;
        const parsed = await simpleParser(content);
        const targetEmail = to.toLowerCase();

        const emailData = {
            from,
            subject,
            text: parsed.text || "No plain text found",
            html: parsed.html,
            timestamp: Date.now()
        };

        // 2. Save to memory
        mailboxes[targetEmail] = emailData;

        console.log(`\n🎯 TARGET HIT: ${targetEmail}`);
        console.log(`Subject: ${subject}`);
        console.log(`Status: Saved to memory. Deleting in 15 mins.`);

        // 3. Set the Auto-Delete Timer (15 minutes)
        setTimeout(() => {
            if (mailboxes[targetEmail] && mailboxes[targetEmail].timestamp === emailData.timestamp) {
                delete mailboxes[targetEmail];
                console.log(`\n🗑️ AUTO-DELETE: Log cleared for ${targetEmail}`);
            }
        }, 15 * 60 * 1000); 

        res.sendStatus(200);
    } catch (err) {
        console.error("Parsing Error:", err);
        res.sendStatus(500);
    }
});

// 4. Endpoint for your Automation Script to check the inbox
app.get('/check/:address', (req, res) => {
    const address = req.params.address.toLowerCase();
    const found = mailboxes[address];

    if (found) {
        res.json({ status: "success", data: found });
    } else {
        res.status(404).json({ status: "error", message: "No email found or already expired." });
    }
});

app.get('/', (req, res) => res.send('Sniper API is Active.'));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server live on ${PORT}`));
