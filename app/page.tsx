'use client';

import { useState } from 'react';

type Task = {
  id: string;
  title: string;
  createdAt: Date;
};

export default function Home() {
  const [title, setTitle] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);

  function addTask() {
    const trimmed = title.trim();
    if (!trimmed) return;

    setTasks((prev) => [
      { id: crypto.randomUUID(), title: trimmed, createdAt: new Date() },
      ...prev,
    ]);
    setTitle('');
  }

  return (
    <main style={{ maxWidth: 560, margin: '40px auto', padding: 16, fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Todo + Calendar (MVP)</h1>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          placeholder="Add a task…"
          style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
        />
        <button
          onClick={addTask}
          style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #ccc' }}
        >
          Add
        </button>
      </div>

      <ul style={{ marginTop: 20, paddingLeft: 18 }}>
        {tasks.map((t) => (
          <li key={t.id} style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 600 }}>{t.title}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{t.createdAt.toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
