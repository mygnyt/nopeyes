import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

function apiDevPlugin() {
  return {
    name: 'api-dev-middleware',
    configureServer(server: any) {
      server.middlewares.use(async (req: IncomingMessage & { body?: any; query?: any }, res: ServerResponse & { status?: any; json?: any }, next: any) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const urlObj = new URL(req.url, 'http://localhost');
        const pathname = urlObj.pathname;

        // Collect body if POST
        let bodyData = '';
        if (req.method === 'POST') {
          for await (const chunk of req) {
            bodyData += chunk;
          }
        }

        let parsedBody: any = {};
        if (bodyData) {
          try {
            parsedBody = JSON.parse(bodyData);
          } catch {
            parsedBody = {};
          }
        }

        // Add Vercel-like helpers to res and req
        const vReq: any = req;
        vReq.query = Object.fromEntries(urlObj.searchParams.entries());
        vReq.body = parsedBody;

        const vRes: any = res;
        vRes.status = function (code: number) {
          res.statusCode = code;
          return vRes;
        };
        vRes.json = function (data: any) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return vRes;
        };

        try {
          if (pathname === '/api/today') {
            const { default: handler } = await server.ssrLoadModule('./api/today.ts');
            return await handler(vReq, vRes);
          } else if (pathname === '/api/vote') {
            const { default: handler } = await server.ssrLoadModule('./api/vote.ts');
            return await handler(vReq, vRes);
          } else if (pathname === '/api/seed') {
            const { default: handler } = await server.ssrLoadModule('./api/seed.ts');
            return await handler(vReq, vRes);
          }
        } catch (err: any) {
          console.error('Dev API middleware error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err?.message || 'Server error' }));
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiDevPlugin()],
  server: {
    port: 3000,
  },
});
