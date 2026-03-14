import { useState, useEffect, useCallback } from "react";
import { GenerationResult, Session } from "@/lib/types";

const STORAGE_KEY = "luminary_session";

function createSession(): Session {
  return { id: crypto.randomUUID(), createdAt: Date.now(), results: [], conversation: [] };
}

function loadSession(): Session {
  if (typeof window === "undefined") return createSession();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return createSession();
}

export function useHistory() {
  const [session, setSession] = useState<Session>(createSession);

  useEffect(() => { setSession(loadSession()); }, []);

  const addResult = useCallback((result: GenerationResult) => {
    setSession((prev) => {
      const next = { ...prev, results: [...prev.results, result] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const clearSession = useCallback(() => {
    const fresh = createSession();
    setSession(fresh);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh)); } catch {}
  }, []);

  return { session, addResult, clearSession };
}
