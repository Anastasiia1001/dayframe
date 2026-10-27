import { test, expect } from "@playwright/test";
import { themes } from "../../src/appearance";
test("all saved themes get tactile frames textures motion and readable dark sheets", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Календар", exact: true })
    .click();
  await page.getByRole("button", { name: "День", exact: true }).click();
  for (const theme of themes) {
    await page
      .getByLabel("Оформлення планера", { exact: true })
      .selectOption(theme.id);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme.id);
    const finish = await page.locator(".schedule-sheet").evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        shadow: s.boxShadow,
        radius: parseInt(s.borderTopLeftRadius),
        border: parseInt(s.borderLeftWidth),
        texture: s.backgroundImage,
        alpha: Number(
          s.backgroundColor.match(/\/\s*([\d.]+)\s*\)/)?.[1] ??
            s.backgroundColor.match(/rgba\([^)]*,\s*([\d.]+)\)/)?.[1] ??
            1,
        ),
      };
    });
    expect(finish.alpha).toBeLessThan(0.75);
    expect(finish.alpha).toBeGreaterThan(0.4);
    expect(finish.shadow).not.toBe("none");
    expect(finish.radius).toBeGreaterThanOrEqual(18);
    expect(finish.border).toBeGreaterThanOrEqual(1);
    expect(finish.texture).toContain("gradient");
    const contrast = await page
      .locator(".sidebar nav button:not(.selected)")
      .first()
      .evaluate((el) => {
        const style = getComputedStyle(el),
          canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext("2d")!;
        const luminance = (color: string) => {
          ctx.clearRect(0, 0, 1, 1);
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, 1, 1);
          const rgb = [...ctx.getImageData(0, 0, 1, 1).data]
            .slice(0, 3)
            .map((v) => {
              const c = v / 255;
              return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
            });
          return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
        };
        const fg = luminance(style.color),
          bg = luminance(style.getPropertyValue("--bg"));
        return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
      });
    expect(contrast).toBeGreaterThanOrEqual(4.5);
    const decor = page.locator(
      ".planner-hero-art,.planner-decoration,.theme-mascot-vignette > svg",
    );
    await expect(decor).toBeVisible();
    expect(
      await decor.evaluate((el) => getComputedStyle(el).animationName),
    ).toBe("none");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator(".theme-mascot-vignette > svg")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
});

// These regression scenarios exercise the retained classic planner and dashboard.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("dayframe-classic-planner", "true");
    if (!localStorage.getItem("dayframe-calendar-view"))
      localStorage.setItem("dayframe-calendar-view", JSON.stringify("Day"));
  });
});
