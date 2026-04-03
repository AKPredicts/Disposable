const express = require('express');
const { simpleParser } = require('mailparser');
const app = express();

app.use(express.json({ limit: '10mb' }));

app.post('/incoming', async (req, res) => {
    try {
        const { from, to, subject, content } = req.body;
        
        // This parses the raw "content" string into an easy-to-read object
        const parsed = await simpleParser(content);

        console.log(`\n🎯 TARGET HIT: ${to}`);
        console.log(`From:    ${from}`);
        console.log(`Subject: ${subject}`);
        console.log(`------------------------------------------`);
        
        // Only show the actual message text (no HTML/CSS junk)
        console.log("MESSAGE:");
        console.log(parsed.text || "No plain text found (check HTML)");
        
        console.log(`------------------------------------------\n`);

        res.sendStatus(200);
    } catch (err) {
        console.error("Parsing Error:", err);
        res.sendStatus(500);
    }
});

app.get('/', (req, res) => res.send('Sniper logic is active.'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server live on ${PORT}`));
