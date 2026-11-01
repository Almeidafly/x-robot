import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixture');

export function startFixture(port = 0) {
  let hits = 0;
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname === '/limited') {
      hits++;
      if (hits % 2 === 1) { res.writeHead(429, { 'retry-after': '0' }); return res.end('slow down'); }
      res.writeHead(200, { 'content-type': 'text/html' });
      return res.end('<div id="result">ok</div>');
    }
    const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    if (!/^[a-z]+\.html$/.test(name)) { res.writeHead(404); return res.end(); }
    try {
      const body = await readFile(path.join(dir, name));
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(body);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise(r => server.listen(port, '127.0.0.1', () =>
    r({ server, url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(c => server.close(c)) })));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startFixture(Number(process.env.PORT || 8787)).then(f => console.log('fixture at', f.url));
}
