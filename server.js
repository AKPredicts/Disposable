const express = require('express');
const app = express();

// Increase the limit to 10MB because raw email data (with attachments/html) can be large
app.use(express.json({ limit: '10mb' }));

// The endpoint Cloudflare will "hit"
app.post('/incoming', (req, res) => {
    const { from, to, subject, content } = req.body;

    console.log(`\n==========================================`);
    console.log(`📩 NEW EMAIL RECEIVED`);
    console.log(`TO:      ${to}`);
    console.log(`FROM:    ${from}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`------------------------------------------`);
    
    // This prints the entire raw body (headers, HTML, and text)
    // If it's too much text, you can change this to req.body.content.substring(0, 1000)
    console.log(content); 
    
    console.log(`==========================================\n`);

    // Always send a 200 OK back to Cloudflare so it knows the delivery was successful
    res.status(200).send('Email Received');
});

// Health check route (Optional: visit this in your browser to "wake up" Render)
app.get('/', (req, res) => {
    res.send('SniperToolX Backend is Awake and Running!');
});

// Render provides the PORT environment variable automatically
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 SniperToolX Backend live on port ${PORT}`);
    console.log(`Waiting for emails to @snipertoolx.com...`);
});