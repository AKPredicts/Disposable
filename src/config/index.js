import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 10000,
  nodeEnv: process.env.NODE_ENV || 'development',
  // Auto-delete emails after 15 minutes
  emailTtl: 15 * 60 * 1000,
};