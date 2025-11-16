import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure we load the .env that sits next to this file regardless of CWD
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

import app from './app.js';

const PORT = process.env.PORT || 5174;

const server = app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});

// Increase timeout for long-running operations like ATS scoring
server.timeout = 120000; // 2 minutes
server.keepAliveTimeout = 120000;
