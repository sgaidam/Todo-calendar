"use client";

import React, { useEffect, useMemo, useState } from "react";
import { buildDayPlan, formatPlanTime, type Task } from "./scheduler";

function uid() {
  return Math.random().toString(36).slice(2);
}

export default function Planner() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: uid(),
      title: "Write problem set",
      importance: 4,
      effortMins: 90,
      dueDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      mustDoToday: true,
      completed: false,
    },
    {
      id: uid(),
      title: "Email advisor",
      importance: 3,
      effortMins: 15,
      createdAt: new Date().toISOString(),
      completed: false,
    },
  ]);

  const STORAGE_KEY = "todo-calendar.tasks.v1";

useEffect(() => {
  // load tasks on first mount
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setTasks(JSON.parse(raw));
  } catch (e) {
    console.error("Failed to load tasks", e);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

useEffect(() => {
  // save tasks whenever they change
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error("Failed to save tasks", e);
  }
}, [tasks]);

  const [title, setTitle] = useState("");
  const [importance, setImportance] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [effortMins, setEffortMins] = useState(30);
  const [dueDate, setDueDate] = useState<string>("");
  const [mustDoToday, setMustDoToday] = useState(false);

  const [dayStart, setDayStart] = useState("09:00");
  const [dayEnd, setDayEnd] = useState("17:00");
  const [focusMins, setFocusMins] = useState<number>(240);

  const plan = useMemo(() => {
    return buildDayPlan({ tasks, dayStart, dayEnd, focusMins });
  }, [tasks, dayStart, dayEnd, focusMins]);

  function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const t: Task = {
      id: uid(),
      title: title.trim(),
      importance,
      effortMins: Math.max(5, effortMins),
      dueDate: dueDate || undefined,
      createdAt: new Date().toISOString(),
      mustDoToday,
      completed: false,
    };
    setTasks(prev => [t, ...prev]);
    setTitle("");
    setDueDate("");
    setMustDoToday(false);
    setEffortMins(30);
    setImportance(3);
  }

  function toggleComplete(id: string) {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }

  function removeTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16, display: "grid", gap: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Todo Calendar</h1>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
        <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Add task</h2>

          <form onSubmit={addTask} style={{ display: "grid", gap: 10 }}>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Task title"
              style={{ padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
            />

            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span>Importance (1–5)</span>
                <select
                  value={importance}
                  onChange={e => setImportance(Number(e.target.value) as any)}
                  style={{ padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span>Effort (minutes)</span>
                <input
                  type="number"
                  value={effortMins}
                  onChange={e => setEffortMins(Number(e.target.value))}
                  min={5}
                  step={5}
                  style={{ padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
                />
              </label>
            </div>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Due date (optional)</span>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                style={{ padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
              />
            </label>

            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={mustDoToday}
                onChange={e => setMustDoToday(e.target.checked)}
              />
              <span>Must do today</span>
            </label>

            <button
              type="submit"
              style={{
                padding: 10,
                borderRadius: 10,
                border: "1px solid #000",
                background: "#000",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Add
            </button>
          </form>
        </div>

        <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Planning window</h2>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span>Day start</span>
              <input
                value={dayStart}
                onChange={e => setDayStart(e.target.value)}
                style={{ padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Day end</span>
              <input
                value={dayEnd}
                onChange={e => setDayEnd(e.target.value)}
                style={{ padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
              />
            </label>
          </div>

          <label style={{ display: "grid", gap: 6, marginTop: 10 }}>
            <span>Focus minutes (cap)</span>
            <input
              type="number"
              value={focusMins}
              onChange={e => setFocusMins(Number(e.target.value))}
              min={30}
              step={15}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
            />
          </label>

          <p style={{ marginTop: 10, color: "#555" }}>
            This is a greedy scheduler: it ranks tasks using rule-based scoring, then fits what it can
            into your focus window.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
        <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Tasks</h2>

          <div style={{ display: "grid", gap: 10 }}>
            {tasks.map(t => (
              <div
                key={t.id}
                style={{
                  display: "grid",
                  gap: 8,
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #eee",
                  background: t.completed ? "#f6f6f6" : "white",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, textDecoration: t.completed ? "line-through" : "none" }}>
                      {t.title}
                    </div>
                    <div style={{ color: "#666", fontSize: 13 }}>
                      importance {t.importance} • {t.effortMins}m
                      {t.dueDate ? ` • due ${t.dueDate}` : ""}
                      {t.mustDoToday ? " • must-do" : ""}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      onClick={() => toggleComplete(t.id)}
                      style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid #ccc" }}
                    >
                      {t.completed ? "Undo" : "Done"}
                    </button>
                    <button
                      onClick={() => removeTask(t.id)}
                      style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid #ccc" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Today’s plan</h2>

          <div style={{ display: "grid", gap: 10 }}>
            {plan.items.map(item => (
              <div
                key={item.taskId}
                style={{ padding: 12, borderRadius: 12, border: "1px solid #eee" }}
              >
                <div style={{ fontWeight: 600 }}>{item.title}</div>
                <div style={{ color: "#666", fontSize: 13 }}>
                  {formatPlanTime(plan.dayStart, item.startMin)} – {formatPlanTime(plan.dayStart, item.endMin)} •
                  score {item.score}
                  <ul style={{ marginTop: 6, paddingLeft: 18, color: "#666", fontSize: 13 }}>
  {item.reasons?.map((r, idx) => (
    <li key={idx}>{r}</li>
  ))}
</ul>
                </div>
              </div>
            ))}

            {plan.items.length === 0 && (
              <div style={{ color: "#666" }}>No items scheduled (add tasks or increase focus minutes).</div>
            )}
          </div>

          {plan.unplanned.length > 0 && (
            <>
              <h3 style={{ marginTop: 14, fontSize: 15, fontWeight: 700 }}>Unplanned</h3>
              <ul style={{ marginTop: 8, color: "#666" }}>
                {plan.unplanned.map(u => (
                  <li key={u.taskId}>
                    {u.title} — {u.reason}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}