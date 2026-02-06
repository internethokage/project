import { useState, useCallback, useEffect } from 'react';
import type { LLMConfig } from '../types';
import { llmService } from '../services/llmService';

export function useLLMConfig() {
  const [configs, setConfigs] = useState<LLMConfig[]>([]);
  const [activeConfig, setActiveConfig] = useState<LLMConfig | null>(null);

  useEffect(() => {
    const loaded = llmService.getConfigs();
    setConfigs(loaded);
    setActiveConfig(loaded.find(c => c.isActive) ?? null);
  }, []);

  const addConfig = useCallback((config: Omit<LLMConfig, 'id'>) => {
    const newConfig = llmService.addConfig(config);
    const updated = llmService.getConfigs();
    setConfigs(updated);
    setActiveConfig(updated.find(c => c.isActive) ?? null);
    return newConfig;
  }, []);

  const updateConfig = useCallback((id: string, updates: Partial<LLMConfig>) => {
    const updated = llmService.updateConfig(id, updates);
    if (updated) {
      const all = llmService.getConfigs();
      setConfigs(all);
      setActiveConfig(all.find(c => c.isActive) ?? null);
    }
    return updated;
  }, []);

  const deleteConfig = useCallback((id: string) => {
    llmService.deleteConfig(id);
    const remaining = llmService.getConfigs();
    setConfigs(remaining);
    setActiveConfig(remaining.find(c => c.isActive) ?? null);
  }, []);

  const setActive = useCallback((id: string) => {
    llmService.updateConfig(id, { isActive: true });
    const all = llmService.getConfigs();
    setConfigs(all);
    setActiveConfig(all.find(c => c.isActive) ?? null);
  }, []);

  return {
    configs,
    activeConfig,
    addConfig,
    updateConfig,
    deleteConfig,
    setActive,
  };
}
