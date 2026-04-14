import { Router } from 'express';
import { handleIncomingEmail } from '../controllers/email.controller.js';
import { getInbox, getSingleEmail, getAllMailboxes } from '../controllers/inbox.controller.js';

const router = Router();

router.post('/incoming', handleIncomingEmail);

router.get('/inbox/:address', getInbox);
router.get('/email/:address/:id', getSingleEmail);
router.get('/mailboxes', getAllMailboxes);

export default router;