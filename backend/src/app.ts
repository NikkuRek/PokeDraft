import { Server } from './server/server.js';

const server = new Server();

// Start local HTTP server if executed directly
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  server.listen();
}

export default server.getApp();
