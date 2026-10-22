import type { Page } from '@playwright/test'

export async function openCheckoutReview(page: Page) {
  if ((page.viewportSize()?.width ?? 1440) > 600) return
  const panel = page.locator('.checkout-review')
  await panel.waitFor({ state: 'attached' })
  if (!await panel.evaluate((element: HTMLDetailsElement) => element.open)) await panel.locator(':scope > summary').click()
}
