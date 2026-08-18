import { secretScanner } from '../security/secretScanner';

/**
 * AI Commit Generation Service
 * Generates concise, accurate conventional commits from git diffs.
 */
export const aiService = {
  /**
   * Heuristic commit generator (offline / fallback)
   */
  generateHeuristicCommit(files, diffStat) {
    if (!files || files.length === 0) {
      return 'chore: update project files';
    }

    const firstFile = files[0].path.toLowerCase();
    const isDoc = files.every((f) => f.path.endsWith('.md') || f.path.includes('doc'));
    const isStyle = files.every((f) => f.path.endsWith('.css') || f.path.endsWith('.scss'));
    const isTest = files.some((f) => f.path.includes('test') || f.path.includes('spec'));
    const isConfig = files.some((f) => f.path.includes('config') || f.path.endsWith('.json'));

    const baseName = files[0].path.split(/[\\/]/).pop().replace(/\.[^/.]+$/, '');

    if (isDoc) return `docs: update documentation for ${baseName}`;
    if (isStyle) return `style: refine styling and UI components in ${baseName}`;
    if (isTest) return `test: add and update test suites for ${baseName}`;
    if (isConfig) return `chore: update build and project configurations`;

    if (files.some((f) => f.status === 'added')) {
      return `feat: implement ${baseName} functionality`;
    }

    if (files.some((f) => f.status === 'deleted')) {
      return `refactor: clean up obsolete modules in ${baseName}`;
    }

    return `feat: refine ${baseName} workflow and logic`;
  },

  /**
   * Generate commit message via OpenAI or fallback heuristic
   */
  async generateCommitMessage({ apiKey, model = 'gpt-4o-mini', diffText, files, diffStat, customPrompt }) {
    // If no API key or AI disabled, use heuristic
    if (!apiKey) {
      return this.generateHeuristicCommit(files, diffStat);
    }

    try {
      const sanitizedDiff = secretScanner.sanitizeDiffForAI(diffText || diffStat || '');

      const systemPrompt =
        'You are an expert Git commit assistant. Analyze the diff and generate a single-line conventional commit message.\n' +
        'Allowed prefixes: feat, fix, refactor, perf, style, docs, test, chore.\n' +
        'Format: <type>: <imperative description in lowercase without period>.\n' +
        'Example: feat: improve graph traversal animation controls\n' +
        'Respond ONLY with the commit message string, nothing else.';

      const userContent = `Changed files:\n${files.map((f) => `${f.status}: ${f.path}`).join('\n')}\n\nDiff snippet:\n${sanitizedDiff}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: customPrompt || systemPrompt },
            { role: 'user', content: userContent },
          ],
          max_tokens: 60,
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        console.warn('OpenAI API request failed, falling back to heuristic:', response.statusText);
        return this.generateHeuristicCommit(files, diffStat);
      }

      const data = await response.json();
      const generated = data?.choices?.[0]?.message?.content?.trim();
      return generated || this.generateHeuristicCommit(files, diffStat);
    } catch (err) {
      console.warn('AI commit generation error, fallback used:', err);
      return this.generateHeuristicCommit(files, diffStat);
    }
  },
};
