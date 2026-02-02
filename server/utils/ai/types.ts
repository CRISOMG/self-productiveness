// server/utils/ai/types.ts

export interface AIConfig {
  userId: string;
  isPro: boolean;
  systemPrompt?: string;
}

export interface DriveConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  userFolderId?: string;
}

// Task from Supabase
export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  done: boolean;
  archived: boolean;
  tag_id?: number | null;
  pomodoro_id?: number | null;
  keep: boolean;
  created_at: string;
  updated_at: string;
  done_at?: string | null;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
}

export interface UpdateTaskInput {
  id: string;
  done?: boolean;
  archived?: boolean;
  title?: string;
  description?: string;
}

// Chat history (LangChain format stored in n8n_chat_histories)
export interface LangChainMessage {
  type: "human" | "ai" | "system";
  content: string;
  tool_calls?: any[];
  additional_kwargs?: Record<string, any>;
  response_metadata?: Record<string, any>;
  invalid_tool_calls?: any[];
}

export interface ChatHistoryRow {
  id: number;
  session_id: string;
  message: LangChainMessage;
}

// Google Drive file info
export interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}

// Transcription result
export interface TranscriptionResult {
  audio: DriveFileInfo;
  text: DriveFileInfo;
  message: string;
}
