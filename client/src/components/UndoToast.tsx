import { useEffect } from 'react';

interface Props {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export default function UndoToast({ message, onUndo, onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="undo-toast">
      <span>{message}</span>
      <button onClick={onUndo}>Undo</button>
    </div>
  );
}
