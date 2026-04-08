import { useState, useCallback } from 'react';

/** Undo state: a message to display and a rollback action */
interface UndoEntry {
  message: string;
  action: () => void;
}

/**
 * Hook for managing a single undo toast.
 * Provides push (show undo) and dismiss (clear) operations.
 * @returns Current undo state + push/dismiss callbacks
 */
export function useUndoManager() {
  const [undo, setUndo] = useState<UndoEntry | null>(null);

  /** Show an undo toast with a rollback action */
  const push = useCallback((message: string, rollback: () => void): void => {
    setUndo({ message, action: () => { rollback(); setUndo(null); } });
  }, []);

  /** Dismiss the current undo toast */
  const dismiss = useCallback((): void => {
    setUndo(null);
  }, []);

  return { undo, push, dismiss };
}
