/**
 * Secret Scanner & Sensitive File Guard
 * Protects against accidental commits of secrets, API keys, credentials, and env files.
 */

const BLOCKED_FILE_PATTERNS = [
  /^\.env(\..+)?$/i,
  /\.pem$/i,
  /\.key$/i,
  /\.pfx$/i,
  /\.p12$/i,
  /credentials\.json$/i,
  /secrets\.json$/i,
  /service-account.*\.json$/i,
  /id_rsa$/i,
  /id_ed25519$/i,
];

const SECRET_REGEX_PATTERNS = [
  { name: 'OpenAI API Key', regex: /sk-[a-zA-Z0-9_-]{20,}/ },
  { name: 'GitHub Personal Token', regex: /gh[pousr]_[A-Za-z0-9_]{36,}/ },
  { name: 'AWS Access Key ID', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'AWS Secret Key', regex: /(aws_secret_access_key|aws_sec_key)\s*=\s*['"][A-Za-z0-9/+=]{40}['"]/i },
  { name: 'Private Key Header', regex: /-----BEGIN (RSA|EC|DSA|OPENSSH|PGP) PRIVATE KEY-----/ },
  { name: 'Slack Bot/User Token', regex: /xox[baprs]-[0-9a-zA-Z]{10,48}/ },
  { name: 'Generic Password Assignment', regex: /(password|passwd|pwd|secret_token|auth_token)\s*[:=]\s*['"][^\s'"]{8,}['"]/i },
  { name: 'Stripe API Key', regex: /sk_live_[0-9a-zA-Z]{24}/ },
];

export const secretScanner = {
  /**
   * Check changed file list for blocked filenames
   */
  checkFiles(fileList) {
    const findings = [];

    for (const file of fileList) {
      const fileName = file.path.split(/[\\/]/).pop();
      for (const pattern of BLOCKED_FILE_PATTERNS) {
        if (pattern.test(fileName)) {
          findings.push({
            file: file.path,
            type: 'Blocked Sensitive File',
            reason: `File "${fileName}" matches protected sensitive filename pattern`,
          });
          break;
        }
      }
    }

    return {
      hasSecrets: findings.length > 0,
      findings,
    };
  },

  /**
   * Scan diff content for potential API keys and tokens
   */
  scanDiffContent(diffText) {
    if (!diffText || typeof diffText !== 'string') {
      return { hasSecrets: false, matches: [] };
    }

    const lines = diffText.split('\n');
    const matches = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Only scan added lines in diffs
      if (!line.startsWith('+') || line.startsWith('+++')) {
        continue;
      }

      for (const rule of SECRET_REGEX_PATTERNS) {
        if (rule.regex.test(line)) {
          matches.push({
            rule: rule.name,
            line: i + 1,
            snippet: line.substring(0, 60) + '...',
          });
        }
      }
    }

    return {
      hasSecrets: matches.length > 0,
      matches,
    };
  },

  /**
   * Sanitize diff text before sending to AI (redacting any potential credential lines)
   */
  sanitizeDiffForAI(diffText) {
    if (!diffText) return '';
    let sanitized = diffText;

    for (const rule of SECRET_REGEX_PATTERNS) {
      sanitized = sanitized.replace(rule.regex, '[REDACTED_SECRET]');
    }

    // Limit maximum diff size for AI prompt (default 4000 characters)
    if (sanitized.length > 4000) {
      sanitized = sanitized.substring(0, 4000) + '\n... [Diff truncated for AI token budget]';
    }

    return sanitized;
  },
};
