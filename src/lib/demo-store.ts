// Shared in-memory demo store so UI feels alive across navigations.
import { useSyncExternalStore } from "react";

export type Priority = "critical" | "medium" | "low";
export type Status = "todo" | "doing" | "done";

export type Task = {
  id: string;
  title: string;
  priority: Priority;
  status: Status;
  focus_minutes: number;
  created_at: string;
  completed_at: string | null;
};

export type CalEvent = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  priority: Priority;
};

type State = {
  tasks: Task[];
  events: CalEvent[];
  points: number;
  streak: number;
  lifestyle: string;
};

const uid = () => Math.random().toString(36).slice(2, 10);
const todayAt = (h: number, m = 0) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

const initial: State = {
  tasks: [
    { id: uid(), title: "Finish investor deck v2", priority: "critical", status: "todo", focus_minutes: 60, created_at: new Date().toISOString(), completed_at: null },
    { id: uid(), title: "Reply to Priya's email", priority: "critical", status: "todo", focus_minutes: 15, created_at: new Date().toISOString(), completed_at: null },
    { id: uid(), title: "Gym — leg day", priority: "medium", status: "todo", focus_minutes: 45, created_at: new Date().toISOString(), completed_at: null },
    { id: uid(), title: "Plan weekend trip", priority: "medium", status: "todo", focus_minutes: 30, created_at: new Date().toISOString(), completed_at: null },
    { id: uid(), title: "Read 20 pages", priority: "low", status: "done", focus_minutes: 25, created_at: new Date().toISOString(), completed_at: new Date().toISOString() },
    { id: uid(), title: "Water the plants", priority: "low", status: "todo", focus_minutes: 5, created_at: new Date().toISOString(), completed_at: null },
  ],
  events: [
    { id: uid(), title: "Deep work — investor deck", starts_at: todayAt(9), ends_at: todayAt(10, 30), priority: "critical" },
    { id: uid(), title: "Standup", starts_at: todayAt(11), ends_at: todayAt(11, 30), priority: "medium" },
    { id: uid(), title: "Gym — leg day", starts_at: todayAt(14), ends_at: todayAt(14, 45), priority: "medium" },
    { id: uid(), title: "Inbox zero", starts_at: todayAt(16), ends_at: todayAt(16, 30), priority: "low" },
  ],
  points: 320,
  streak: 7,
  lifestyle: "",
};

let state: State = initial;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };

export const store = {
  get: () => state,
  set: (patch: Partial<State> | ((s: State) => Partial<State>)) => {
    const next = typeof patch === "function" ? patch(state) : patch;
    state = { ...state, ...next };
    emit();
  },
};

export function useDemo<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}

// Actions
export const actions = {
  addTask(title: string, priority: Priority, focus_minutes = 25) {
    const t: Task = { id: uid(), title, priority, status: "todo", focus_minutes, created_at: new Date().toISOString(), completed_at: null };
    store.set((s) => ({ tasks: [t, ...s.tasks] }));
  },
  setStatus(id: string, status: Status) {
    store.set((s) => {
      let pointsBump = 0;
      const tasks = s.tasks.map((t) => {
        if (t.id !== id) return t;
        if (status === "done" && t.status !== "done") {
          pointsBump = t.priority === "critical" ? 25 : t.priority === "medium" ? 15 : 8;
        }
        return { ...t, status, completed_at: status === "done" ? new Date().toISOString() : null };
      });
      return { tasks, points: s.points + pointsBump };
    });
  },
  setPriority(id: string, priority: Priority) {
    store.set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, priority } : t) }));
  },
  removeTask(id: string) {
    store.set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  },
  autoSchedule() {
    // Clear today and slot todo tasks 9–17 with 10m breaks, by priority order.
    const order: Priority[] = ["critical", "medium", "low"];
    const todos = [...state.tasks].filter((t) => t.status !== "done").sort((a, b) => order.indexOf(a.priority) - order.indexOf(b.priority));
    const events: CalEvent[] = [];
    let cursor = new Date(); cursor.setHours(9, 0, 0, 0);
    const dayEnd = new Date(); dayEnd.setHours(17, 0, 0, 0);
    for (const t of todos) {
      const dur = Math.max(15, t.focus_minutes || 25);
      const end = new Date(cursor.getTime() + dur * 60000);
      if (end > dayEnd) break;
      events.push({ id: uid(), title: t.title, starts_at: cursor.toISOString(), ends_at: end.toISOString(), priority: t.priority });
      cursor = new Date(end.getTime() + 10 * 60000);
    }
    store.set({ events });
    return events.length;
  },
  setLifestyle(text: string) {
    store.set({ lifestyle: text });
  },
};
