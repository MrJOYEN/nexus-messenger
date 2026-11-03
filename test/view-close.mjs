// Test d'une page qui ferme sa propre vue, via CDP.
//
// window.close() detruit le webContents d'une WebContentsView, et Chromium
// l'accepte des que l'historique ne compte qu'une entree : c'est le cas apres
// la redirection d'une session Google expiree vers sa page de connexion.
// Avant le rattrapage, l'entree restait dans `views` avec une vue morte, le
// clic suivant sur le service levait "Cannot read properties of undefined
// (reading 'focus')" et la sidebar ne suivait plus.
//
// Le test sert lui-meme deux pages locales, en fait deux services, puis ferme
// la vue de l'un pendant qu'il est affiche et celle de l'autre pendant qu'il
// est en arriere-plan.
//
// Prerequis : instance lancee avec --remote-debugging-port et profil vierge
// (le test passe par l'onboarding).
//   npm run dev -- --remote-debugging-port=9228 --user-data-dir=<dossier vide>
//   node test/view-close.mjs 9228
import http from 'node:http';

const PORT = process.argv[2] || '9228';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function check(label, ok, detail = '') {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}${detail ? ` (${detail})` : ''}`);
  if (!ok) failures++;
}

// --- Pages servies ------------------------------------------------------------

const server = http.createServer((req, res) => {
  const name = (req.url || '/').replace(/\W/g, '') || 'root';
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html><title>${name}</title><h1>${name}</h1>`);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const SRV = server.address().port;

// --- CDP ------------------------------------------------------------------------

async function targets() {
  return (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
}

async function connect(target) {
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let msgId = 0;
  const pending = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  };
  const send = (method, params = {}) => new Promise((resolve) => {
    const id = ++msgId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
  // Une page qui se ferme ne repond jamais a son dernier evaluate : on borne.
  const evalJs = async (expression) => {
    const r = await Promise.race([
      send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }),
      sleep(5000).then(() => ({ timeout: true })),
    ]);
    if (r.timeout) return { __timeout: true };
    if (r.result?.exceptionDetails) return { __threw: r.result.exceptionDetails.text };
    return r.result?.result?.value;
  };
  return { send, evalJs };
}

async function waitFor(fn, ms = 10000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const value = await fn().catch(() => null);
    if (value) return value;
    await sleep(250);
  }
  return null;
}

const serviceTarget = (path) =>
  waitFor(async () => (await targets()).find((t) => t.type === 'page' && t.url.includes(`:${SRV}/${path}`)));

// --- Deux services ----------------------------------------------------------------

const sidebarTarget = await waitFor(
  async () => (await targets()).find((t) => t.type === 'page' && t.url.includes('index.html')),
  15000
);
if (!sidebarTarget) {
  console.error('FAIL page sidebar introuvable');
  process.exit(1);
}
const sidebar = await connect(sidebarTarget);
await sidebar.send('Runtime.enable');

const created = await sidebar.evalJs(`window.hub.completeOnboarding([
  { name: 'Alpha', url: 'http://127.0.0.1:${SRV}/alpha' },
  { name: 'Beta',  url: 'http://127.0.0.1:${SRV}/beta' },
])`);
check('onboarding', created?.ok && created.count === 2, JSON.stringify(created));

const alpha = await serviceTarget('alpha');
const beta = await serviceTarget('beta');
check('alpha et beta charges', Boolean(alpha && beta));
if (!alpha || !beta) process.exit(1);

const sidebarActive = () => sidebar.evalJs('activeId');
const statusOf = (id) => sidebar.evalJs(`items.get('${id}').status`);
const follows = (id) => waitFor(async () => (await sidebarActive()) === id, 4000);

// --- 1. Le service affiche ferme sa vue : il se recharge sur place ----------------

const alphaPage = await connect(alpha);
check('historique a une entree, window.close() autorise', (await alphaPage.evalJs('history.length')) === 1);
alphaPage.evalJs('window.close()');
await sleep(1500);

const rebuilt = await serviceTarget('alpha');
check('alpha reconstruit', Boolean(rebuilt && rebuilt.id !== alpha.id));

// L'aller-retour par la sidebar est exactement le chemin qui levait l'exception.
await sidebar.evalJs(`window.hub.select('beta')`);
check('la sidebar suit vers beta', Boolean(await follows('beta')));
await sidebar.evalJs(`window.hub.select('alpha')`);
check('la sidebar suit vers alpha', Boolean(await follows('alpha')));
check('alpha pret', (await statusOf('alpha')) === 'ready');

// --- 2. Un service en arriere-plan ferme sa vue : il s'endort ----------------------

const betaPage = await connect(beta);
betaPage.evalJs('window.close()');
await sleep(1500);
check('beta en veille', (await statusOf('beta')) === 'hibernated', await statusOf('beta'));
check('plus de vue beta', !(await targets()).some((t) => t.url.includes(`:${SRV}/beta`)));

await sidebar.evalJs(`window.hub.select('beta')`);
check('la sidebar suit vers beta', Boolean(await follows('beta')));
check('beta se reveille au clic', Boolean(await serviceTarget('beta')));
check('beta pret', Boolean(await waitFor(async () => (await statusOf('beta')) === 'ready', 6000)));

server.close();
console.log(failures ? `\n${failures} echec(s)` : '\nTOUT PASSE');
process.exit(failures ? 1 : 0);
