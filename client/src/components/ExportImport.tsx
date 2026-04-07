import { useRef } from 'react';
import { API, fetchJSON } from '../utils/api';

interface Props {
  onImported: () => void;
}

export default function ExportImport({ onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    const data = await fetchJSON<any>(`${API}/export`);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `todolist-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const data = JSON.parse(text);
    await fetchJSON(`${API}/import`, { method: 'POST', body: JSON.stringify(data) });
    onImported();
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="export-import">
      <button onClick={handleExport} title="Export all data">&#x2B07; Export</button>
      <button onClick={() => fileRef.current?.click()} title="Import backup">&#x2B06; Import</button>
      <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
    </div>
  );
}
