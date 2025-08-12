import { SessionConfig, SessionResponse, SessionError } from '../types/session.types';

export class SessionService {
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.openai.com/v1/realtime/sessions';

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    this.apiKey = apiKey;
  }

  private getDefaultConfig(): SessionConfig {
    return {
      model: 'gpt-4o-realtime-preview-2024-12-17',
      voice: 'alloy',
      modalities: ['audio', 'text'],
      instructions:
        'Start conversation with the user by saying \'Hello, how can I help you today?\' Use the available tools when relevant. After executing a tool, you will need to respond (create a subsequent conversation item) to the user sharing the function result or error. If you do not respond with additional message with function result, user will not know you successfully executed the tool. Speak and respond in english.',
      tool_choice: 'auto',
      tools: [],
    };
  }

  async createSession(config: Partial<SessionConfig> = {}): Promise<SessionResponse> {
    try {
      const sessionConfig = {
        ...this.getDefaultConfig(),
        ...config,
      };

      console.log('Creating session with config:', JSON.stringify(sessionConfig, null, 2));
      console.log('Tools in session config:', sessionConfig.tools?.length || 0, 'tools');

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionConfig),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();
      console.log('Session data from OpenAI:', responseData);
      return responseData as SessionResponse;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }
}
