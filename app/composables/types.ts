import type {
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from "~/types/database.types";

export type Pomodoro = Tables<"pomodoros">;
export type Tag = Tables<"tags">;
export type TagInsert = TablesInsert<"tags">;
export type TagUpdate = TablesUpdate<"tags">;

export type PomodoroInsert = TablesInsert<"pomodoros">;
export type PomodoroUpdate = TablesUpdate<"pomodoros">;
export type PomodoroType = Enums<"pomodoro-type">;
export type PomodoroState = Enums<"pomodoro-state">;
export type TimelineEvent = {
  at: string;
  type: "start" | "play" | "pause" | "finish";
};

export type TPomodoro = Omit<Pomodoro, "toggle_timeline"> & {
  toggle_timeline: TimelineEvent[];
  tags?: Tag[];
};

export type PomodoroCycle = TablesInsert<"pomodoros_cycles">;
export type PomodoroTagged = Tables<"pomodoros_tags">;
