import { chromium } from 'playwright';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

const base = 'http://127.0.0.1:8765';
const root = join(process.cwd(), 'RedVital_Evidencia_Visual');
const shots = [
  ['01_landing', '/', 'full'],
  ['02_como_funciona', '/index.html#como-funciona', 'viewport'],
  ['03_login', '/login.html', 'full'],
  ['04_registro', '/registro.html', 'full'],
  ['05_donante_dashboard', '/panel.html', 'full', 'demo_donor'],
  ['06_donante_perfil', '/perfil.html', 'full', 'demo_donor'],
  ['07_donante_solicitudes', '/solicitudes.html', 'full', 'demo_donor'],
  ['08_detalle_solicitud', '/detalle-solicitud.html?id=req_demo_1', 'full', 'demo_donor'],
  ['09_paciente_dashboard', '/panel.html', 'full', 'demo_patient'],
  ['10_publicar_solicitud', '/nueva-solicitud.html', 'full', 'demo_patient'],
  ['11_mis_solicitudes', '/mis-solicitudes.html', 'full', 'demo_patient'],
  ['12_editar_solicitud', '/editar-solicitud.html?id=req_demo_1', 'full', 'demo_patient'],
  ['13_admin_dashboard', '/admin.html', 'full', 'demo_admin'],
];

async function seedSession(page, userId) {
  await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
  if (userId) await page.evaluate(id => localStorage.setItem('rv_session_v1', JSON.stringify({ userId: id, startedAt: new Date().toISOString() })), userId);
}

async function captureSet(label, viewport) {
  const dir = join(root, label);
  await mkdir(dir, { recursive: true });
  const context = await browser.newContext({ viewport });
  for (const [name, path, mode, userId] of shots) {
    const page = await context.newPage();
    await seedSession(page, userId);
    await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    if (path.includes('#como-funciona')) await page.locator('#como-funciona').scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(dir, `${name}.png`), fullPage: mode === 'full' });
    await page.close();
  }
  if (label === 'mobile') {
    const page = await context.newPage();
    await seedSession(page);
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await page.locator('.menu-btn').click();
    await page.screenshot({ path: join(dir, '14_menu_mobile_abierto.png'), fullPage: false });
    await page.close();
  }
  await context.close();
}

await rm(root, { recursive: true, force: true });
await mkdir(root, { recursive: true });
const browser = await chromium.launch({ headless: true });
await captureSet('desktop', { width: 1440, height: 900 });
await captureSet('mobile', { width: 390, height: 844 });
await browser.close();

const readme = `# RedVital - Evidencia Visual\n\nFecha: ${new Date().toISOString()}\nURL local: ${base}\n\n- Desktop: 1440 × 900\n- Mobile: 390 × 844\n- Capturas: 27 (13 desktop y 14 mobile)\n\n## Pantallas\n\n1. Landing\n2. Cómo funciona\n3. Inicio de sesión\n4. Registro\n5. Dashboard donante\n6. Perfil donante\n7. Solicitudes compatibles\n8. Detalle y contacto autorizado\n9. Dashboard paciente\n10. Publicar solicitud\n11. Mis solicitudes\n12. Editar solicitud\n13. Panel administrador\n14. Menú mobile abierto (solo mobile)\n\nNo se capturaron pantallas independientes de configuración o detalle de usuario porque no existen como rutas separadas en la aplicación actual.\n`;
await writeFile(join(root, 'README.md'), readme, 'utf8');
