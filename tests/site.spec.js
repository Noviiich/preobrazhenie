import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("price categories support keyboard selection and carry the service into SMS", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".service-row")).toHaveCount(4);
  await page.getByRole("tab", { name: "Стрижки" }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("tab", { name: "Окрашивание" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page
    .getByRole("button", {
      name: "Записаться: Сложное окрашивание",
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("#booking-service")).toHaveValue(
    "Сложное окрашивание",
  );
  await expect(page.locator("#booking-message")).toHaveValue(
    /сложное окрашивание/,
  );
  await page
    .locator("#booking-message")
    .fill("Здравствуйте! Хочу записаться в пятницу в 15:00.");
  const href = await page.locator("#sms-link").getAttribute("href");
  expect(href).toBe(
    "sms:+79102664823?body=" +
      encodeURIComponent("Здравствуйте! Хочу записаться в пятницу в 15:00."),
  );
  await expect(page.locator("#vk-message-link")).toHaveAttribute(
    "href",
    "https://vk.me/club242078993",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator("#booking-dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Записаться: Сложное окрашивание",
      exact: true,
    }),
  ).toBeFocused();
  expect(errors).toEqual([]);
});

test("an inspiration image opens a detail view and an actionable booking draft", async ({
  page,
}) => {
  await page.goto("/");
  const card = page.locator('[data-look="Каре с характером"]');
  await card.click();
  await expect(page.locator("#look-dialog")).toBeVisible();
  await expect(page.locator("#look-title")).toHaveText("Каре с характером");
  await page.getByRole("button", { name: "Хочу такой образ" }).click();
  await expect(page.locator("#look-dialog")).not.toBeVisible();
  await expect(page.locator("#booking-message")).toHaveValue(
    /каре с характером/,
  );
  await page.keyboard.press("Escape");
  await expect(card).toBeFocused();
  await expect(page.locator("body")).not.toHaveClass(/scroll-locked/);
});

test("clipboard copying is explicit and preserves the edited message", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.locator(".hero-cta").click();
  await page
    .locator("#booking-message")
    .fill("Хочу записаться на стрижку в субботу.");
  await page
    .getByRole("button", { name: "Скопировать текст для ВКонтакте" })
    .click();
  await expect(page.getByRole("status")).toContainText("Сообщение скопировано");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "Хочу записаться на стрижку в субботу.",
  );
});

for (const width of [320, 390, 768, 1440]) {
  test(`layout and local assets work at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const failures = [];
    page.on("response", (response) => {
      if (response.status() >= 400) failures.push(response.url());
    });
    await page.goto("/");
    await page.evaluate(async () => {
      await document.fonts.ready;
      document.querySelectorAll("img").forEach((image) => {
        image.loading = "eager";
      });
      await Promise.all(
        [...document.images].map((image) => image.decode().catch(() => {})),
      );
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .locator("main img")
        .evaluateAll((images) =>
          images.every((image) => image.naturalWidth > 0),
        ),
    ).toBe(true);
    expect(failures).toEqual([]);
    await page.locator("summary").first().click();
    await expect(page.locator("details").first()).toHaveAttribute("open", "");
    if (width < 760) {
      await page.locator(".mobile-book-bar").scrollIntoViewIfNeeded();
      await expect(page.locator(".mobile-book-bar")).toHaveClass(/is-visible/);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.getByRole("button", { name: "Открыть меню" }).click();
      await expect(page.locator("#mobile-menu")).toBeVisible();
      await page
        .locator("#mobile-menu")
        .getByRole("link", { name: "Контакты", exact: true })
        .click();
      await expect(page.locator("#mobile-menu")).not.toBeVisible();
    }
  });
}

test("iPhone SMS uses the Apple body separator", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5173/");
  await page.locator(".hero-cta").click();
  await expect(page.locator("#sms-link")).toHaveAttribute(
    "href",
    /^sms:\+79102664823&body=/,
  );
  await context.close();
});

test("main page and booking dialog meet automated WCAG AA checks", async ({
  page,
}) => {
  await page.goto("/");
  const pageResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(pageResults.violations).toEqual([]);
  await page.locator(".hero-cta").click();
  const dialogResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(dialogResults.violations).toEqual([]);
});
