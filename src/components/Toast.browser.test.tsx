/// <reference types="@vitest/browser/providers/playwright" />
/**
 * In a real browser, because line boxes, placement and pointer drags are
 * layout and events jsdom does not do.
 *
 * AUTM-1883 (Don, 2026-10-15): a toast's words wrap to two lines at most. They
 * were one truncated line, so at 390 "Reminder sent to Priya by text and
 * email. Next one possible at 15:35" showed only up to "email…".
 * AUTM-1871 (Don, 2026-10-14): bottom right on a desktop, top on a phone;
 * the large round Close; swipe to dismiss.
 */
import "../../.storybook/storybook.css";
import { act } from "react";
import { cleanup, render } from "@testing-library/react";
import { page } from "@vitest/browser/context";
import { afterEach, describe, expect, it } from "vitest";
import { ToastProvider, toast, type ToastPosition } from "./Toast";

const REMINDER = "Reminder sent to Priya by text and email. Next one possible at 15:35.";
const TOO_LONG =
    "This sentence is written far too long for a toast on purpose, so it runs on past the second line, and on, and on again, which a toast must never do, so the capsule clamps it rather than growing into a paragraph over the page.";

afterEach(cleanup);

async function show(fire: () => void, position: ToastPosition = "top-center"): Promise<HTMLElement> {
    render(<ToastProvider position={position}>{null}</ToastProvider>);
    await act(async () => {});
    await act(async () => {
        fire();
    });
    // Let the enter transition settle so boxes are measured where they rest.
    await new Promise((r) => setTimeout(r, 250));
    const el = document.querySelector<HTMLElement>("[data-toast-message]");
    if (!el) throw new Error("no toast");
    return el;
}

function lines(el: HTMLElement) {
    const lh = parseFloat(getComputedStyle(el).lineHeight);
    const pad = parseFloat(getComputedStyle(el).paddingTop) + parseFloat(getComputedStyle(el).paddingBottom);
    return { shown: Math.round((el.clientHeight - pad) / lh), needed: Math.round((el.scrollHeight - pad) / lh) };
}

const capsuleOf = (el: Element) => el.closest<HTMLElement>("[data-toast]")!;

