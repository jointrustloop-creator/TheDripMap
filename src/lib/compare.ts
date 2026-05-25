'use client';

import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'tdm_compare_ids';
const MAX_COMPARE = 3;
const CHANGE_EVENT = 'tdm_compare_change';

function readIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {}
}

export function useCompare() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(readIds());
    const onChange = () => setIds(readIds());
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  const isSelected = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback((id: string) => {
    const current = readIds();
    let next: string[];
    if (current.includes(id)) {
      next = current.filter((x) => x !== id);
    } else if (current.length >= MAX_COMPARE) {
      return { added: false, reason: 'max' as const };
    } else {
      next = [...current, id];
    }
    writeIds(next);
    return { added: !current.includes(id), reason: null };
  }, []);

  const remove = useCallback((id: string) => {
    const current = readIds();
    writeIds(current.filter((x) => x !== id));
  }, []);

  const clear = useCallback(() => writeIds([]), []);

  return { ids, count: ids.length, max: MAX_COMPARE, isSelected, toggle, remove, clear };
}

export const COMPARE_MAX = MAX_COMPARE;
