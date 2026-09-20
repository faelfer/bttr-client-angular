import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer, request as createProxyRequest } from 'node:http';
import { extname, resolve, sep } from 'node:path';

const port = Number(process.env.PORT ?? 4200);
const root = resolve(process.cwd(), 'dist/bttr/browser');
const api = new URL(process.env.BTTR_MOCK_API_URL ?? 'http://mock-api:8080');

const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "base-uri 'self'",
    "connect-src 'self'",
    "font-src 'self' data:",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data:",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
  ].join('; '),
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

function proxy(request, response) {
  const incoming = new URL(request.url ?? '/', 'http://web');
  const target = new URL(incoming.pathname.slice('/api'.length) + incoming.search, api);
  const headers = { ...request.headers, host: target.host };
  delete headers.connection;

  const upstream = createProxyRequest(
    target,
    { method: request.method, headers },
    (upstreamResponse) => {
      const upstreamHeaders = { ...upstreamResponse.headers };
      for (const name of Object.keys(upstreamHeaders)) {
        if (name.startsWith('access-control-')) delete upstreamHeaders[name];
      }
      response.writeHead(upstreamResponse.statusCode ?? 502, {
        ...upstreamHeaders,
        ...securityHeaders,
      });
      upstreamResponse.pipe(response);
    },
  );
  upstream.on('error', (error) => {
    response.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8', ...securityHeaders });
    response.end(`Mock API indisponível: ${error.message}`);
  });
  request.pipe(upstream);
}

async function serve(request, response) {
  if ((request.url ?? '').startsWith('/api/')) {
    proxy(request, response);
    return;
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD', ...securityHeaders });
    response.end();
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://web').pathname);
  } catch {
    response.writeHead(400, securityHeaders);
    response.end();
    return;
  }

  let file = resolve(root, `.${pathname}`);
  if (file !== root && !file.startsWith(`${root}${sep}`)) {
    response.writeHead(403, securityHeaders);
    response.end();
    return;
  }

  try {
    const metadata = await stat(file);
    if (metadata.isDirectory()) file = resolve(file, 'index.html');
    await stat(file);
  } catch {
    file = resolve(root, 'index.html');
  }

  const isRuntimeConfig = file.endsWith(`${sep}config.json`) || file.endsWith(`${sep}index.html`);
  response.writeHead(200, {
    'Cache-Control': isRuntimeConfig ? 'no-store' : 'public, max-age=31536000, immutable',
    'Content-Type': contentTypes.get(extname(file)) ?? 'application/octet-stream',
    ...securityHeaders,
  });
  if (request.method === 'HEAD') {
    response.end();
  } else {
    createReadStream(file).pipe(response);
  }
}

createServer((request, response) => {
  void serve(request, response).catch((error) => {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8', ...securityHeaders });
    response.end(`Falha ao servir o frontend: ${error.message}`);
  });
}).listen(port, '0.0.0.0', () => {
  console.log(`Frontend de segurança disponível na porta ${String(port)}.`);
});
