import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'resume-analyzer-history';
const MAX_ITEMS = 5;

export const useAnalysisHistory = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch (e) {
      // ignore corrupted storage
    }
  }, []);

  const save = useCallback((entry) => {
    setHistory((prev) => {
      const item = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        score: entry.result.match_score,
        verdict: entry.result.verdict,
        jobPreview: entry.jobPreview,
        result: entry.result,
      };
      const next = [item, ...prev].slice(0, MAX_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        // storage full — ignore
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const remove = useCallback((id) => {
    setHistory((prev) => {
      const next = prev.filter((h) => h.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { history, save, clear, remove };
};
