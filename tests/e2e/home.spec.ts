import { test, expect } from '@playwright/test'

test('Home completa: ordem das seções, ações honestas e navegação responsiva', async ({ page }) => {
  await page.goto('/?q=Emerald')
  await expect(page.getByTestId('socket-status')).toHaveText('● Ao vivo')
  await expect(page.getByRole('article')).toHaveCount(3)
  const sections = ['#catalog', '.home-promotions', '.home-journal', '.home-information', '.home-footer', '.home-demo-tools']
  const positions = await page.locator(sections.join(',')).evaluateAll(elements => elements.map(element => ({ selector: element.className || element.id, top: element.getBoundingClientRect().top, bottom: element.getBoundingClientRect().bottom })))
  expect(positions).toHaveLength(sections.length)
  for (let index = 1; index < positions.length; index++) expect(positions[index]!.top).toBeGreaterThanOrEqual(positions[index - 1]!.bottom)
  await expect(page.locator('.home-promotions h2')).toHaveCount(2)
  await expect(page.locator('.home-journal-grid > li')).toHaveCount(4)
  await expect(page.getByRole('heading', { name: 'Diário da Cunhagem', exact: true })).toBeVisible()
  await expect(page.locator('.home-sections')).toHaveCSS('font-family', /Roboto Mono/)
  await expect(page.locator('body')).not.toHaveCSS('font-family', /Roboto Mono/)
  for (const button of await page.locator('.home-journal button').all()) {
    await expect(button).toBeDisabled()
    await expect(button).toHaveAccessibleDescription('Prévia editorial · Artigos indisponíveis nesta demonstração.')
  }
  const email = page.getByLabel('E-mail para novidades')
  await expect(email).toBeDisabled()
  await expect(email).toHaveAccessibleDescription('Inscrições indisponíveis nesta demonstração.')
  await expect(page.getByRole('button', { name: 'Enviar', exact: true })).toBeDisabled()
  for (const link of await page.locator('.home-promotions a').all()) {
    await link.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/q=Emerald.*#catalog$/)
    await expect(page.getByRole('article')).toHaveCount(3)
  }
  const initial = page.viewportSize()!
  const sizes = initial.width <= 600 ? [{ width: 414, height: 896 }, { width: 390, height: 844 }, { width: 390, height: 600 }] : [initial]
  for (const size of sizes) {
    await page.setViewportSize(size)
    await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur() })
    const footerLink = page.getByRole('link', { name: 'Ver seu carrinho', exact: true })
    await footerLink.focus()
    await expect(footerLink).toBeFocused()
    await expect.poll(() => footerLink.evaluate(element => {
      const nav = document.querySelector('.mobile-nav')!
      const limit = nav.getClientRects().length ? nav.getBoundingClientRect().top - 44 : innerHeight
      const rect = element.getBoundingClientRect()
      return rect.top >= 0 && rect.bottom <= limit
    })).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    for (const image of await page.locator('.home-sections img').all()) {
      await image.scrollIntoViewIfNeeded()
      await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0)).toBe(true)
    }
  }
  await page.getByTestId('nft-emerald-ape-042').getByRole('link').click()
  await expect(page).toHaveURL(/\/nfts\/emerald-ape-042/)
  await expect(page.locator('.home-sections, .home-footer')).toHaveCount(0)
  await expect(page.locator('.site-footer')).toBeVisible()
})
