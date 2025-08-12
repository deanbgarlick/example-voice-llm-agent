export interface SessionConfig {
  model: string;
  voice: string;
  modalities: string[];
  instructions: string;
  tool_choice: string;
  tools?: any[];
}

export interface SessionResponse {
  id: string;
  status: string;
  created_at: string;
  expires_at: string;
  [key: string]: any;
}

export interface SessionError {
  error: string;
}
