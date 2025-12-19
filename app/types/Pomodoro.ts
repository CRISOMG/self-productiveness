import type { Tables } from "~/types/database.types";

export type Pomodoro = Tables<"pomodoros">;
export type Tag = Tables<"tags">;

export type TimelineEvent = {
  at: string;
  type: "play" | "pause";
};

export type TPomodoro = Omit<Pomodoro, "toggle_timeline"> & {
  toggle_timeline: TimelineEvent[];
  tags?: Tag[];
};

export type PomodoroCycle = Tables<"pomodoros_cycles">;
export type PomodoroTagged = Tables<"pomodoros_tags">;