// Line counts depend on the font, and autara-ui ships none (licence), so CI's
// fallback is wider than a Mac's. These assert what holds in any font: words
// wrap instead of running off sideways, every line that is needed shows up to
// two, and a third is clamped.
describe("Toast wraps to two lines at most (AUTM-1883)", () => {
    // 375 and 390 have 20em of text or more across: two lines at most. 320 has
    // under 20em inside the viewport's padding: every word, like large text.
    for (const width of [320, 375, 390]) {
        it(`at ${width}: the reminder wraps instead of truncating, and shows every line it may`, async () => {
            await page.viewport(width, 800);
            const el = await show(() => toast.success(REMINDER));
            const { shown, needed } = lines(el);
            expect(needed).toBeGreaterThanOrEqual(2);
            expect(shown).toBe(width < 340 ? needed : Math.min(needed, 2));
            expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
            const box = capsuleOf(el).getBoundingClientRect();
            expect(box.left).toBeGreaterThanOrEqual(0);
            expect(box.right).toBeLessThanOrEqual(width);
        });
    }

    it("at 1280: a short toast is one line", async () => {
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

    it("at 390: an action and the Close stay inside the capsule beside two lines of words", async () => {
        await page.viewport(390, 800);
        const el = await show(() =>
            toast({
                type: "success",
                description: "INV-2026-0102 is ready. Your browser blocked the download.",
                duration: 0,
                action: { label: "Open PDF", onClick: () => undefined },
            }),
        );
        const capsule = capsuleOf(el).getBoundingClientRect();
        const action = document.querySelector("[data-toast-action]")!.getBoundingClientRect();
        const close = document.querySelector<HTMLElement>('[aria-label="Dismiss notification"]')!.getBoundingClientRect();
        expect(lines(el).shown).toBeLessThanOrEqual(2);
        expect(action.right).toBeLessThanOrEqual(capsule.right);
        expect(close.right).toBeLessThanOrEqual(capsule.right);
    });
});

describe("Toast placement and controls (AUTM-1871)", () => {
    it("auto at 1280: the stack sits bottom right", async () => {
        await page.viewport(1280, 800);
        const el = await show(() => toast.success("Link copied"), "auto");
        const box = capsuleOf(el).getBoundingClientRect();
        expect(1280 - box.right).toBeLessThanOrEqual(17);
        expect(800 - box.bottom).toBeLessThanOrEqual(17);
    });

    it("auto at 390: the stack sits at the top, the width of the screen less its margins", async () => {
        await page.viewport(390, 800);
        const el = await show(() => toast.success("Link copied"), "auto");
        const box = capsuleOf(el).getBoundingClientRect();
        expect(box.top).toBeLessThanOrEqual(16);
        expect(box.left).toBeLessThanOrEqual(13);
        expect(390 - box.right).toBeLessThanOrEqual(13);
    });

    it("a fixed corner still sits in its corner", async () => {
        await page.viewport(1280, 800);
        const el = await show(() => toast.success("Link copied"), "bottom-right");
        const box = capsuleOf(el).getBoundingClientRect();
        expect(1280 - box.right).toBeLessThanOrEqual(17);
        expect(800 - box.bottom).toBeLessThanOrEqual(17);
    });

    it("the Close is at least 44px to the pointer", async () => {
        await page.viewport(1280, 800);
        await show(() => toast.success("Link copied"));
        const close = document.querySelector<HTMLElement>('[aria-label="Dismiss notification"]')!.getBoundingClientRect();
        expect(close.width).toBeGreaterThanOrEqual(44);
        expect(close.height).toBeGreaterThanOrEqual(44);
    });

    it("three at once stack without overlapping", async () => {
        await page.viewport(1280, 800);
        await show(() => {
            toast.success("One");
            toast.info("Two");
            toast.error("Three");
        }, "auto");
        const boxes = Array.from(document.querySelectorAll("[data-toast]")).map((c) => c.getBoundingClientRect());
        expect(boxes).toHaveLength(3);
        for (let i = 1; i < boxes.length; i++) {
            expect(boxes[i].top).toBeGreaterThanOrEqual(boxes[i - 1].bottom - 0.5);
        }
    });

    function drag(el: HTMLElement, dx: number, dy: number) {
        const r = el.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        const opts = { bubbles: true, pointerId: 7, pointerType: "touch", isPrimary: true, button: 0 } as const;
        el.dispatchEvent(new PointerEvent("pointerdown", { ...opts, clientX: x, clientY: y }));
        for (let i = 1; i <= 6; i++) {
            el.dispatchEvent(new PointerEvent("pointermove", { ...opts, clientX: x + (dx * i) / 6, clientY: y + (dy * i) / 6 }));
        }
        el.dispatchEvent(new PointerEvent("pointerup", { ...opts, clientX: x + dx, clientY: y + dy }));
    }

    it("swipes away sideways", async () => {
        await page.viewport(390, 800);
        const el = await show(() => toast.success({ description: "Link copied", duration: 0 }));
        drag(capsuleOf(el), 140, 0);
        await new Promise((r) => setTimeout(r, 300));
        expect(document.querySelectorAll("[data-toast]")).toHaveLength(0);
    });

    it("a short drag springs back and keeps the toast", async () => {
        await page.viewport(390, 800);
        const el = await show(() => toast.success({ description: "Link copied", duration: 0 }));
        const capsule = capsuleOf(el);
        // Slow and short: under the distance and the speed that dismiss.
        const r = capsule.getBoundingClientRect();
        const opts = { bubbles: true, pointerId: 8, pointerType: "touch", isPrimary: true, button: 0 } as const;
        capsule.dispatchEvent(new PointerEvent("pointerdown", { ...opts, clientX: r.left + 40, clientY: r.top + 10 }));
        await new Promise((res) => setTimeout(res, 150));
        capsule.dispatchEvent(new PointerEvent("pointermove", { ...opts, clientX: r.left + 70, clientY: r.top + 10 }));
        await new Promise((res) => setTimeout(res, 150));
        capsule.dispatchEvent(new PointerEvent("pointerup", { ...opts, clientX: r.left + 70, clientY: r.top + 10 }));
        await new Promise((res) => setTimeout(res, 300));
        expect(document.querySelectorAll("[data-toast]")).toHaveLength(1);
    });

    it("at the top, swiping up dismisses it", async () => {
        await page.viewport(390, 800);
        const el = await show(() => toast.success({ description: "Link copied", duration: 0 }), "auto");
        drag(capsuleOf(el), 0, -120);
        await new Promise((r) => setTimeout(r, 300));
        expect(document.querySelectorAll("[data-toast]")).toHaveLength(0);
    });
});
