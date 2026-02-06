import React, { useState } from 'react';
import { Sparkles, Plus, X, AlertCircle, Loader2, Settings } from 'lucide-react';
import type { Person, Gift, GiftSuggestion } from '../types';
import { llmService } from '../services/llmService';

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

  const activeConfig = llmService.getActiveConfig();

  const handleGenerate = async () => {
    if (!activeConfig) return;

    setLoading(true);
    setError(null);
    setSuggestions([]);
    setAddedIds(new Set());

    try {
      const existingTitles = existingGifts.map(g => g.title);
      const results = await llmService.getGiftSuggestions(
        activeConfig,
        person.name,
        person.relationship,
        Math.max(budget, 0),
        existingTitles
      );
      setSuggestions(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuggestion = (suggestion: GiftSuggestion, index: number) => {
    onAddGift(suggestion);
    setAddedIds(prev => new Set(prev).add(index));
  };

  if (!activeConfig) {
    return (
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-purple-900 dark:text-purple-200">
                No LLM Provider Configured
              </h3>
              <p className="mt-1 text-sm text-purple-700 dark:text-purple-300">
                To get AI-powered gift suggestions, add an LLM provider in Settings.
                Supports Anthropic (Claude), OpenAI (GPT), or any custom/local LLM with an OpenAI-compatible API.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-purple-400 hover:text-purple-600 dark:hover:text-purple-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-sm font-medium text-purple-900 dark:text-purple-200">
            AI Gift Suggestions
          </h3>
          <span className="text-xs text-purple-500 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded-full">
            {activeConfig.name}
          </span>
        </div>
        <button onClick={onClose} className="text-purple-400 hover:text-purple-600 dark:hover:text-purple-200">
          <X className="w-4 h-4" />
        </button>
      </div>

      {suggestions.length === 0 && !loading && !error && (
        <div className="text-center py-4">
          <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
            Get personalized gift suggestions for {person.name} based on their relationship and your budget.
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
          <span className="text-sm text-purple-700 dark:text-purple-300">Thinking of gift ideas...</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
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
