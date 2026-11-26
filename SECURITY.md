# 🛡️ Security Policy — FinGroww

The FinGroww team takes the privacy, confidentiality, and integrity of your personal financial data seriously. Because this application processes and displays sensitive financial information (bank balances, investments, loans, and expenses), we follow security-by-design principles throughout development.

---

## 📋 Supported Versions

We actively provide security patches and improvements for the following versions:

| Version | Supported | Notes |
| :--- | :--- | :--- |
| `0.1.x` | ✅ Yes | Current active branch (Next.js 16 + React 19) |
| `< 0.1.0` | ❌ No | Deprecated development prototypes |

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability within FinGroww, **please do not open a public issue on GitHub**. Publicly disclosing an unpatched vulnerability exposes users to risk.

Instead, please report vulnerabilities responsibly:

1. **Email Contact**: Send details of the vulnerability to:
   - **`security@fingroww.app`** (or contact the repository maintainer directly via private message).
2. **Details to Include**:
   - Description of the vulnerability and its potential impact.
   - Step-by-step reproduction instructions or Proof of Concept (PoC).
   - Component or file(s) affected (e.g., API route, SQL queries, or client-side components).
   - Any suggested mitigations or patches.
3. **Response Timeline**:
   - **Initial Acknowledgement**: Within **24–48 hours**.
   - **Triage & Assessment**: Within **3–5 business days**.
   - **Fix & Patch Deployment**: Prioritized based on severity (Critical issues patched within 7 business days).

---

## 🔒 Security Architecture & Guarantees

### 1. Database & Credential Isolation
* **Server-Side Only**: All database operations occur exclusively on the Next.js backend server (`src/app/api/finance/route.ts`). Database credentials (`MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`) are read strictly from `.env.local` and never exposed to client-side bundles.
* **Parameterized Queries**: All database queries utilize parameterized statements (`mysql2/promise` with prepared statements) to prevent SQL injection vulnerabilities.
* **No Hardcoded Secrets**: Secrets and connection strings are excluded from version control via `.gitignore`.

### 2. Client-Side Privacy & Shoulder-Surfing Protection
* **Privacy Mode**: FinGroww features a client-side Privacy Mask mode that replaces financial balances with `••••••` across all cards, graphs, and metric lists, preventing visual eavesdropping in public or office environments.
* **Local State Resilience**: Cached state stored in browser `localStorage` is scoped exclusively to the application origin and is cleared whenever requested.

### 3. Speech & SMS Privacy
* **Offline Web Speech API**: The Voice Expense Logger uses standard browser SpeechRecognition APIs with no background audio streaming to third-party ad networks.
* **Client-Side SMS Processing**: The Bank SMS Parser runs purely client-side regex without transmitting raw SMS message text to any external NLP service.

### 4. Android APK Security
* The generated Android APK wrapper runs within a sandboxed WebView with disabled file access to external storage outside the app sandbox.
* The application package is aligned with `zipalign` and signed using standard `apksigner` cryptographic keys.

---

## 🛡️ Recommended Best Practices for Self-Hosters

If you are self-hosting your own instance of FinGroww:

1. **Use HTTPS / TLS**: Always deploy behind a reverse proxy (e.g., Nginx, Caddy, or Cloudflare) with automated SSL/TLS certificates.
2. **Restrict Database Access**: Ensure your MySQL database firewall allows incoming connections **only** from your Next.js server IP address.
3. **Rotate Passwords Periodically**: Use strong, randomly generated database passwords with minimum privileges (do not use root user for the application).
4. **Regular Dependency Audits**: Periodically run `npm audit` or `pnpm audit` to identify and patch vulnerabilities in upstream npm packages.

---

Thank you for helping keep FinGroww and its users safe! 🚀
