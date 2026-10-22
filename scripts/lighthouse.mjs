/* global document, innerHeight, getComputedStyle */
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { preview } from 'vite'
import { chromium } from '@playwright/test'

const require = createRequire(import.meta.url)
const lhRequire = createRequire(require.resolve('lighthouse/package.json'))
const { default: lighthouse } = await import(pathToFileURL(lhRequire.resolve('lighthouse')))
const { launch } = await import(pathToFileURL(lhRequire.resolve('chrome-launcher')))
const { default: puppeteerCore } = await import(pathToFileURL(lhRequire.resolve('puppeteer-core')))
const { default: desktopConfig } = await import(pathToFileURL(lhRequire.resolve('lighthouse/core/config/desktop-config.js')))
const { ci } = require('../lighthouserc.cjs')

async function writeReport() {
  const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
  const reports = []
  for (const phase of ['before', 'iteration-preload', 'iteration-layout', 'final']) {
    try { reports.push({ phase, ...JSON.parse(await readFile(path.join('.lighthouseci', phase, 'summary.json'), 'utf8')) }) }
    catch (error) { if (error.code !== 'ENOENT') throw error }
  }
  if (!reports.length) throw new Error('Nenhuma rodada concluída para resumir.')
  for (const report of reports) for (const row of report.medians) {
    const name = `${row.url.endsWith('/') ? 'home' : 'detail'}-${row.profile}-1`
    const lhr = JSON.parse(await readFile(path.join('.lighthouseci', report.phase, `${name}.json`), 'utf8'))
    const screenshot = lhr.fullPageScreenshot?.screenshot?.data
    if (screenshot?.startsWith('data:image/webp;base64,')) await writeFile(path.join('.lighthouseci', report.phase, `${name}-measured.webp`), Buffer.from(screenshot.split(',')[1], 'base64'))
  }
  const rows = reports.flatMap((report) => report.medians.map((row) => {
    const page = row.url.endsWith('/') ? 'home' : 'detail'
    const links = `<a href="${report.phase}/${page}-${row.profile}-1-measured.webp">Captura medida</a><br>` + [1, 2, 3].map((run) => { const name = `${page}-${row.profile}-${run}`; return `<a href="${report.phase}/${name}.html">HTML ${run}</a> / <a href="${report.phase}/${name}.json">JSON ${run}</a> / <a href="${report.phase}/${name}-evidence.json">evidência ${run}</a>` }).join('<br>')
    return `<tr><td>${report.phase}</td><td>${page}</td><td>${row.profile}</td>${Object.values(row.scores).map((score) => `<td>${score}</td>`).join('')}<td>${Math.round(row.metrics['largest-contentful-paint'])}</td><td>${row.metrics['cumulative-layout-shift'].toFixed(4)}</td><td>${Math.round(row.metrics['total-blocking-time'])}</td><td>${Object.values(row.targets).every(Boolean) ? 'Atingidas' : 'Pendentes'}</td><td>${links}</td></tr>`
  })).join('')
  const environment = reports.map((report) => `<h2>${report.phase}</h2><p><a href="${report.phase}/summary.json">Medianas JSON</a> · <a href="${report.phase}/runs.json">Todas as execuções e configurações</a></p><pre>${escape(JSON.stringify(report.environment, null, 2))}</pre>`).join('')
  await writeFile('.lighthouseci/index.html', `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kurio · Lighthouse</title><style>body{font:15px/1.5 system-ui;margin:24px;color:#202124}table{border-collapse:collapse;font-variant-numeric:tabular-nums}th,td{padding:12px;border:1px solid #ccc;text-align:left;vertical-align:top}th{background:#eee}pre{white-space:pre-wrap;overflow-wrap:anywhere}.scroll{overflow:auto}a{color:#174ea6}</style><h1>Kurio · Lighthouse</h1><p>Mediana independente de três medições por combinação. Metas: Performance ≥ 90; Accessibility ≥ 95; Best Practices ≥ 95; SEO ≥ 90. LCP/TBT em milissegundos; CLS sem unidade.</p><div class="scroll"><table><thead><tr><th>Rodada</th><th>Página</th><th>Perfil</th><th>Performance</th><th>Accessibility</th><th>Best Practices</th><th>SEO</th><th>LCP</th><th>CLS</th><th>TBT</th><th>Metas</th><th>Relatórios completos</th></tr></thead><tbody>${rows}</tbody></table></div><p>O perfil iteration-preload é uma medição intermediária preservada. O comparativo de entrega usa before/final. Cada execução verifica MSW/REST, imagens, fontes e evento Socket.IO fora da janela de medição. Localhost com throttling simulado: valores não representam a CDN Vercel nem segurança completa. Parte dos recursos que atravessam o MSW tem transferSize zero no CDP; a simulação Lantern pode subestimar bytes. Consulte a análise e limitações no README.</p>${environment}</html>`)
}

