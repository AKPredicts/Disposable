import { config } from '../config/index.js';

const mailboxes = new Map(); // address → array of emails

export const emailService = {
  addEmail: (toAddress, emailData) => {
    const address = toAddress.toLowerCase().trim();
    
    if (!mailboxes.has(address)) {
      mailboxes.set(address, []);
    }

    const emailWithId = {
      ...emailData,
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      timestamp: Date.now(),
    };

    mailboxes.get(address).unshift(emailWithId); // newest first

    // Auto delete after TTL
    setTimeout(() => {
      const inbox = mailboxes.get(address);
      if (inbox) {
        const filtered = inbox.filter(e => e.id !== emailWithId.id);
        if (filtered.length === 0) mailboxes.delete(address);
        else mailboxes.set(address, filtered);
      }
    }, config.emailTtl);

    return emailWithId;
  },

  getInbox: (address) => {
    const addr = address.toLowerCase().trim();
    return mailboxes.get(addr) || [];
  },

  getEmail: (address, emailId) => {
    const inbox = emailService.getInbox(address);
    return inbox.find(e => e.id === emailId) || null;
  },

  getAllMailboxes: () => Object.fromEntries(mailboxes),
};