import type { Database } from "~/types/database.types";

export type Pomodoro = Database["public"]["Tables"]["pomodoros"];
export type Tag = Database["public"]["Tables"]["tags"];

export type TPomodoro = Pomodoro["Row"] & {
  toggle_timeline: Array<{
    at: string;
    type: "play" | "pause";
  }>;
  tags?: Tag["Row"][];
};

export type PomodoroCycle = Database["public"]["Tables"]["pomodoros_cycles"];
export type PomodoroTagged = Database["public"]["Tables"]["pomodoros_tags"];