const phase = process.argv[2] || 'final'
if (phase === 'report') { await writeReport(); console.log('.lighthouseci/index.html'); process.exit(0) }
if (!/^[a-z0-9-]+$/.test(phase)) throw new Error('Use um nome de rodada com letras, números e hífens.')
const output = path.resolve('.lighthouseci', phase)
await mkdir(output, { recursive: true })
const html = await readFile('dist/index.html', 'utf8')
if (!html.includes('/assets/')) throw new Error('Execute npm run build:demo antes de auditar.')
const profiles = process.env.LH_PROFILE ? [process.env.LH_PROFILE] : ['desktop', 'mobile']
if (profiles.some((profile) => !['desktop', 'mobile'].includes(profile))) throw new Error('LH_PROFILE deve ser desktop ou mobile.')
const chromePath = process.env.CHROME_PATH || chromium.executablePath()
const environment = { node: process.version, lighthouse: lhRequire('lighthouse/package.json').version, lhci: require('@lhci/cli/package.json').version, playwright: require('@playwright/test/package.json').version, os: `${os.type()} ${os.release()} ${os.arch()}`, cpu: os.cpus()[0].model, cores: os.cpus().length, totalMemoryGiB: Math.round(os.totalmem() / 1024 ** 3), chromePath, profiles, runsPerCombination: ci.collect.numberOfRuns, conditions: 'Fresh Chromium profile per run; cold cache/storage; localhost HTTP Vite production preview; Lighthouse simulate throttling; normal MSW scenario; Socket.IO enabled. Post-run verification is outside the measurement.' }
const rows = []
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
const server = await preview({ preview: { host: '127.0.0.1', port: 4174, strictPort: true } })
try {
  for (const profile of profiles) for (const url of ci.collect.url) for (let run = 1; run <= ci.collect.numberOfRuns; run++) {
    const name = `${url.endsWith('/') ? 'home' : 'detail'}-${profile}-${run}`
    console.log(`Auditing ${name}`)
    const chrome = await launch({ chromePath, chromeFlags: ['--headless=new', '--no-first-run', '--no-default-browser-check'] })
    let browser, puppeteer
    try {
      puppeteer = await puppeteerCore.connect({ browserURL: `http://127.0.0.1:${chrome.port}` })
      const auditedPage = await puppeteer.newPage()
      const result = await lighthouse(url, { port: chrome.port, logLevel: 'error', output: ['html', 'json'], onlyCategories: ci.collect.settings.onlyCategories, disableStorageReset: false }, profile === 'desktop' ? desktopConfig : undefined, auditedPage)
      if (!result) throw new Error('Lighthouse não retornou um relatório.')
      await writeFile(path.join(output, `${name}.html`), result.report[0])
      await writeFile(path.join(output, `${name}.json`), result.report[1])
      if (result.lhr.runtimeError) throw new Error(JSON.stringify(result.lhr.runtimeError))
      browser = await chromium.connectOverCDP(`http://127.0.0.1:${chrome.port}`)
      const page = browser.contexts()[0].pages().find((page) => page.url().startsWith(url))
      if (!page) throw new Error('A página auditada não foi encontrada.')
      await page.getByTestId('socket-status').filter({ hasText: '● Ao vivo' }).waitFor()
      const apiPath = url.endsWith('/') ? '/api/nfts' : '/api/nfts/emerald-ape-042'
      const responsePromise = page.waitForResponse((response) => new URL(response.url()).pathname === apiPath)
      const data = await page.evaluate(async (apiPath) => (await fetch(apiPath)).json(), apiPath)
      const response = await responsePromise
      const evidence = await page.evaluate(async () => {
        await document.fonts.ready
        const images = [...document.querySelectorAll('main img')].filter((img) => { const rect = img.getBoundingClientRect(); return rect.width > 0 && rect.top < innerHeight && rect.bottom > 0 })
        return { serviceWorker: !!navigator.serviceWorker.controller, title: document.title, h1: document.querySelector('main h1')?.textContent, font: getComputedStyle(document.body).fontFamily, fontsReady: document.fonts.status, visibleImages: images.map((img) => ({ src: img.getAttribute('src'), loaded: img.complete && img.naturalWidth > 0 })), socket: document.querySelector('[data-testid="socket-status"]')?.textContent }
      })
      const nft = data.items ? data.items.find((item) => item.id === 'emerald-ape-042') : data
      if (!evidence.serviceWorker || !response.fromServiceWorker() || nft?.priceEth !== '1.19' || nft.version !== 1 || data.items && data.total !== 12 || !evidence.visibleImages.length || evidence.visibleImages.some((img) => !img.loaded)) throw new Error(`Conteúdo padrão inválido: ${JSON.stringify(evidence)}`)
      if (run === 1) await page.screenshot({ path: path.join(output, `${name}-loaded.png`), fullPage: true })
      await page.evaluate(() => fetch('/api/__mock/nfts/emerald-ape-042/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ priceEth: '1.2' }) }))
      await page.waitForFunction(() => Number(document.querySelector('[data-testid="live-event"]')?.getAttribute('data-received')) > 0)
      const scores = Object.fromEntries(Object.entries(result.lhr.categories).map(([key, category]) => [key, category.score * 100]))
      const metrics = Object.fromEntries(['largest-contentful-paint', 'cumulative-layout-shift', 'total-blocking-time'].map((id) => [id, result.lhr.audits[id].numericValue]))
      const row = { name, url, profile, run, scores, metrics, evidence: { ...evidence, restFromServiceWorker: response.fromServiceWorker(), fixtureVersion: nft.version, publicSocketEventVerified: true }, settings: result.lhr.configSettings, environment: result.lhr.environment, chromium: await browser.version(), warnings: result.lhr.runWarnings }
      rows.push(row)
      await writeFile(path.join(output, `${name}-evidence.json`), JSON.stringify(row, null, 2))
      console.log(`${name}: ${JSON.stringify(scores)} LCP=${Math.round(metrics['largest-contentful-paint'])}ms CLS=${metrics['cumulative-layout-shift']} TBT=${Math.round(metrics['total-blocking-time'])}ms`)
    } finally { if (browser) await browser.close(); if (puppeteer) await puppeteer.disconnect(); await chrome.kill() }
    await writeFile(path.join(output, 'runs.json'), JSON.stringify({ environment, rows }, null, 2))
  }
  const medians = []
  for (const profile of profiles) for (const url of ci.collect.url) {
    const group = rows.filter((row) => row.profile === profile && row.url === url)
    const scores = Object.fromEntries(Object.keys(group[0].scores).map((key) => [key, median(group.map((row) => row.scores[key]))]))
    const metrics = Object.fromEntries(Object.keys(group[0].metrics).map((key) => [key, median(group.map((row) => row.metrics[key]))]))
    const targets = Object.fromEntries(Object.entries(scores).map(([key, value]) => [key, value >= ci.assert.assertions[`categories:${key}`][1].minScore * 100]))
    medians.push({ profile, url, scores, metrics, targets })
  }
  await writeFile(path.join(output, 'summary.json'), JSON.stringify({ environment, medians }, null, 2))
  await writeReport()
  console.log(JSON.stringify(medians, null, 2))
} finally { await new Promise((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve())) }
