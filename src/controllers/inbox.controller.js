import { emailService } from '../services/email.service.js';

export const getInbox = (req, res) => {
  const { address } = req.params;
  const emails = emailService.getInbox(address);
  res.json({ address, count: emails.length, emails });
};

export const getSingleEmail = (req, res) => {
  const { address, id } = req.params;
  const email = emailService.getEmail(address, id);
  if (!email) return res.status(404).json({ error: 'Email not found or expired' });
  res.json(email);
};

export const getAllMailboxes = (req, res) => {
  res.json(emailService.getAllMailboxes());
};