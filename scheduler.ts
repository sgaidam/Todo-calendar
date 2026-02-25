// src/lib/scheduler.ts
export type Task = {
    id: string;
    title: string;
    notes?: string;
    dueDate?: string; // ISO date: "2026-02-24"
    importance: 1 | 2 | 3 | 4 | 5; // user input
    effortMins: number; // user input (estimate)
    createdAt: string; // ISO datetime
    mustDoToday?: boolean;
    dependsOnIds?: string[]; // optional dependency ids
    completed?: boolean;
  };
  
  export type PlannedItem = {
    taskId: string;
    title: string;
    startMin: number; // minutes from day start
    endMin: number;
    score: number;
    reasons: string[];
  };
  
  export type Plan = {
    dayStart: string; // "09:00"
    dayEnd: string;   // "17:00"
    items: PlannedItem[];
    unplanned: { taskId: string; title: string; reason: string }[];
  };
  
  function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
  }
  
  function parseHHMM(hhmm: string): number {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  }
  
  function daysUntil(dueISO?: string): number | null {
    if (!dueISO) return null;
    const now = new Date();
    const due = new Date(dueISO + "T23:59:59");
    const diffMs = due.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }
  
  export function isBlocked(task: Task, tasksById: Map<string, Task>): boolean {
    const deps = task.dependsOnIds ?? [];
    for (const depId of deps) {
      const dep = tasksById.get(depId);
      if (dep && !dep.completed) return true;
    }
    return false;
  }
  
  /**
   * Rule-based score:
   * - importance (0..50)
   * - urgency based on due date (0..40)
   * - must-do-today bonus (+30)
   * - blocked penalty (-1000) so it sinks below unblocked
   * - effort: slight preference for shorter tasks (+ up to 10)
   */
  export type ScoreDetail = {
    score: number;
    reasons: string[];
  };
  
  export function scoreTaskDetailed(task: Task, tasksById: Map<string, Task>): ScoreDetail {
    const reasons: string[] = [];
  
    if (task.completed) {
      return { score: -9999, reasons: ["Completed (excluded)"] };
    }
  
    const blocked = isBlocked(task, tasksById);
    if (blocked) reasons.push("Blocked by dependency (-1000)");
  
    const importanceScore = task.importance * 10;
    reasons.push(`Importance ${task.importance}/5 (+${importanceScore})`);
  
    const du = daysUntil(task.dueDate);
    let urgencyScore = 0;
    if (du !== null) {
      if (du <= 0) { urgencyScore = 40; reasons.push(`Due today/overdue (+${urgencyScore})`); }
      else if (du === 1) { urgencyScore = 32; reasons.push(`Due tomorrow (+${urgencyScore})`); }
      else if (du <= 3) { urgencyScore = 24; reasons.push(`Due in ${du} days (+${urgencyScore})`); }
      else if (du <= 7) { urgencyScore = 12; reasons.push(`Due within a week (+${urgencyScore})`); }
      else { urgencyScore = 4; reasons.push(`Due later (+${urgencyScore})`); }
    } else {
      reasons.push("No due date (+0)");
    }
  
    const mustDoBonus = task.mustDoToday ? 30 : 0;
    reasons.push(task.mustDoToday ? `Must-do today (+${mustDoBonus})` : "Not marked must-do (+0)");
  
    const effortBonus = clamp(Math.round((120 - task.effortMins) / 12), 0, 10);
    reasons.push(`Effort ${task.effortMins}m (short-task bias +${effortBonus})`);
  
    const blockedPenalty = blocked ? -1000 : 0;
  
    const score = importanceScore + urgencyScore + mustDoBonus + effortBonus + blockedPenalty;
    return { score, reasons };
  }
  
  export function scoreTask(task: Task, tasksById: Map<string, Task>): number {
    return scoreTaskDetailed(task, tasksById).score;
  }

  export function buildDayPlan(params: {
    tasks: Task[];
    dayStart?: string; // default 09:00
    dayEnd?: string;   // default 17:00
    focusMins?: number; // optional cap, e.g., 240
  }): Plan {
    const dayStart = params.dayStart ?? "09:00";
    const dayEnd = params.dayEnd ?? "17:00";
  
    const startMin = parseHHMM(dayStart);
    const endMin = parseHHMM(dayEnd);
  
    const tasksById = new Map(params.tasks.map(t => [t.id, t]));
    const scored = params.tasks
      .filter(t => !t.completed)
      .map(t => {
  const detail = scoreTaskDetailed(t, tasksById);
  return { t, score: detail.score, reasons: detail.reasons };
})
      .sort((a, b) => b.score - a.score);
  
    const items: PlannedItem[] = [];
    const unplanned: Plan["unplanned"] = [];
  
    let cursor = startMin;
    const hardEnd = params.focusMins ? Math.min(endMin, startMin + params.focusMins) : endMin;
  
    for (const { t, score, reasons } of scored) {
      if (isBlocked(t, tasksById)) {
        unplanned.push({ taskId: t.id, title: t.title, reason: "Blocked by dependency" });
        continue;
      }
  
      const duration = Math.max(5, t.effortMins);
      if (cursor + duration <= hardEnd) {
        items.push({
          taskId: t.id,
          title: t.title,
          startMin: cursor - startMin,
          endMin: cursor - startMin + duration,
          score,
          reasons,
        });
        cursor += duration;
      } else {
        unplanned.push({ taskId: t.id, title: t.title, reason: "Not enough time in day window" });
      }
    }
  
    return { dayStart, dayEnd, items, unplanned };
  }
  
  export function formatPlanTime(dayStartHHMM: string, offsetMins: number): string {
    const base = parseHHMM(dayStartHHMM);
    const total = base + offsetMins;
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }