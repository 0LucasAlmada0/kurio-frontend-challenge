import './styles.css'

async function bootstrap() {
  const mocksEnabled = import.meta.env.VITE_ENABLE_MOCKS === 'true'
    || (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS !== 'false')
  if (mocksEnabled) {
    const { worker } = await import('@/mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass', serviceWorker: { url: '/mockServiceWorker.js' } })
  }
  const { mountApp } = await import('@/app/bootstrap')
  mountApp()
}

void bootstrap().catch(() => {
  document.getElementById('root')!.textContent = 'Não foi possível iniciar o Kurio. Verifique o service worker e recarregue a página.'
})
