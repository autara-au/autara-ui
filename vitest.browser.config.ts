/// <reference types="@vitest/browser/providers/playwright" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import type { BrowserCommand } from "vitest/node";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

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

export interface ScrollbarLanes {
    /** The page's bar: viewport width minus the root's client width. */
    root: number;
    /** Inner scrollers, by id: offsetWidth minus clientWidth (no borders). */
    inner: Record<string, number>;
    /** Their computed `scrollbar-width`, by id. */
    width: Record<string, string>;
    /**
     * A scroller that opts back into the system bar (`scrollbar-width: auto`):
     * what a system bar takes on this machine. 0 where the platform overlays
     * its bars (macOS by default), about 15 on Linux and Windows.
     */
    system: number;
    /** scrollTop after a wheel turn and after Page Down over the list. */
    wheel: number;
    key: number;
}

/**
 * AUTM-1899: the scrollbar lanes, measured in a Chromium of their own. The
 * suite's browser cannot show this: Playwright's headless shell starts with
 * `--hide-scrollbars` (every lane is 0), and its context has a touch pointer
 * (`pointer: fine` is false, so the rules never apply). So this launches one
 * without that flag, with a mouse, loads the tokens and utilities/scrollbars.css
 * as shipped, and measures. `forced` emulates forced colours.
 */
const scrollbarLanes: BrowserCommand<[forced: boolean]> = async (_ctx, forced) => {
    const read = (p: string) => readFileSync(join(dirname(fileURLToPath(import.meta.url)), "src", p), "utf8");
    const browser = await chromium.launch({ ignoreDefaultArgs: ["--hide-scrollbars"] });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
        await page.emulateMedia({ forcedColors: forced ? "active" : "none" });
        const tall = '<div style="height:40rem">x</div>';
        await page.setContent(`<!doctype html><html><head><style>
:root { --accent: #4e1bbd; --brand: #4e1bbd; --on-deep: #fff; }
${read("tokens/scrollbar.css")}
${read("utilities/scrollbars.css")}
body { margin: 0; }
.box { width: 15rem; height: 6rem; overflow: auto; border: 0; }
.tinted { scrollbar-color: red blue; }
.gutter { scrollbar-gutter: stable both-edges; }
.system { scrollbar-width: auto; }
textarea { width: 15rem; height: 4rem; border: 0; padding: 0; }
</style></head><body>
<div class="box" id="list" tabindex="0">${tall}</div>
<div class="tinted"><div class="box" id="under-scrollbar-color">${tall}</div></div>
<div class="box gutter" id="gutter"><div style="height:1rem">short</div></div>
<textarea id="textarea">${"line\n".repeat(30)}</textarea>
<div class="box system" id="system">${tall}</div>
<div style="height:300vh">page</div>
</body></html>`);
        const lanes = await page.evaluate(() => {
            const lane = (el: HTMLElement) => el.offsetWidth - el.clientWidth;
            const inner: Record<string, number> = {};
            const width: Record<string, string> = {};
            for (const id of ["list", "under-scrollbar-color", "gutter", "textarea"]) {
                const el = document.getElementById(id)!;
                inner[id] = lane(el);
                width[id] = getComputedStyle(el).scrollbarWidth;
            }
            return {
                root: window.innerWidth - document.documentElement.clientWidth,
                inner,
                width,
                system: lane(document.getElementById("system")!),
            };
        });
        const box = (await page.locator("#list").boundingBox())!;
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.wheel(0, 120);
        await page.waitForFunction(() => document.getElementById("list")!.scrollTop > 0, null, { timeout: 2000 }).catch(() => {});
        const wheel = await page.$eval("#list", (el) => el.scrollTop);
        await page.$eval("#list", (el) => {
            el.scrollTop = 0;
            (el as HTMLElement).focus();
        });
        await page.keyboard.press("PageDown");
        await page.waitForFunction(() => document.getElementById("list")!.scrollTop > 0, null, { timeout: 2000 }).catch(() => {});
        const key = await page.$eval("#list", (el) => el.scrollTop);
        return { ...lanes, wheel, key } satisfies ScrollbarLanes;
    } finally {
        await browser.close();
    }
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
            commands: { pressAt, dragAcross, reducedMotion, scrollbarLanes },
        },
    },
});
