import crypto from 'crypto';
import { User } from '@/types/auth';

const AUTH_SECRET = process.env.AUTH_SECRET || 'fingroww_super_secret_jwt_key_2026_dhanvridhi';
const TOKEN_EXPIRY_DAYS = 30;

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const computedHash = hashPassword(password, salt);
  try {
    return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

interface TokenPayload {
  userId: string;
  username: string;
  name: string;
  exp: number;
}

export function signToken(user: User): string {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_DAYS * 24 * 60 * 60;
  const payload: TokenPayload = {
    userId: user.id,
    username: user.username,
    name: user.name,
    exp,
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payloadStr)
    .digest('base64url');

  return `${payloadStr}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadStr, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(payloadStr)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload: TokenPayload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

export function getAuthUserFromRequest(request: Request): TokenPayload | null {
  // 1. Check Authorization Header: Bearer <token>
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const verified = verifyToken(token);
    if (verified) return verified;
  }

  // 2. Check Cookie: fingroww_session=<token>
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/fingroww_session=([^;]+)/);
  if (match && match[1]) {
    const token = decodeURIComponent(match[1].trim());
    return verifyToken(token);
  }

  return null;
}
