import { expect, test } from "@playwright/test";

test("ストアの主要導線を表示する", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /いつものアジ鯖を/ }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "商品を選ぶ" })).toBeVisible();
  await page.waitForFunction(
    () => localStorage.getItem("azisaba-store:cart:v1") !== null,
  );
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: testInfo.outputPath("storefront.png"),
    fullPage: true,
  });
  await page.goto("/cart");
  await expect(
    page.getByRole("heading", { name: "カートは空です" }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("empty-cart.png"),
    fullPage: true,
  });
});
