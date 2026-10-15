/// <reference types="@vitest/browser/providers/playwright" />
/**
 * AUTM-1883 (Don, 2026-10-15), in a real browser: a toast's words wrap to two
 * lines at most. They were one truncated line, so at 390 "Reminder sent to
 * Priya by text and email. Next one possible at 15:35" showed only up to
 * "email…", and the half that said when to try again was lost. Line boxes are
 * layout, which jsdom does not do.
 */
import "../../.storybook/storybook.css";
import { act } from "react";
import { cleanup, render } from "@testing-library/react";
import { page } from "@vitest/browser/context";
import { afterEach, describe, expect, it } from "vitest";
import { ToastProvider, toast } from "./Toast";

const REMINDER = "Reminder sent to Priya by text and email. Next one possible at 15:35.";
const TOO_LONG =
    "This sentence is written far too long for a toast on purpose, so it runs on past the second line, and on, and on again, which a toast must never do, so the capsule clamps it rather than growing into a paragraph over the page.";

afterEach(cleanup);

async function show(fire: () => void): Promise<HTMLElement> {
    render(<ToastProvider position="top-center">{null}</ToastProvider>);
    await act(async () => {});
    await act(async () => {
        fire();
    });
    const el = document.querySelector<HTMLElement>("[data-toast-message]");
    if (!el) throw new Error("no toast");
    return el;
}

function lines(el: HTMLElement) {
    const lh = parseFloat(getComputedStyle(el).lineHeight);
    return { shown: Math.round(el.clientHeight / lh), needed: Math.round(el.scrollHeight / lh) };
}

// Line counts depend on the font, and autara-ui ships none (licence), so CI's
// fallback is wider than a Mac's. These assert what holds in any font: words
// wrap instead of running off sideways, every line that is needed shows up to
// two, and a third is clamped. That the reminder fits two lines in Satoshi at
// 375 is proven where Satoshi is loaded, in the portal's own spec.
describe("Toast wraps to two lines at most (AUTM-1883)", () => {
    // 375 and 390 have 20em of text or more across: two lines at most. 320 has
    // 18em (288px inside the viewport's padding): every word, like large text.
    for (const width of [320, 375, 390]) {
        it(`at ${width}: the reminder wraps instead of truncating, and shows every line it may`, async () => {
            await page.viewport(width, 800);
            const el = await show(() => toast.success(REMINDER));
            const { shown, needed } = lines(el);
            // It needs more than one line here, so one truncated line would lose words.
            expect(needed).toBeGreaterThanOrEqual(2);
            expect(shown).toBe(width < 340 ? needed : Math.min(needed, 2));
            // Nothing is cut sideways.
            expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
            // The capsule stays inside the screen.
            const box = el.closest('[role="status"]')!.getBoundingClientRect();
            expect(box.left).toBeGreaterThanOrEqual(0);
            expect(box.right).toBeLessThanOrEqual(width);
        });
    }

    it("at 1280: a short toast is one line, as before", async () => {
        await page.viewport(1280, 800);
        const el = await show(() => toast.success("Link copied"));
        expect(lines(el)).toEqual({ shown: 1, needed: 1 });
    });

    it("at 390: a toast too long for two lines is clamped at two, not grown", async () => {
        await page.viewport(390, 800);
        const el = await show(() => toast.info(TOO_LONG));
        const { shown, needed } = lines(el);
        expect(shown).toBe(2);
        expect(needed).toBeGreaterThan(2);
    });

    it("at 390 with 200% text: the reminder keeps every word rather than clamping (WCAG 1.4.4)", async () => {
        await page.viewport(390, 800);
        document.documentElement.style.fontSize = "32px";
        try {
            const el = await show(() => toast.success(REMINDER));
            const { shown, needed } = lines(el);
            expect(needed).toBeGreaterThan(2);
            expect(shown).toBe(needed);
            expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
        } finally {
            document.documentElement.style.fontSize = "";
        }
    });

    it("a corner toast still sits in its corner", async () => {
        await page.viewport(1280, 800);
        render(<ToastProvider position="bottom-right">{null}</ToastProvider>);
        await act(async () => {});
        await act(async () => {
            toast.success("Link copied");
        });
        const capsule = document.querySelector('[role="status"]')!.getBoundingClientRect();
        expect(1280 - capsule.right).toBeLessThanOrEqual(17);
        expect(800 - capsule.bottom).toBeLessThanOrEqual(17);
    });

    it("at 390: an action and the dismiss stay inside the capsule beside two lines of words", async () => {
        await page.viewport(390, 800);
        const el = await show(() =>
            toast({
                type: "success",
                description: "INV-2026-0102 is ready. Your browser blocked the download.",
                duration: 0,
                action: { label: "Open PDF", onClick: () => undefined },
            }),
        );
        const capsule = el.closest('[role="status"]')!.getBoundingClientRect();
        const action = document.querySelector("button")!.getBoundingClientRect();
        const dismiss = document.querySelector<HTMLElement>('[aria-label="Dismiss notification"]')!.getBoundingClientRect();
        expect(lines(el).shown).toBeLessThanOrEqual(2);
        expect(action.right).toBeLessThanOrEqual(capsule.right);
        expect(dismiss.right).toBeLessThanOrEqual(capsule.right);
    });
});
