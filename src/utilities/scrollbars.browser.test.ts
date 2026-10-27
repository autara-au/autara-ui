/// <reference types="@vitest/browser/providers/playwright" />
/**
 * AUTM-1899, in a real Chromium with a mouse and visible scrollbars (the
 * `scrollbarLanes` command launches its own; see vitest.browser.config.ts):
 * nothing inside a page takes a scrollbar lane, whatever a consumer sets on
 * an ancestor (`scrollbar-color`) or on the scroller (`scrollbar-gutter`),
 * and it still scrolls by wheel and by keyboard; the page keeps its 12px
 * brand bar; forced colours bring the system bars back everywhere.
 * scrollbars.test.ts holds the rules as written; this holds what they do.
 */
import { commands } from "@vitest/browser/context";
import { describe, expect, it } from "vitest";

interface ScrollbarLanes {
    root: number;
    inner: Record<string, number>;
    width: Record<string, string>;
    system: number;
    wheel: number;
    key: number;
}

declare module "@vitest/browser/context" {
    interface BrowserCommands {
        scrollbarLanes: (forced: boolean) => Promise<ScrollbarLanes>;
    }
}

describe("scrollbars in Chromium (AUTM-1899)", () => {
    it("with a mouse: no lane inside the page, the brand bar on the page, and it still scrolls", async () => {
        const m = await commands.scrollbarLanes(false);
        expect(m.inner).toEqual({ list: 0, "under-scrollbar-color": 0, gutter: 0, textarea: 0 });
        expect(m.width).toEqual({ list: "none", "under-scrollbar-color": "none", gutter: "none", textarea: "none" });
        // The drawn brand bar takes its 12px lane on every platform, overlay or not.
        expect(m.root).toBe(12);
        expect(m.wheel).toBeGreaterThan(0);
        expect(m.key).toBeGreaterThan(0);
    });

    /* A system bar's lane is whatever the platform gives (0 where macOS
       overlays its bars, about 15 on Linux, which CI runs), so every scroller
       is held to the control's lane, and to `auto`. */
    it("under forced colours: the system bars, inside the page and on it", async () => {
        const m = await commands.scrollbarLanes(true);
        expect(m.width).toEqual({ list: "auto", "under-scrollbar-color": "auto", gutter: "auto", textarea: "auto" });
        expect(m.root).toBe(m.system);
        expect(m.inner.list).toBe(m.system);
        expect(m.inner.textarea).toBe(m.system);
        expect(m.inner["under-scrollbar-color"]).toBe(m.system);
    });
});
