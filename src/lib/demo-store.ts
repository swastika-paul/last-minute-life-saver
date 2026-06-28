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

  startTime?: string;
  endTime?: string;
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
  tasks: [],
  events: [],
  points: 0,
  streak: 0,
  lifestyle: "",
};
let state: State = initial;

if (typeof window !== "undefined") {
  try {
    const saved = localStorage.getItem("last-minute-store");

    if (saved) {
      state = JSON.parse(saved);
    }
  } catch {
    state = initial;
  }
}

const listeners = new Set<() => void>();
const emit = () => {
  if (typeof window !== "undefined") {
    localStorage.setItem(
      "last-minute-store",
      JSON.stringify(state)
    );
  }

  listeners.forEach((l) => l());
};
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
  
   addTask(
  title: string,
  priority: Priority,
  focus_minutes = 25,
  startTime?: string,
  endTime?: string
) {
  const t: Task = {
    id: uid(),
    title,
    priority,
    status: "todo",
    focus_minutes,
    created_at: new Date().toISOString(),
    completed_at: null,
    startTime,
    endTime,
  };

  store.set((s) => ({
    tasks: [...s.tasks, t],
  }));
  if (startTime && endTime) {
  const today = new Date();

  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);

  const start = new Date(today);
  start.setHours(sh, sm, 0, 0);

  const end = new Date(today);
  end.setHours(eh, em, 0, 0);

  store.set((s) => ({
    events: [
      ...s.events,
      {
        id: uid(),
        title,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        priority,
      },
    ],
  }));
}

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
      return {
  tasks,
  points: s.points + pointsBump,
  streak:
    pointsBump > 0
      ? s.streak + 1
      : s.streak,
};
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
