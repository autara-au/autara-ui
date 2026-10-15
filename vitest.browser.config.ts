/// <reference types="@vitest/browser/providers/playwright" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import type { BrowserCommand } from "vitest/node";

/**
 * AUTM-1786: tests that need a real browser, because they test what the
 * browser hit-tests, which jsdom cannot do. `*.browser.test.tsx` only; the
 * jsdom suite in vitest.config.ts excludes them. Run with `pnpm test:browser`
 * (CI installs Chromium first).
 *
 * The stylesheet is Storybook's own (Tailwind, tokens, utilities), compiled
 * by the same Tailwind plugin, so a component renders here as it does in
 * Storybook.
 */

export interface PressOptions {
    /** Where in the element's box, 0 to 1 across. Default 0.5. */
    fx?: number;
    /** Where in the element's box, 0 to 1 down. Default 0.5. */
    fy?: number;
    /** How long the mouse button stays down. Default 120ms. */
    holdMs?: number;
    /** `touch` taps through the touchscreen instead of the mouse. */
    pointer?: "mouse" | "touch";
}

/**
 * Real input at a point: the mouse moves there, goes down, waits, comes up,
 * and the browser decides from its own hit test which element gets the
 * click. A Testing Library click cannot show this bug, because it dispatches
 * straight to the element it is given.
 */
const pressAt: BrowserCommand<[selector: string, options?: PressOptions]> = async (ctx, selector, options = {}) => {
    if (ctx.provider.name !== "playwright") throw new Error("pressAt needs the playwright provider");
    const { fx = 0.5, fy = 0.5, holdMs = 120, pointer = "mouse" } = options;
    const frame = await ctx.frame();
    const target = frame.locator(selector).first();
    await target.scrollIntoViewIfNeeded();
    const box = await target.boundingBox();
    if (!box) throw new Error(`pressAt: ${selector} is not rendered`);
    const x = box.x + box.width * fx;
    const y = box.y + box.height * fy;
    if (pointer === "touch") {
        await ctx.page.touchscreen.tap(x, y);
        return;
    }
    await ctx.page.mouse.move(x, y);
    await ctx.page.mouse.down();
    await ctx.page.waitForTimeout(holdMs);
    await ctx.page.mouse.up();
};

export interface DragOptions {
    /** Where in the element's box to press, 0 to 1 across. Default 0.5. */
    fx?: number;
    /** Mouse moves between press and release. Default 8. */
    steps?: number;
}

/**
 * AUTM-1756 follow-up: a real mouse drag. Presses on the element, moves `dx`
 * CSS px sideways in `steps`, releases; the browser decides what was clicked.
 */
const dragAcross: BrowserCommand<[selector: string, dx: number, options?: DragOptions]> = async (
    ctx,
    selector,
    dx,
    options = {},
) => {
    if (ctx.provider.name !== "playwright") throw new Error("dragAcross needs the playwright provider");
    const { fx = 0.5, steps = 8 } = options;
    const frame = await ctx.frame();
    const box = await frame.locator(selector).first().boundingBox();
    if (!box) throw new Error(`dragAcross: ${selector} is not rendered`);
    const x = box.x + box.width * fx;
    const y = box.y + box.height / 2;
    await ctx.page.mouse.move(x, y);
    await ctx.page.mouse.down();
    await ctx.page.mouse.move(x + dx, y, { steps });
    await ctx.page.mouse.up();
};

/** `prefers-reduced-motion` on or off for the page, as a user's setting would. */
const reducedMotion: BrowserCommand<[on: boolean]> = async (ctx, on) => {
    if (ctx.provider.name !== "playwright") throw new Error("reducedMotion needs the playwright provider");
    await ctx.page.emulateMedia({ reducedMotion: on ? "reduce" : "no-preference" });
};

export default defineConfig({
    plugins: [react(), tailwindcss()],
    test: {
        include: ["src/**/*.browser.test.{ts,tsx}"],
        browser: {
            enabled: true,
            provider: "playwright",
            headless: true,
            screenshotFailures: false,
            // hasTouch so a test can tap; the mouse still works.
            instances: [{ browser: "chromium", context: { hasTouch: true } }],
            commands: { pressAt, dragAcross, reducedMotion },
        },
    },
});
