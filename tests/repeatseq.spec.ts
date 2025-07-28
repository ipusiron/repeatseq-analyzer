import { test, expect } from '@playwright/test';

test('LXFOPVEFRNHR is detected and highlighted correctly', async ({ page }) => {
  // ツールのURLにアクセス（ポートに応じて調整）
  await page.goto('http://localhost:5500/index.html');

  // 入力
  await page.fill('#ciphertext', 'LXFOPVEFRNHRXYZLXFOPVEFRNHRYUL');

  // 解析ボタンを押す
  await page.click('#analyze-btn');

  // ハイライト結果に "LXFOPVEFRNHR" が含まれているか確認
  const highlight = page.locator('#highlighted-text');
  await expect(highlight).toBeVisible();
  await expect(highlight).toContainText('LXFOPVEFRNHR');

  // 結果一覧に "LXFOPVEFRNHR" の行が存在するか確認
  const matchRow = page.locator('#result-table tbody tr', {
    hasText: 'LXFOPVEFRNHR'
  });
  await expect(matchRow).toHaveCount(1);
});
