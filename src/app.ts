import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import router from './app/routes';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import notFound from './app/middlewares/notFound';

const app: Application = express();

// Todo: add cors
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// application routes
app.use('/api/v1', router);

// ─── Health Check ─────────────────────────────────────────────────────────────
const test = (_req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Rentezzi API</title>
      <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0f1117;
          font-family: 'Segoe UI', system-ui, sans-serif;
          color: #e2e8f0;
        }

        .card {
          background: #1a1d27;
          border: 1px solid #2d3148;
          border-radius: 20px;
          padding: 48px 56px;
          text-align: center;
          max-width: 480px;
          width: 90%;
          box-shadow: 0 0 60px rgba(99, 102, 241, 0.08);
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.25);
          color: #22c55e;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: 100px;
          margin-bottom: 28px;
        }

        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          animation: pulse 1.8s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.75); }
        }

        h1 {
          font-size: 32px;
          font-weight: 700;
          color: #f8fafc;
          letter-spacing: -0.5px;
          margin-bottom: 10px;
        }

        h1 span {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 36px;
          line-height: 1.6;
        }

        .divider {
          height: 1px;
          background: #2d3148;
          margin-bottom: 28px;
        }

        .meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 32px;
        }

        .meta-item {
          background: #0f1117;
          border: 1px solid #2d3148;
          border-radius: 12px;
          padding: 14px;
          text-align: left;
        }

        .meta-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #475569;
          margin-bottom: 5px;
        }

        .meta-value {
          font-size: 13px;
          font-weight: 500;
          color: #94a3b8;
          font-family: 'Courier New', monospace;
        }

        .meta-value.green { color: #22c55e; }
        .meta-value.purple { color: #818cf8; }

        .routes {
          background: #0f1117;
          border: 1px solid #2d3148;
          border-radius: 12px;
          padding: 16px 20px;
          text-align: left;
        }

        .routes-title {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #475569;
          margin-bottom: 12px;
        }

        .route-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 5px 0;
        }

        .method {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.05em;
          padding: 2px 7px;
          border-radius: 5px;
          min-width: 38px;
          text-align: center;
        }

        .method.get  { background: rgba(34,197,94,0.12);  color: #22c55e; }
        .method.post { background: rgba(99,102,241,0.12); color: #818cf8; }
        .method.del  { background: rgba(239,68,68,0.12);  color: #f87171; }

        .route-path {
          font-size: 12px;
          color: #64748b;
          font-family: 'Courier New', monospace;
        }

        .footer {
          margin-top: 28px;
          font-size: 11px;
          color: #334155;
        }
      </style>
    </head>
    <body>
      <div class="card">

        <div class="badge">
          <span class="dot"></span>
          Server Online
        </div>

        <h1>Rentezzi <span>API</span></h1>
        <p class="subtitle">Smart Rent Management Backend<br/>Running and ready to accept requests.</p>

        <div class="divider"></div>

        <div class="meta">
          <div class="meta-item">
            <div class="meta-label">Environment</div>
            <div class="meta-value green">${process.env.NODE_ENV ?? 'development'}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Port</div>
            <div class="meta-value purple">${process.env.PORT ?? '5000'}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">API Version</div>
            <div class="meta-value purple">v1</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Uptime</div>
            <div class="meta-value green">${Math.floor(process.uptime())}s</div>
          </div>
        </div>

        <div class="routes">
          <div class="routes-title">Available Prefixes</div>
          <div class="route-row">
            <span class="method post">POST</span>
            <span class="route-path">/api/v1/auth</span>
          </div>
          <div class="route-row">
            <span class="method get">GET</span>
            <span class="route-path">/api/v1/properties</span>
          </div>
          <div class="route-row">
            <span class="method get">GET</span>
            <span class="route-path">/api/v1/receipts</span>
          </div>
        </div>

        <div class="footer">
          Rentezzi &copy; ${new Date().getFullYear()} &mdash; All rights reserved
        </div>

      </div>
    </body>
    </html>
  `);
};

app.get('/', test);

app.use(globalErrorHandler);
app.use(notFound);

export default app;
