import { test, expect } from "@playwright/test";
test("blinks close a shutter without compressing the eye artwork", async ({
  page,
}) => {
  await page.goto("/");
  for (const kind of ["pug", "bunny", "ginger-cat"]) {
    await page.evaluate(
      (kind) => localStorage.setItem("dayframe-mascot", JSON.stringify(kind)),
      kind,
    );
    await page.reload();
    const art = page.locator(".calendar-companion .mascot-art");
    const state = await art.locator("rect.mascot-eye-left").evaluate((el) => {
      const animation = el.getAnimations()[0];
      animation.pause();
      const timing = animation.effect!.getTiming();
      animation.currentTime =
        Number(timing.duration) * 0.469 + Number(timing.delay);
      return {
        shutter: new DOMMatrix(getComputedStyle(el).transform).d,
        distortedImages: [
          ...el.closest("svg")!.querySelectorAll("image"),
        ].filter((image) => getComputedStyle(image).transform !== "none")
          .length,
      };
    });
    expect(state.shutter).toBeCloseTo(0, 2);
    expect(state.distortedImages).toBe(0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(art.locator("rect.mascot-eye-left")).toHaveCSS(
      "animation-name",
      "none",
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
});
