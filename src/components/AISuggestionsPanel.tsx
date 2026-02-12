import React, { useState } from 'react';
import { Sparkles, Plus, X, AlertCircle, Loader2, Settings, Server } from 'lucide-react';
import type { Person, Gift, GiftSuggestion } from '../types';
import { llmService } from '../services/llmService';
import { api } from '../lib/api';

interface AISuggestionsPanelProps {
  person: Person;
  existingGifts: Gift[];
  budget: number;
  onAddGift: (suggestion: GiftSuggestion) => void;
  onClose: () => void;
}

export function AISuggestionsPanel({
  person,
  existingGifts,
  budget,
  onAddGift,
  onClose,
}: AISuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [sourceLabel, setSourceLabel] = useState<string | null>(null);

  const activeConfig = llmService.getActiveConfig();

  /**
   * Try server-side /api/ai/suggestions first (uses server env config, no
   * credentials needed from client). Falls back to client-configured LLM
   * if the server returns 503 (not configured) or on network error.
   */
  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuggestions([]);
    setAddedIds(new Set());
    setSourceLabel(null);

    // Build gift context payload
    const giftPayload = existingGifts.map(g => ({
      title: g.title,
      price: g.price,
      status: g.status,
      notes: g.notes,
    }));

    let results: GiftSuggestion[] | null = null;

    // 1. Try server-side endpoint
    try {
      const data = await api.post<{ suggestions: GiftSuggestion[] }>('/api/ai/suggestions', {
        personName: person.name,
        relationship: person.relationship,
        budget: Math.max(budget, 0),
        notes: person.notes,
        existingGifts: giftPayload,
      });
      results = data.suggestions;
      setSourceLabel('server');
    } catch (serverErr) {
      // If 503 = server not configured, fall through to client config
      const is503 = serverErr instanceof Error && serverErr.message.includes('503');
      const isNetworkErr = serverErr instanceof Error && serverErr.message.includes('Session expired');
      if (!is503 && !isNetworkErr) {
        // Server had an actual error (502, 500) — report it
        const msg = serverErr instanceof Error ? serverErr.message : 'Server AI request failed';
        // Still try client fallback
        console.warn('Server AI failed, trying client config:', msg);
      }
    }

    // 2. Fall back to client-configured LLM if server didn't provide results
    if (!results && activeConfig) {
      try {
        results = await llmService.getGiftSuggestions(
          activeConfig,
          person.name,
          person.relationship,
          Math.max(budget, 0),
          existingGifts,
          person.notes
        );
        setSourceLabel(activeConfig.name);
      } catch (clientErr) {
        setError(clientErr instanceof Error ? clientErr.message : 'Failed to get suggestions');
        setLoading(false);
        return;
      }
    }

    if (!results) {
      setError('No AI provider available. Configure an LLM in Settings or ask your admin to set up the server AI.');
      setLoading(false);
      return;
    }

    setSuggestions(results);
    setLoading(false);
  };

  const handleAddSuggestion = (suggestion: GiftSuggestion, index: number) => {
    onAddGift(suggestion);
    setAddedIds(prev => new Set(prev).add(index));
  };

  // No config at all (no server config and no client config)
  // We still show the panel since the server might have config
  return (
    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-sm font-medium text-purple-900 dark:text-purple-200">
            AI Gift Suggestions
          </h3>
          {sourceLabel && (
            <span className="text-xs text-purple-500 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded-full flex items-center gap-1">
              {sourceLabel === 'server' ? <Server className="w-3 h-3" /> : null}
              {sourceLabel === 'server' ? 'server' : sourceLabel}
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-purple-400 hover:text-purple-600 dark:hover:text-purple-200">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Hint about notes */}
      {!person.notes && suggestions.length === 0 && !loading && (
        <div className="mb-3 text-xs text-purple-600 dark:text-purple-400 bg-purple-100/50 dark:bg-purple-900/30 rounded-md px-3 py-2">
          💡 Add notes about {person.name} above for more personalized suggestions
        </div>
      )}

      {suggestions.length === 0 && !loading && !error && (
        <div className="text-center py-4">
          <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
            Get personalized gift suggestions for {person.name} based on their
            {person.notes ? ' interests and' : ''} gift history and budget.
          </p>
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
          >
            <Sparkles className="w-4 h-4" />
            Generate Suggestions
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8 gap-2">
          <Loader2 className="w-5 h-5 text-purple-600 dark:text-purple-400 animate-spin" />
          <span className="text-sm text-purple-700 dark:text-purple-300">Thinking of gift ideas…</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            {!activeConfig && (
              <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                <Settings className="w-3 h-3 inline mr-1" />
                Add an LLM provider in Settings to use client-side AI
              </p>
            )}
            <button
              onClick={handleGenerate}
              className="mt-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-100 dark:border-purple-800"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{suggestion.title}</h4>
                    <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                      ${suggestion.estimatedPrice}
                    </span>
                  </div>
                  {suggestion.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{suggestion.description}</p>
                  )}
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 italic">{suggestion.reason}</p>
                </div>
                <button
                  onClick={() => handleAddSuggestion(suggestion, index)}
                  disabled={addedIds.has(index)}
                  className={`ml-3 p-2 rounded-full flex-shrink-0 ${
                    addedIds.has(index)
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/60'
                  }`}
                  title={addedIds.has(index) ? 'Added' : 'Add as gift idea'}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          <div className="text-center pt-2">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"
            >
              Generate more suggestions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
