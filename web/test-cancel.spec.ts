import { test, expect } from '@playwright/test';

test('Cancel PENDING transaction', async ({ page }) => {
  await page.goto('https://tontineapp-web.vercel.app/login');
  await page.waitForLoadState('networkidle');

  // Try to login — use test account if exists
  await page.fill('input[type="email"]', 'test@kotizy.app');
  await page.fill('input[type="password"]', 'Test1234!');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(3000);
  console.log('URL after login:', page.url());
  await page.screenshot({ path: '/tmp/01-after-login.png', fullPage: true });

  await page.goto('https://tontineapp-web.vercel.app/wallet');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/02-wallet.png', fullPage: true });

  const cancelBtn = page.locator('button:has-text("Annuler")').first();
  const visible = await cancelBtn.isVisible().catch(() => false);
  console.log('Annuler button visible:', visible);

  if (visible) {
    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/cancel'), { timeout: 6000 }).catch(() => null),
      cancelBtn.click(),
    ]);
    console.log('API response status:', response?.status());
    const body = await response?.text().catch(() => '');
    console.log('API response body:', body);

    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/03-after-cancel.png', fullPage: true });
    const remaining = await page.locator('button:has-text("Annuler")').count();
    console.log('Annuler buttons remaining:', remaining);
  }
});
