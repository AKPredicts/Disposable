import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.routes.js';
import viewRoutes from './routes/view.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.text({ type: '*/*', limit: '50mb' }));

// Routes
app.use('/api', apiRoutes);
app.use('/', viewRoutes);

app.get('/', (req, res) => res.send('🚀 Disposable Mail Backend is LIVE'));

app.use(errorHandler);

export default app;