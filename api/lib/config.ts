import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, 'package.json')) &&
        fs.existsSync(path.join(dir, 'api'))) return dir;
    dir = path.dirname(dir);
  }
  return path.resolve(__dirname, '..', '..');
}

const ROOT = findRoot(__dirname);

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  isDev: process.env.NODE_ENV !== 'production',

  server: {
    port: parseInt(process.env.PORT || '4000', 10),
    host: process.env.HOST || '0.0.0.0',
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_in_prod_xxxxxxxxxxxxx',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:4173')
      .split(',').map(s => s.trim()).filter(Boolean),
  },

  storage: {
    backend: process.env.STORAGE_BACKEND || 'sqlite',
    dataDir: path.resolve(ROOT, process.env.DATA_DIR || './data'),
  },

  ai: {
    provider: process.env.AI_PROVIDER || 'mock',
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    baseUrl: process.env.AI_BASE_URL || '',
  },

  app: {
    root: ROOT,
    clientDist: path.resolve(ROOT, 'dist'),
    viteBaseUrl: process.env.VITE_BASE_URL || '/',
    viteApiBase: process.env.VITE_API_BASE || '/api',
  },
};
