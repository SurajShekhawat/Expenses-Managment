import { getDbPool } from './db';
import { INITIAL_DEMO_DATA } from './storage';

let isInitialized = false;

export async function initDatabase(): Promise<void> {
  if (isInitialized) return;

  const pool = getDbPool();

  // 1. Create tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      account_type VARCHAR(32) NOT NULL,
      account_number_masked VARCHAR(64),
      balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
      credit_limit DECIMAL(15, 2) DEFAULT NULL,
      color VARCHAR(32),
      is_primary BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(64) PRIMARY KEY,
      date VARCHAR(32) NOT NULL,
      amount DECIMAL(15, 2) NOT NULL,
      type VARCHAR(32) NOT NULL,
      category VARCHAR(128) NOT NULL,
      payment_mode VARCHAR(64) NOT NULL,
      account_id VARCHAR(64),
      to_account_id VARCHAR(64),
      description TEXT NOT NULL,
      is_recurring BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS investments (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      symbol_or_platform VARCHAR(128),
      asset_type VARCHAR(64) NOT NULL,
      invested_amount DECIMAL(15, 2) NOT NULL,
      current_value DECIMAL(15, 2) NOT NULL,
      units DECIMAL(15, 4),
      avg_buy_price DECIMAL(15, 2),
      current_price DECIMAL(15, 2),
      sip_monthly_amount DECIMAL(15, 2),
      sip_date INT,
      expected_return_rate DECIMAL(5, 2),
      last_updated VARCHAR(32),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS loans (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      lender_or_borrower VARCHAR(255) NOT NULL,
      loan_type VARCHAR(64) NOT NULL,
      direction VARCHAR(32) NOT NULL,
      principal_amount DECIMAL(15, 2) NOT NULL,
      remaining_balance DECIMAL(15, 2) NOT NULL,
      interest_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
      monthly_emi DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
      due_day_of_month INT,
      start_date VARCHAR(32),
      tenure_months INT NOT NULL DEFAULT 12,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS budgets (
      category VARCHAR(128) PRIMARY KEY,
      budget_limit DECIMAL(15, 2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS goals (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      target_amount DECIMAL(15, 2) NOT NULL,
      current_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
      target_date VARCHAR(32) NOT NULL,
      category VARCHAR(64) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      amount DECIMAL(15, 2) NOT NULL,
      billing_cycle VARCHAR(32) NOT NULL,
      category VARCHAR(128) NOT NULL,
      next_billing_date VARCHAR(32) NOT NULL,
      account_id VARCHAR(64),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS insurances (
      id VARCHAR(64) PRIMARY KEY,
      type VARCHAR(32) NOT NULL,
      policy_name VARCHAR(255) NOT NULL,
      provider_name VARCHAR(255) NOT NULL,
      sum_insured DECIMAL(15, 2) NOT NULL,
      annual_premium DECIMAL(15, 2) NOT NULL,
      premium_amount DECIMAL(15, 2) DEFAULT NULL,
      payment_frequency VARCHAR(32) DEFAULT 'yearly',
      renewal_date VARCHAR(32) NOT NULL,
      policy_number VARCHAR(128),
      nominee VARCHAR(128),
      account_id VARCHAR(64),
      auto_debit BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Safely alter table if already created without the new columns
  try {
    await pool.query('ALTER TABLE insurances ADD COLUMN IF NOT EXISTS premium_amount DECIMAL(15, 2) DEFAULT NULL');
    await pool.query('ALTER TABLE insurances ADD COLUMN IF NOT EXISTS payment_frequency VARCHAR(32) DEFAULT "yearly"');
    await pool.query('ALTER TABLE insurances ADD COLUMN IF NOT EXISTS account_id VARCHAR(64) DEFAULT NULL');
    await pool.query('ALTER TABLE insurances ADD COLUMN IF NOT EXISTS auto_debit BOOLEAN DEFAULT FALSE');
  } catch (err) {
    // Ignore if MariaDB/MySQL syntax difference, safe fallback
  }

  isInitialized = true;
}
