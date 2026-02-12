import type { LLMConfig, LLMMessage, GiftSuggestion, Gift } from '../types';

const STORAGE_KEY = 'giftable-llm-configs';

export const llmService = {
  getConfigs(): LLMConfig[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveConfigs(configs: LLMConfig[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
  },

  addConfig(config: Omit<LLMConfig, 'id'>): LLMConfig {
    const configs = this.getConfigs();
    const newConfig: LLMConfig = {
      ...config,
      id: crypto.randomUUID(),
    };
    // If this is the first config or marked active, deactivate others
    if (newConfig.isActive || configs.length === 0) {
      configs.forEach(c => c.isActive = false);
      newConfig.isActive = true;
    }
    configs.push(newConfig);
    this.saveConfigs(configs);
    return newConfig;
  },

  updateConfig(id: string, updates: Partial<LLMConfig>): LLMConfig | null {
    const configs = this.getConfigs();
    const index = configs.findIndex(c => c.id === id);
    if (index === -1) return null;

    if (updates.isActive) {
      configs.forEach(c => c.isActive = false);
    }
    configs[index] = { ...configs[index], ...updates };
    this.saveConfigs(configs);
    return configs[index];
  },

  deleteConfig(id: string) {
    const configs = this.getConfigs().filter(c => c.id !== id);
    this.saveConfigs(configs);
  },

  getActiveConfig(): LLMConfig | null {
    return this.getConfigs().find(c => c.isActive) ?? null;
  },

  async sendMessage(config: LLMConfig, messages: LLMMessage[]): Promise<string> {
    const { provider, apiKey, baseUrl, model } = config;

    let url: string;
    let headers: Record<string, string>;
    let body: unknown;

    switch (provider) {
      case 'anthropic': {
        url = baseUrl || 'https://api.anthropic.com/v1/messages';
        headers = {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        };
        const systemMsg = messages.find(m => m.role === 'system');
        const nonSystemMsgs = messages.filter(m => m.role !== 'system');
        body = {
          model: model || 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          ...(systemMsg ? { system: systemMsg.content } : {}),
          messages: nonSystemMsgs.map(m => ({
            role: m.role,
            content: m.content,
          })),
        };
        break;
      }
      case 'openai': {
        url = baseUrl || 'https://api.openai.com/v1/chat/completions';
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        };
        body = {
          model: model || 'gpt-4o-mini',
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          max_tokens: 1024,
        };
        break;
      }
      case 'custom': {
        if (!baseUrl) throw new Error('Custom provider requires a base URL');
        url = baseUrl;
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        };
        body = {
          model: model || 'default',
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          max_tokens: 1024,
        };
        break;
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (provider === 'anthropic') {
      return data.content?.[0]?.text ?? '';
    }
    // OpenAI and custom (OpenAI-compatible) format
    return data.choices?.[0]?.message?.content ?? '';
  },

  /**
   * Get gift suggestions using full context:
   * - Person notes (interests, preferences)
   * - Full gift history (title, price, status, notes)
   * - Budget remaining
   */
  async getGiftSuggestions(
    config: LLMConfig,
    personName: string,
    relationship: string,
    budget: number,
    existingGifts: Gift[],
    personNotes?: string | null
  ): Promise<GiftSuggestion[]> {
    // Build rich gift history text
    const giftHistoryText = existingGifts.length > 0
      ? existingGifts.map(g => {
          const parts = [`- ${g.title}`];
          if (g.price) parts.push(`($${g.price})`);
          if (g.status) parts.push(`[${g.status}]`);
          if (g.notes) parts.push(`— note: ${g.notes}`);
          return parts.join(' ');
        }).join('\n')
      : 'None yet.';

    const budgetSpent = existingGifts
      .filter(g => g.status === 'purchased' || g.status === 'given')
      .reduce((sum, g) => sum + (g.price || 0), 0);

    const personContext = personNotes ? `\nAbout them: ${personNotes}` : '';

    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `You are a thoughtful gift suggestion assistant for an app called Giftable. You suggest creative, personalized gift ideas. Always respond with valid JSON only, no markdown formatting.`,
      },
      {
        role: 'user',
        content: `Suggest 4 gift ideas for ${personName} (my ${relationship}).${personContext}

Budget remaining: $${budget}${budgetSpent > 0 ? ` (already spent $${budgetSpent})` : ''}

Their gift history:
${giftHistoryText}

Guidelines:
- Don't repeat gifts they already have
- Use their notes and history to make truly personalized suggestions
- Keep prices within the budget
- Be creative and specific — avoid generic gifts

Respond with a JSON array only. Each item must have:
- title: gift name (string)
- description: brief description (string)
- estimatedPrice: cost in dollars (number)
- reason: why this fits them specifically (string)

Return ONLY the JSON array, no other text.`,
      },
    ];

    const responseText = await this.sendMessage(config, messages);

    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON array found in response');
      const suggestions: GiftSuggestion[] = JSON.parse(jsonMatch[0]);
      return suggestions.filter(s => s.title && typeof s.estimatedPrice === 'number');
    } catch {
      console.error('Failed to parse LLM response:', responseText);
      throw new Error('Failed to parse gift suggestions from AI response');
    }
  },
};
