import { Request, Response } from 'express';
import { SessionService } from '../services/session.service';
import { SessionConfig } from '../types/session.types';

export class SessionController {
  private sessionService: SessionService;

  constructor() {
    this.sessionService = new SessionService();
  }

  createSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const config: Partial<SessionConfig> = req.body;
      const sessionData = await this.sessionService.createSession(config);
      res.json(sessionData);
    } catch (error) {
      console.error('Error in session controller:', error);
      res.status(500).json({ error: 'Failed to fetch session data' });
    }
  };
}
