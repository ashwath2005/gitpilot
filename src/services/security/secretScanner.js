/**
 * Secret Scanner & Sensitive File Guard
 * Protects against accidental commits of secrets, API keys, credentials, private keys, and env files.
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
  /\.npmrc$/i,
  /\.dockercfg$/i,
];

const SECRET_REGEX_PATTERNS = [
  { name: 'OpenAI API Key', regex: /sk-[a-zA-Z0-9_-]{20,}/, severity: 'critical' },
  { name: 'GitHub Personal Token', regex: /gh[pousr]_[A-Za-z0-9_]{36,}/, severity: 'critical' },
  { name: 'AWS Access Key ID', regex: /AKIA[0-9A-Z]{16}/, severity: 'critical' },
  { name: 'AWS Secret Key', regex: /(aws_secret_access_key|aws_sec_key)\s*=\s*['"][A-Za-z0-9/+=]{40}['"]/i, severity: 'critical' },
  { name: 'Private Key Header', regex: /-----BEGIN (RSA|EC|DSA|OPENSSH|PGP) PRIVATE KEY-----/, severity: 'critical' },
  { name: 'Slack Token', regex: /xox[baprs]-[0-9a-zA-Z]{10,48}/, severity: 'high' },
  { name: 'Stripe API Key', regex: /sk_(live|test)_[0-9a-zA-Z]{24,}/, severity: 'critical' },
  { name: 'Generic Password Assignment', regex: /(password|passwd|pwd|secret_token|auth_token)\s*[:=]\s*['"][^\s'"]{8,}['"]/i, severity: 'medium' },
  { name: 'Database Connection String', regex: /(postgres|mysql|mongodb|redis):\/\/[a-zA-Z0-9_\-]+:[a-zA-Z0-9_\-]+@/i, severity: 'critical' },
];

/**
 * Compute Shannon Entropy of a string to detect high-randomness tokens
 */
function calculateShannonEntropy(str) {
  if (!str || str.length === 0) return 0;
  const frequencies = {};
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  let entropy = 0;
  for (const char in frequencies) {
    const p = frequencies[char] / str.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

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
            type: 'Blocked Sensitive File',
            file: file.path,
            severity: 'critical',
            reason: `File "${fileName}" matches protected sensitive filename pattern`,
          });
          break;
        }
      }
    }

    return {
      safe: findings.length === 0,
      hasSecrets: findings.length > 0,
      findings,
    };
  },

  /**
   * Scan diff content for potential API keys, passwords, and high-entropy tokens
   */
  scanDiffContent(diffText) {
    if (!diffText || typeof diffText !== 'string') {
      return { safe: true, hasSecrets: false, matches: [] };
    }

    const lines = diffText.split('\n');
    const matches = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Only scan added lines in diffs
      if (!line.startsWith('+') || line.startsWith('+++')) {
        continue;
      }

      const content = line.substring(1).trim();

      // 1. Regex rule checks
      for (const rule of SECRET_REGEX_PATTERNS) {
        if (rule.regex.test(content)) {
          matches.push({
            rule: rule.name,
            severity: rule.severity,
            line: i + 1,
            snippet: content.substring(0, 60) + (content.length > 60 ? '...' : ''),
          });
        }
      }

      // 2. High-entropy token heuristics for string literals > 24 chars
      const stringMatches = content.match(/['"][A-Za-z0-9_-]{28,}['"]/g);
      if (stringMatches) {
        for (const token of stringMatches) {
          const raw = token.replace(/['"]/g, '');
          const entropy = calculateShannonEntropy(raw);
          if (entropy > 4.5) {
            matches.push({
              rule: 'High-Entropy Secret String',
              severity: 'high',
              line: i + 1,
              snippet: `${raw.substring(0, 8)}...[entropy ${entropy.toFixed(2)}]`,
            });
          }
        }
      }
    }

    return {
      safe: matches.length === 0,
      hasSecrets: matches.length > 0,
      matches,
    };
  },

  /**
   * Sanitize diff text before sending to AI (redacting credentials and truncating)
   */
  sanitizeDiffForAI(diffText) {
    if (!diffText) return '';
    let sanitized = diffText;

    for (const rule of SECRET_REGEX_PATTERNS) {
      sanitized = sanitized.replace(rule.regex, '[REDACTED_SECRET]');
    }

    // Limit maximum diff size for AI prompt
    if (sanitized.length > 4000) {
      sanitized = sanitized.substring(0, 4000) + '\n... [Diff truncated for AI token budget]';
    }

    return sanitized;
  },
};
