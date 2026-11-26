import { Request, Response } from 'express';

class DraftEventsHub {
  private subscribers = new Map<number, Set<Response>>();

  public subscribe(leagueId: number, req: Request, res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    let room = this.subscribers.get(leagueId);
    if (!room) {
      room = new Set<Response>();
      this.subscribers.set(leagueId, room);
    }
    room.add(res);

    res.write(`event: connected\ndata: ${JSON.stringify({ leagueId, timestamp: Date.now() })}\n\n`);

    const heartbeat = setInterval(() => {
      try {
        res.write(`: ping\n\n`);
      } catch {
        clearInterval(heartbeat);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      const currentRoom = this.subscribers.get(leagueId);
      if (currentRoom) {
        currentRoom.delete(res);
        if (currentRoom.size === 0) {
          this.subscribers.delete(leagueId);
        }
      }
    });
  }

  public publish(leagueId: number, event: string, payload: Record<string, unknown>): void {
    const room = this.subscribers.get(leagueId);
    if (!room || room.size === 0) return;

    const frame = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const res of Array.from(room)) {
      try {
        res.write(frame);
      } catch {
        room.delete(res);
      }
    }
  }
}

export const draftEventsHub = new DraftEventsHub();
