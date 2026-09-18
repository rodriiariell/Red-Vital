const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

const project = __dirname;
const output = path.join(project, 'RedVital_Evidencia_Visual');
const host = '127.0.0.1';
const port = 8766;
const base = `http://${host}:${port}`;
const shots = [
  ['01_landing', '/index.html'],
  ['02_como_funciona', '/index.html#como-funciona'],
  ['03_login', '/login.html'],
  ['04_registro', '/registro.html'],
  ['05_dashboard_donante', '/panel.html', 'demo_donor'],
  ['06_perfil_donante', '/perfil.html', 'demo_donor'],
  ['07_solicitudes_donante', '/solicitudes.html', 'demo_donor'],
  ['08_detalle_solicitud', '/detalle-solicitud.html?id=req_demo_1', 'demo_donor'],
  ['09_dashboard_paciente', '/panel.html', 'demo_patient'],
  ['10_publicar_solicitud', '/nueva-solicitud.html', 'demo_patient'],
  ['11_mis_solicitudes', '/mis-solicitudes.html', 'demo_patient'],
  ['12_editar_solicitud', '/editar-solicitud.html?id=req_demo_1', 'demo_patient'],
  ['13_dashboard_admin', '/admin.html', 'demo_admin'],
];
const users = { demo_donor: 'usr_demo_donor', demo_patient: 'usr_demo_patient', demo_admin: 'usr_demo_admin' };
const mime = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2' };

function staticServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, base);
    const rel = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const file = path.resolve(project, `.${rel}`);
    if (!file.startsWith(project + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (err, content) => {
      if (err) return res.writeHead(404).end('Not found');
      res.writeHead(200, { 'content-type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream' });
      res.end(content);
    });
  });
}

async function settle(page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
}

async function session(page, kind) {
  await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
  await page.evaluate((id) => {
    localStorage.removeItem('rv_session_v1');
    if (id) localStorage.setItem('rv_session_v1', JSON.stringify({ userId: id, startedAt: new Date().toISOString() }));
  }, kind ? users[kind] : null);
}

async function captureSet(browser, label, viewport) {
  const dir = path.join(output, label);
  await fsp.mkdir(dir, { recursive: true });
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  for (const [name, route, user] of shots) {
    const page = await context.newPage();
    await session(page, user);
    await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
    await settle(page);
    if (route.includes('#como-funciona')) await page.locator('#como-funciona').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: true });
    await page.close();
  }
  const login = await context.newPage();
  await session(login);
  await login.goto(`${base}/login.html`, { waitUntil: 'networkidle' });
  await login.locator('#forgot-password').click();
  await login.locator('#recovery-dialog').waitFor({ state: 'visible' });
  await login.screenshot({ path: path.join(dir, '14_modal_recuperar_contrasena.png'), fullPage: true });
  await login.close();
  if (label === 'mobile') {
    const home = await context.newPage();
    await session(home);
    await home.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await home.locator('.menu-btn').click();
    await home.screenshot({ path: path.join(dir, '15_menu_mobile_abierto.png'), fullPage: false });
    await home.close();
  }
  await context.close();
}

(async () => {
  await fsp.rm(output, { recursive: true, force: true });
  const server = staticServer();
  await new Promise(resolve => server.listen(port, host, resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    await captureSet(browser, 'desktop', { width: 1440, height: 900 });
    await captureSet(browser, 'mobile', { width: 390, height: 844 });
    const desktop = (await fsp.readdir(path.join(output, 'desktop'))).filter(x => x.endsWith('.png'));
    const mobile = (await fsp.readdir(path.join(output, 'mobile'))).filter(x => x.endsWith('.png'));
    const readme = `# RedVital — Evidencia Visual\n\n- Fecha de captura: ${new Date().toISOString()}\n- URL local utilizada: ${base}\n- Viewport desktop: 1440 × 900\n- Viewport mobile: 390 × 844\n- Capturas: ${desktop.length + mobile.length} (${desktop.length} desktop y ${mobile.length} mobile)\n\n## Capturas\n\n${[...desktop.map(x => `- desktop/${x}`), ...mobile.map(x => `- mobile/${x}`)].join('\n')}\n\n## Pantallas no capturadas\n\nNo hay pantallas adicionales independientes detectadas. Los estados con credenciales usaron exclusivamente los tres usuarios demo documentados; las sesiones se crearon en un contexto aislado de navegador.\n`;
    await fsp.writeFile(path.join(output, 'README.md'), readme, 'utf8');
    console.log(JSON.stringify({ base, desktop: desktop.length, mobile: mobile.length, total: desktop.length + mobile.length }));
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(err => { console.error(err.stack || err); process.exitCode = 1; });
