import { test, expect } from '@playwright/test';

test('ABCXYZABC → ABCが検出される', async ({ page }) => {
  await page.goto('http://localhost:5500/index.html');
  await page.fill('#ciphertext', 'ABCXYZABC');
  await page.click('#analyze-btn');

  const result = page.locator('#highlighted-text');
  await expect(result).toContainText('ABC');

  const matchRow = page.locator('#result-table tbody tr', {
    hasText: 'ABC'
  });
  await expect(matchRow).toHaveCount(1);
});

test('短すぎる暗号文はIC警告を表示する', async ({ page }) => {
  await page.goto('http://localhost:5500/index.html');
  await page.fill('#ciphertext', 'XYZ');
  await page.click('#analyze-btn');

  const analysis = page.locator('#cipher-type-result');
  await expect(analysis).toContainText('暗号文が短すぎます');
});
