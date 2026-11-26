import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { initDatabase } from '@/lib/dbInit';
import { generateSalt, hashPassword, verifyPassword, signToken, getAuthUserFromRequest } from '@/lib/auth';
import { User } from '@/types/auth';

export const dynamic = 'force-dynamic';

// Rate limiting cache: IP -> { attempts, lockedUntil }
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) return { allowed: true };

  if (now > record.resetAt) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  if (record.count >= 5) {
    const waitSeconds = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  return { allowed: true };
}

function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 5 * 60 * 1000 }); // 5 minutes window
  } else {
    record.count += 1;
  }
}

function clearAttempts(ip: string) {
  loginAttempts.delete(ip);
}

export async function GET(request: Request) {
  try {
    await initDatabase();
    const tokenPayload = getAuthUserFromRequest(request);

    if (!tokenPayload) {
      return NextResponse.json({ success: true, authenticated: false });
    }

    const pool = getDbPool();
    const [rows]: any = await pool.query(
      'SELECT id, username, name, created_at FROM users WHERE id = ?',
      [tokenPayload.userId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: true, authenticated: false });
    }

    const user: User = {
      id: rows[0].id,
      username: rows[0].username,
      name: rows[0].name,
      createdAt: rows[0].created_at,
    };

    return NextResponse.json({
      success: true,
      authenticated: true,
      user,
    });
  } catch (err: any) {
    console.error('Auth verification error:', err);
    return NextResponse.json(
      { success: false, authenticated: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await initDatabase();
    const pool = getDbPool();
    const body = await request.json();
    const { action } = body;

    // --- 1. LOGOUT ACTION ---
    if (action === 'logout') {
      const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
      response.cookies.set('fingroww_session', '', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 0,
      });
      return response;
    }

    // --- 2. LOGIN ACTION ---
    if (action === 'login') {
      const clientIp = request.headers.get('x-forwarded-for') || '127.0.0.1';
      const rateCheck = checkRateLimit(clientIp);
      if (!rateCheck.allowed) {
        return NextResponse.json(
          { success: false, error: `Bohot saare galat attempts! Kripya ${rateCheck.waitSeconds} seconds baad try karein.` },
          { status: 429 }
        );
      }

      const { username, password } = body;

      if (!username || !password) {
        return NextResponse.json(
          { success: false, error: 'Email/Username aur password dono zaroori hain' },
          { status: 400 }
        );
      }

      const trimmedIdentifier = String(username).trim().toLowerCase();

      // Check by username OR email
      const [rows]: any = await pool.query(
        'SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ? LIMIT 1',
        [trimmedIdentifier, trimmedIdentifier]
      );

      if (!rows || rows.length === 0) {
        recordFailedAttempt(clientIp);
        return NextResponse.json(
          { success: false, error: 'Yeh Email / Username database me nahi mila' },
          { status: 401 }
        );
      }

      const dbUser = rows[0];
      const isMatch = verifyPassword(String(password), dbUser.password_hash, dbUser.salt);

      if (!isMatch) {
        recordFailedAttempt(clientIp);
        return NextResponse.json(
          { success: false, error: 'Galat password! Kripya dobara check karein' },
          { status: 401 }
        );
      }

      clearAttempts(clientIp);

      const user: User = {
        id: dbUser.id,
        username: dbUser.username,
        name: dbUser.name,
        createdAt: dbUser.created_at,
      };

      const token = signToken(user);

      const response = NextResponse.json({
        success: true,
        user,
        token,
        message: `Welcome back, ${user.name}!`,
      });

      // 30 days session cookie
      response.cookies.set('fingroww_session', token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
      });

      return response;
    }

    // --- 3. REGISTER ACTION ---
    if (action === 'register') {
      const { username, password, name } = body;

      if (!username || !password || !name) {
        return NextResponse.json(
          { success: false, error: 'Name, username aur password sabhi bharne honge' },
          { status: 400 }
        );
      }

      const cleanUsername = String(username).trim().toLowerCase();
      const cleanName = String(name).trim();
      const cleanPassword = String(password);

      if (cleanUsername.length < 3) {
        return NextResponse.json(
          { success: false, error: 'Username kam se kam 3 characters ka hona chahiye' },
          { status: 400 }
        );
      }

      if (cleanPassword.length < 4) {
        return NextResponse.json(
          { success: false, error: 'Password kam se kam 4 characters ka hona chahiye' },
          { status: 400 }
        );
      }

      // Check if username already exists
      const [existing]: any = await pool.query(
        'SELECT id FROM users WHERE LOWER(username) = ? LIMIT 1',
        [cleanUsername]
      );

      if (existing && existing.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Yeh username pehle se kisi aur ne liya hua hai' },
          { status: 409 }
        );
      }

      const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const salt = generateSalt();
      const passwordHash = hashPassword(cleanPassword, salt);

      const userEmail = cleanUsername.includes('@') ? cleanUsername : null;

      await pool.query(
        'INSERT INTO users (id, username, email, name, password_hash, salt) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, cleanUsername, userEmail, cleanName, passwordHash, salt]
      );

      // Create initial starter account for the new user with zero balance
      const starterAccountId = `acc-${Date.now()}`;
      await pool.query(
        'INSERT INTO accounts (id, name, account_type, balance, is_primary, user_id) VALUES (?, ?, ?, ?, ?, ?)',
        [starterAccountId, 'Primary Bank Account', 'savings', 0.00, true, userId]
      );

      // Seed initial clean budget categories for the new user
      const defaultBudgetCategories = [
        'Food & Dining', 'Groceries', 'Shopping & Lifestyle', 'Transportation', 'Utilities & Bills', 'Entertainment & Subscriptions'
      ];
      for (const cat of defaultBudgetCategories) {
        const bId = `b_${userId}_${Math.random().toString(36).substring(2, 8)}`;
        await pool.query(
          'INSERT INTO budgets (id, user_id, category, budget_limit) VALUES (?, ?, ?, ?)',
          [bId, userId, cat, 0]
        );
      }

      const user: User = {
        id: userId,
        username: cleanUsername,
        name: cleanName,
      };

      const token = signToken(user);

      const response = NextResponse.json({
        success: true,
        user,
        token,
        message: 'Account successfully created!',
      });

      response.cookies.set('fingroww_session', token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action requested' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('Auth API handler error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
