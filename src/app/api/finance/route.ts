import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { initDatabase } from '@/lib/dbInit';
import { 
  FinancialData, 
  FinancialAccount, 
  Transaction, 
  Investment, 
  LoanLiability, 
  BudgetLimit, 
  FinancialGoal, 
  Subscription, 
  InsurancePolicy 
} from '@/types/finance';
import { INITIAL_DEMO_DATA } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initDatabase();
    const pool = getDbPool();

    // 1. Fetch Accounts
    const [accRows]: any = await pool.query('SELECT * FROM accounts ORDER BY is_primary DESC, name ASC');
    const accounts: FinancialAccount[] = accRows.map((r: any) => ({
      id: r.id,
      name: r.name,
      accountType: r.account_type,
      accountNumberMasked: r.account_number_masked || undefined,
      balance: parseFloat(r.balance),
      creditLimit: r.credit_limit ? parseFloat(r.credit_limit) : undefined,
      color: r.color || undefined,
      isPrimary: Boolean(r.is_primary),
    }));

    // 2. Fetch Transactions
    const [txRows]: any = await pool.query('SELECT * FROM transactions ORDER BY date DESC, created_at DESC LIMIT 500');
    const transactions: Transaction[] = txRows.map((r: any) => ({
      id: r.id,
      date: r.date,
      amount: parseFloat(r.amount),
      type: r.type,
      category: r.category,
      paymentMode: r.payment_mode,
      accountId: r.account_id || undefined,
      toAccountId: r.to_account_id || undefined,
      description: r.description,
      isRecurring: Boolean(r.is_recurring),
    }));

    // 3. Fetch Investments
    const [invRows]: any = await pool.query('SELECT * FROM investments ORDER BY current_value DESC');
    const investments: Investment[] = invRows.map((r: any) => ({
      id: r.id,
      name: r.name,
      symbolOrPlatform: r.symbol_or_platform || undefined,
      assetType: r.asset_type,
      investedAmount: parseFloat(r.invested_amount),
      currentValue: parseFloat(r.current_value),
      units: r.units ? parseFloat(r.units) : undefined,
      avgBuyPrice: r.avg_buy_price ? parseFloat(r.avg_buy_price) : undefined,
      currentPrice: r.current_price ? parseFloat(r.current_price) : undefined,
      sipMonthlyAmount: r.sip_monthly_amount ? parseFloat(r.sip_monthly_amount) : undefined,
      sipDate: r.sip_date ? parseInt(r.sip_date, 10) : undefined,
      expectedReturnRate: r.expected_return_rate ? parseFloat(r.expected_return_rate) : undefined,
      lastUpdated: r.last_updated || '2026-11-21',
      notes: r.notes || undefined,
    }));

    // 4. Fetch Loans
    const [loanRows]: any = await pool.query('SELECT * FROM loans ORDER BY remaining_balance DESC');
    const loans: LoanLiability[] = loanRows.map((r: any) => ({
      id: r.id,
      title: r.title,
      lenderOrBorrower: r.lender_or_borrower,
      loanType: r.loan_type,
      direction: r.direction,
      principalAmount: parseFloat(r.principal_amount),
      remainingBalance: parseFloat(r.remaining_balance),
      interestRate: parseFloat(r.interest_rate),
      monthlyEmi: parseFloat(r.monthly_emi),
      dueDayOfMonth: r.due_day_of_month ? parseInt(r.due_day_of_month, 10) : undefined,
      startDate: r.start_date || '2026-01-01',
      tenureMonths: parseInt(r.tenure_months, 10),
      notes: r.notes || undefined,
    }));

    // 5. Fetch Budgets
    const [budgetRows]: any = await pool.query('SELECT * FROM budgets');
    const budgets: BudgetLimit[] = budgetRows.map((r: any) => ({
      category: r.category,
      limit: parseFloat(r.budget_limit),
    }));

    // 6. Fetch Goals
    const [goalRows]: any = await pool.query('SELECT * FROM goals ORDER BY target_date ASC');
    const goals: FinancialGoal[] = goalRows.map((r: any) => ({
      id: r.id,
      title: r.title,
      targetAmount: parseFloat(r.target_amount),
      currentAmount: parseFloat(r.current_amount),
      targetDate: r.target_date,
      category: r.category,
    }));

    // 7. Fetch Subscriptions
    const [subRows]: any = await pool.query('SELECT * FROM subscriptions ORDER BY next_billing_date ASC');
    const subscriptions: Subscription[] = subRows.map((r: any) => ({
      id: r.id,
      name: r.name,
      amount: parseFloat(r.amount),
      billingCycle: r.billing_cycle,
      category: r.category,
      nextBillingDate: r.next_billing_date,
      accountId: r.account_id || undefined,
      notes: r.notes || undefined,
    }));

    // 8. Fetch Insurances
    const [insRows]: any = await pool.query('SELECT * FROM insurances ORDER BY renewal_date ASC');
    const insurances: InsurancePolicy[] = insRows.map((r: any) => {
      const ann = parseFloat(r.annual_premium) || 0;
      const freq = (r.payment_frequency as any) || 'yearly';
      const prem = r.premium_amount ? parseFloat(r.premium_amount) : (
        freq === 'monthly' ? Math.round(ann / 12) :
        freq === 'quarterly' ? Math.round(ann / 4) :
        freq === 'half_yearly' ? Math.round(ann / 2) : ann
      );

      return {
        id: r.id,
        type: r.type,
        policyName: r.policy_name,
        providerName: r.provider_name,
        sumInsured: parseFloat(r.sum_insured),
        annualPremium: ann,
        premiumAmount: prem,
        paymentFrequency: freq,
        renewalDate: r.renewal_date,
        policyNumber: r.policy_number || undefined,
        nominee: r.nominee || undefined,
        accountId: r.account_id || undefined,
        autoDebit: Boolean(r.auto_debit),
      };
    });

    const data: FinancialData = {
      accounts,
      transactions,
      investments,
      loans,
      budgets,
      goals,
      subscriptions,
      insurances,
    };

    return NextResponse.json({ success: true, source: 'mysql', data });
  } catch (err: any) {
    console.error('MySQL GET Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Database fetch failed' },
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

    if (action === 'sync_all') {
      const { payload } = body as { payload: FinancialData };
      if (!payload) {
        return NextResponse.json({ success: false, error: 'Missing payload' }, { status: 400 });
      }

      // Truncate and replace with latest payload
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        await conn.query('DELETE FROM accounts');
        for (const acc of payload.accounts) {
          await conn.query(
            `INSERT INTO accounts (id, name, account_type, account_number_masked, balance, credit_limit, color, is_primary)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [acc.id, acc.name, acc.accountType, acc.accountNumberMasked || null, acc.balance, acc.creditLimit || null, acc.color || null, acc.isPrimary ? 1 : 0]
          );
        }

        await conn.query('DELETE FROM transactions');
        for (const tx of payload.transactions) {
          await conn.query(
            `INSERT INTO transactions (id, date, amount, type, category, payment_mode, account_id, to_account_id, description, is_recurring)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [tx.id, tx.date, tx.amount, tx.type, tx.category, tx.paymentMode, tx.accountId || null, tx.toAccountId || null, tx.description, tx.isRecurring ? 1 : 0]
          );
        }

        await conn.query('DELETE FROM investments');
        for (const inv of payload.investments) {
          await conn.query(
            `INSERT INTO investments (id, name, symbol_or_platform, asset_type, invested_amount, current_value, units, avg_buy_price, current_price, sip_monthly_amount, sip_date, expected_return_rate, last_updated, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              inv.id, inv.name, inv.symbolOrPlatform || null, inv.assetType, inv.investedAmount, inv.currentValue,
              inv.units || null, inv.avgBuyPrice || null, inv.currentPrice || null, inv.sipMonthlyAmount || null,
              inv.sipDate || null, inv.expectedReturnRate || null, inv.lastUpdated || '2026-11-21', inv.notes || null
            ]
          );
        }

        await conn.query('DELETE FROM loans');
        for (const l of payload.loans) {
          await conn.query(
            `INSERT INTO loans (id, title, lender_or_borrower, loan_type, direction, principal_amount, remaining_balance, interest_rate, monthly_emi, due_day_of_month, start_date, tenure_months, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              l.id, l.title, l.lenderOrBorrower, l.loanType, l.direction, l.principalAmount, l.remainingBalance,
              l.interestRate, l.monthlyEmi, l.dueDayOfMonth || null, l.startDate, l.tenureMonths, l.notes || null
            ]
          );
        }

        await conn.query('DELETE FROM budgets');
        for (const b of payload.budgets) {
          await conn.query(
            `INSERT INTO budgets (category, budget_limit) VALUES (?, ?)`,
            [b.category, b.limit]
          );
        }

        await conn.query('DELETE FROM goals');
        for (const g of payload.goals) {
          await conn.query(
            `INSERT INTO goals (id, title, target_amount, current_amount, target_date, category)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [g.id, g.title, g.targetAmount, g.currentAmount, g.targetDate, g.category]
          );
        }

        await conn.query('DELETE FROM subscriptions');
        for (const s of payload.subscriptions) {
          await conn.query(
            `INSERT INTO subscriptions (id, name, amount, billing_cycle, category, next_billing_date, account_id, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [s.id, s.name, s.amount, s.billingCycle, s.category, s.nextBillingDate, s.accountId || null, s.notes || null]
          );
        }

        await conn.query('DELETE FROM insurances');
        for (const ins of payload.insurances) {
          const freq = ins.paymentFrequency || 'yearly';
          const prem = ins.premiumAmount || ins.annualPremium;
          await conn.query(
            `INSERT INTO insurances (id, type, policy_name, provider_name, sum_insured, annual_premium, premium_amount, payment_frequency, renewal_date, policy_number, nominee, account_id, auto_debit)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              ins.id, ins.type, ins.policyName, ins.providerName, ins.sumInsured,
              ins.annualPremium, prem, freq, ins.renewalDate,
              ins.policyNumber || null, ins.nominee || null, ins.accountId || null, ins.autoDebit ? 1 : 0
            ]
          );
        }

        await conn.commit();
        return NextResponse.json({ success: true, message: 'All data synchronized with MySQL' });
      } catch (e: any) {
        await conn.rollback();
        throw e;
      } finally {
        conn.release();
      }
    }

    if (action === 'add_transaction') {
      const { transaction } = body as { transaction: Transaction };
      await pool.query(
        `INSERT INTO transactions (id, date, amount, type, category, payment_mode, account_id, to_account_id, description, is_recurring)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transaction.id, transaction.date, transaction.amount, transaction.type, transaction.category,
          transaction.paymentMode, transaction.accountId || null, transaction.toAccountId || null,
          transaction.description, transaction.isRecurring ? 1 : 0
        ]
      );

      // Adjust account balance
      if (transaction.accountId) {
        if (transaction.type === 'expense') {
          await pool.query('UPDATE accounts SET balance = balance - ? WHERE id = ? AND account_type != "credit_card"', [transaction.amount, transaction.accountId]);
          await pool.query('UPDATE accounts SET balance = balance + ? WHERE id = ? AND account_type = "credit_card"', [transaction.amount, transaction.accountId]);
        } else if (transaction.type === 'income') {
          await pool.query('UPDATE accounts SET balance = balance + ? WHERE id = ? AND account_type != "credit_card"', [transaction.amount, transaction.accountId]);
          await pool.query('UPDATE accounts SET balance = GREATEST(0, balance - ?) WHERE id = ? AND account_type = "credit_card"', [transaction.amount, transaction.accountId]);
        }
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'delete_transaction') {
      const { id } = body;
      await pool.query('DELETE FROM transactions WHERE id = ?', [id]);
      return NextResponse.json({ success: true });
    }

    if (action === 'add_account') {
      const { account } = body as { account: FinancialAccount };
      await pool.query(
        `INSERT INTO accounts (id, name, account_type, account_number_masked, balance, credit_limit, color, is_primary)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [account.id, account.name, account.accountType, account.accountNumberMasked || null, account.balance, account.creditLimit || null, account.color || null, account.isPrimary ? 1 : 0]
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'update_account_balance') {
      const { id, balance } = body;
      await pool.query('UPDATE accounts SET balance = ? WHERE id = ?', [balance, id]);
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_account') {
      const { id } = body;
      await pool.query('DELETE FROM accounts WHERE id = ?', [id]);
      return NextResponse.json({ success: true });
    }

    if (action === 'transfer_funds') {
      const { fromId, toId, amount } = body;
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        await conn.query('UPDATE accounts SET balance = balance - ? WHERE id = ?', [amount, fromId]);
        await conn.query('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount, toId]);
        await conn.commit();
        return NextResponse.json({ success: true });
      } catch (e: any) {
        await conn.rollback();
        throw e;
      } finally {
        conn.release();
      }
    }

    if (action === 'add_investment') {
      const { investment } = body as { investment: Investment };
      await pool.query(
        `INSERT INTO investments (id, name, symbol_or_platform, asset_type, invested_amount, current_value, units, avg_buy_price, current_price, sip_monthly_amount, sip_date, expected_return_rate, last_updated, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          investment.id, investment.name, investment.symbolOrPlatform || null, investment.assetType,
          investment.investedAmount, investment.currentValue, investment.units || null,
          investment.avgBuyPrice || null, investment.currentPrice || null, investment.sipMonthlyAmount || null,
          investment.sipDate || null, investment.expectedReturnRate || null, investment.lastUpdated || '2026-11-21',
          investment.notes || null
        ]
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_investment') {
      const { id } = body;
      await pool.query('DELETE FROM investments WHERE id = ?', [id]);
      return NextResponse.json({ success: true });
    }

    if (action === 'add_loan') {
      const { loan } = body as { loan: LoanLiability };
      await pool.query(
        `INSERT INTO loans (id, title, lender_or_borrower, loan_type, direction, principal_amount, remaining_balance, interest_rate, monthly_emi, due_day_of_month, start_date, tenure_months, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          loan.id, loan.title, loan.lenderOrBorrower, loan.loanType, loan.direction,
          loan.principalAmount, loan.remainingBalance, loan.interestRate, loan.monthlyEmi,
          loan.dueDayOfMonth || null, loan.startDate, loan.tenureMonths, loan.notes || null
        ]
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_loan') {
      const { id } = body;
      await pool.query('DELETE FROM loans WHERE id = ?', [id]);
      return NextResponse.json({ success: true });
    }

    if (action === 'pay_emi') {
      const { loanId, emiAmount } = body;
      await pool.query('UPDATE loans SET remaining_balance = GREATEST(0, remaining_balance - ?) WHERE id = ?', [emiAmount, loanId]);
      return NextResponse.json({ success: true });
    }

    if (action === 'reset_demo' || action === 'clear_all') {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        await conn.query('DELETE FROM accounts');
        await conn.query('DELETE FROM transactions');
        await conn.query('DELETE FROM investments');
        await conn.query('DELETE FROM loans');
        await conn.query('DELETE FROM budgets');
        await conn.query('DELETE FROM goals');
        await conn.query('DELETE FROM subscriptions');
        await conn.query('DELETE FROM insurances');

        await conn.commit();
        return NextResponse.json({ success: true, message: 'All sample/demo data cleared cleanly from MySQL' });
      } catch (e: any) {
        await conn.rollback();
        throw e;
      } finally {
        conn.release();
      }
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('MySQL POST Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Database operation failed' },
      { status: 500 }
    );
  }
}
