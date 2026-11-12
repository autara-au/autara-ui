/// <reference types="@vitest/browser/providers/playwright" />
/**
 * AUTM-1756 follow-up, in a real browser: a chip row has no scrollbar, a
 * chevron moves it a view at a time on the ease-out, a mouse drag moves it
 * without firing a chip's click, a finger is left to the browser, and Tab
 * brings a chip into view clear of the fade. jsdom lays nothing out, so none
 * of this can be measured there.
 */
import "../../.storybook/storybook.css";
import { cleanup, render, screen } from "@testing-library/react";
import { commands, page, userEvent } from "@vitest/browser/context";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChipRow } from "./ChipRow";
import { QuickReplies } from "./QuickReplies";

declare module "@vitest/browser/context" {
    interface BrowserCommands {
        dragAcross: (selector: string, dx: number, options?: { fx?: number; steps?: number }) => Promise<void>;
        reducedMotion: (on: boolean) => Promise<void>;
    }
}

const LABELS = ["On my way", "15 minutes away", "I've arrived", "Running a little late", "Finished, come and see", "Thanks for booking"];

/* This Chromium is a touch device (hasTouch: `any-pointer: fine` is false),
   so the chevron tests ask for `arrows="always"`; `auto` is measured on its
   own below. */
function Row({ onPick = () => {}, arrows = "always" }: { onPick?: (label: string) => void; arrows?: "auto" | "always" }) {
    return (
        <div style={{ width: 360, padding: 16 }}>
            <ChipRow label="Quick replies" nextLabel="Show more replies" arrows={arrows} className="gap-2" data-testid="row">
                {LABELS.map((l, i) => (
                    <button
                        key={l}
                        type="button"
                        data-testid={`chip-${i}`}
                        onClick={() => onPick(l)}
                        className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full bg-[var(--band)] px-4 text-[0.9375rem] font-medium"
                    >
                        {l}
                    </button>
                ))}
            </ChipRow>
        </div>
    );
}

const row = () => screen.getByTestId("row");
// By label, not by role: a chevron with nothing more that way is out of the
// accessibility tree (visibility: hidden), and the tests still read it.
const chevron = (name: string) => document.querySelector<HTMLElement>(`button[aria-label="${name}"]`)!;
const next = () => chevron("Show more replies");
const previous = () => chevron("Scroll left");
const shown = (b: HTMLElement) => {
    const slot = b.closest(".chip-row__arrow")!;
    return !slot.hasAttribute("data-hidden") && getComputedStyle(slot).display !== "none";
};

async function frames(n = 2) {
    for (let i = 0; i < n; i++) await new Promise((r) => requestAnimationFrame(() => r(null)));
}

/** Wait out a glide (450ms on the house ease-out) and the edge read after it. */
async function glided() {
    await new Promise((r) => setTimeout(r, 600));
    await frames();
}

/** The room the row keeps at each end: the fade's (`edge`) and the disc's (`solid`), in px. */
function ends() {
    const cs = getComputedStyle(row());
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return {
        edge: parseFloat(cs.scrollPaddingInlineStart),
        solid: parseFloat(cs.getPropertyValue("--chip-row-solid")) * rem,
    };
}

/**
 * A chip's box against the row's, less `room` at each end that has more past
 * it (an end the row has reached has no fade and no chevron to clear).
 */
function clearOf(chip: HTMLElement, room: number) {
    const r = row().getBoundingClientRect();
    const c = chip.getBoundingClientRect();
    const start = row().hasAttribute("data-fade-start") ? room : 0;
    const end = row().hasAttribute("data-fade-end") ? room : 0;
    return c.left >= r.left + start - 1 && c.right <= r.right - end + 1;
}

/** A chip's box against the row's, less the room kept for the fade. */
function clearOfFades(chip: HTMLElement) {
    return clearOf(chip, ends().edge);
}

/**
 * Where ChipRow promises a chip taken by the keyboard lands, by the room it
 * fits in: clear of both fades if it fits between them, else clear of both
 * chevrons, else its start clear of the start chevron. Chip widths follow the
 * device's font (CI's Linux fallback is wider than macOS's), so the promise
 * is checked against the chip's measured width, never a fixed one.
 */
function expectRevealed(chip: HTMLElement) {
    const view = row().clientWidth;
    const { edge, solid } = ends();
    const width = chip.getBoundingClientRect().width;
    if (width <= view - 2 * edge) expect(clearOf(chip, edge), "clear of the fades").toBe(true);
    else if (width <= view - 2 * solid) expect(clearOf(chip, solid), "clear of the chevrons").toBe(true);
    else
        expect(chip.getBoundingClientRect().left, "its start clear of the start chevron").toBeGreaterThanOrEqual(
            row().getBoundingClientRect().left + (row().hasAttribute("data-fade-start") ? solid : 0) - 1,
        );
}

/** Nowhere is a chip under a chevron that is showing, unless it is wider than the room between them. */
function expectNotUnderAChevron(chip: HTMLElement) {
    const c = chip.getBoundingClientRect();
    if (c.width > row().clientWidth - 2 * ends().solid) return;
    for (const b of [next(), previous()]) {
        if (!shown(b)) continue;
        const a = b.getBoundingClientRect();
        expect(c.right <= a.left + 1 || c.left >= a.right - 1, "not under a chevron").toBe(true);
    }
}

describe("ChipRow in a browser (AUTM-1756 follow-up)", () => {
    beforeEach(async () => {
        await page.viewport(390, 844);
        await commands.reducedMotion(false);
    });
    afterEach(async () => {
        cleanup();
        document.documentElement.style.fontSize = "";
        await commands.reducedMotion(false);
    });

    it("draws no scrollbar: the bar takes no room and is switched off", async () => {
        render(<Row />);
        await frames();
        const el = row();
        expect(el.scrollWidth).toBeGreaterThan(el.clientWidth);
        expect(getComputedStyle(el).scrollbarWidth).toBe("none");
        expect(el.offsetHeight - el.clientHeight).toBe(0);
    });

    it("shows the end chevron when it overflows, at least 44px, and no start chevron yet", async () => {
        render(<Row />);
        await frames();
        expect(shown(next())).toBe(true);
        expect(shown(previous())).toBe(false);
        const box = next().getBoundingClientRect();
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
    });

    it('arrows="auto" leaves a finger-only device the fade and the swipe, no chevron', async () => {
        render(<Row arrows="auto" />);
        await frames();
        expect(matchMedia("(any-pointer: fine)").matches).toBe(false);
        const slot = row().parentElement!.querySelector(".chip-row__arrow")!;
        expect(getComputedStyle(slot).display).toBe("none");
        expect(row().hasAttribute("data-fade-end")).toBe(true);
        // The fade alone keeps 2.5rem at each end.
        expect(getComputedStyle(row()).scrollPaddingInlineStart).toBe("40px");
    });

    it("a press moves to the chip the fade was cutting, on a glide, then shows the start chevron", async () => {
        const onPick = vi.fn();
        render(<Row onPick={onPick} />);
        await frames();
        const el = row();
        const edge = parseFloat(getComputedStyle(el).scrollPaddingInlineStart);
        const cut = LABELS.map((_, i) => screen.getByTestId(`chip-${i}`)).find(
            (c) => c.getBoundingClientRect().right > el.getBoundingClientRect().right - edge + 1,
        )!;
        await commands.pressAt('[aria-label="Show more replies"]');
        // Mid-glide the row is between where it was and where it is going.
        await new Promise((r) => setTimeout(r, 60));
        const mid = el.scrollLeft;
        await glided();
        expect(mid).toBeGreaterThan(0);
        expect(el.scrollLeft).toBeGreaterThan(mid);
        expect(clearOfFades(cut)).toBe(true);
        expect(shown(previous())).toBe(true);
        expect(onPick).not.toHaveBeenCalled();
    });

    it("moves instantly under reduced motion", async () => {
        await commands.reducedMotion(true);
        render(<Row />);
        await frames();
        await commands.pressAt('[aria-label="Show more replies"]');
        await frames(1);
        expect(row().scrollLeft).toBeGreaterThan(0);
    });

    it("hides the end chevron at the end, and the start one back at the start", async () => {
        render(<Row />);
        await frames();
        const el = row();
        el.scrollLeft = el.scrollWidth;
        await frames(3);
        expect(shown(next())).toBe(false);
        expect(shown(previous())).toBe(true);
        // Once its fade-out has run, the hidden one is out of reach and out
        // of the accessibility tree.
        await new Promise((r) => setTimeout(r, 250));
        const slot = next().closest(".chip-row__arrow")!;
        expect(getComputedStyle(slot).visibility).toBe("hidden");
        expect(getComputedStyle(slot).opacity).toBe("0");
        expect(screen.queryByRole("button", { name: "Show more replies" })).toBeNull();
        el.scrollLeft = 0;
        await frames(3);
        expect(shown(previous())).toBe(false);
    });

    it("drags with the mouse, and the drag never fires a chip's click", async () => {
        const onPick = vi.fn();
        render(<Row onPick={onPick} />);
        await frames();
        await commands.dragAcross('[data-testid="chip-1"]', -150);
        await frames();
        expect(row().scrollLeft).toBeGreaterThanOrEqual(140);
        expect(onPick).not.toHaveBeenCalled();
        expect(row().hasAttribute("data-dragging")).toBe(false);
    });

    it("a wobble under the threshold is still a click", async () => {
        const onPick = vi.fn();
        render(<Row onPick={onPick} />);
        await frames();
        await commands.dragAcross('[data-testid="chip-0"]', 3, { steps: 2 });
        expect(onPick).toHaveBeenCalledWith("On my way");
        expect(row().scrollLeft).toBe(0);
    });

    it("a pen drags too; a finger is left to the browser's own swipe", async () => {
        render(<Row />);
        await frames();
        const el = row();
        const chip = screen.getByTestId("chip-1");
        const r = chip.getBoundingClientRect();
        const y = r.top + r.height / 2;
        const send = (type: string, pointerType: string, x: number, id: number) =>
            chip.dispatchEvent(
                new PointerEvent(type, { bubbles: true, cancelable: true, pointerType, pointerId: id, clientX: x, clientY: y, button: 0, isPrimary: true }),
            );
        send("pointerdown", "touch", r.left + 40, 7);
        send("pointermove", "touch", r.left - 80, 7);
        send("pointerup", "touch", r.left - 80, 7);
        expect(el.scrollLeft).toBe(0);
        send("pointerdown", "pen", r.left + 40, 8);
        send("pointermove", "pen", r.left + 30, 8);
        send("pointermove", "pen", r.left - 80, 8);
        send("pointerup", "pen", r.left - 80, 8);
        expect(el.scrollLeft).toBeGreaterThanOrEqual(110);
    });

    it("Tab reaches every chip, and each one taken by the keyboard lands in view, clear of the fades where it fits", async () => {
        render(
            <>
                <button type="button">Before</button>
                <Row />
            </>,
        );
        await frames();
        screen.getByRole("button", { name: "Before" }).focus();
        for (let i = 0; i < LABELS.length; i++) {
            await userEvent.tab();
            // The browser's own focus scroll, then the row's correction a frame later.
            await frames(3);
            const chip = screen.getByTestId(`chip-${i}`);
            expect(document.activeElement).toBe(chip);
            expectRevealed(chip);
            expectNotUnderAChevron(chip);
        }
    });

    it("a chip too wide for the room between the fades lands clear of the chevrons; one too wide for that shows its start", async () => {
        render(
            <>
                <button type="button">Before</button>
                <Row />
            </>,
        );
        await frames();
        const view = row().clientWidth;
        const { edge, solid } = ends();
        expect(solid).toBeGreaterThan(0);
        expect(edge).toBeGreaterThan(solid);
        // Font-independent: the widths are set from the row's own measure.
        const between = Math.round(view - edge - solid); // wider than the fades allow, narrower than the chevrons
        const wider = Math.round(view - solid); // wider than the room between the chevrons
        const widths = [90, between, 90, wider, 90, 90];
        widths.forEach((w, i) => {
            const chip = screen.getByTestId(`chip-${i}`);
            chip.style.width = `${w}px`;
            chip.style.justifyContent = "center";
        });
        await frames();
        screen.getByRole("button", { name: "Before" }).focus();
        for (let i = 0; i < widths.length; i++) {
            await userEvent.tab();
            await frames(3);
            const chip = screen.getByTestId(`chip-${i}`);
            expect(document.activeElement).toBe(chip);
            expectRevealed(chip);
            expectNotUnderAChevron(chip);
            if (i === 1) {
                expect(clearOfFades(chip)).toBe(false);
                expect(clearOf(chip, solid)).toBe(true);
            }
            if (i === 3) {
                const r = row().getBoundingClientRect();
                expect(Math.abs(chip.getBoundingClientRect().left - (r.left + solid))).toBeLessThanOrEqual(1);
            }
        }
    });

    it("keyboard focus lands at once, never on a glide", async () => {
        render(
            <>
                <button type="button">Before</button>
                <Row />
            </>,
        );
        await frames();
        screen.getByRole("button", { name: "Before" }).focus();
        for (let i = 0; i < 4; i++) await userEvent.tab();
        await frames(3);
        const settled = row().scrollLeft;
        await new Promise((r) => setTimeout(r, 300));
        expect(row().scrollLeft).toBe(settled);
        expectRevealed(screen.getByTestId("chip-3"));
    });

    it("at 200% text the chevrons still hold a 44px target and the row still has no bar", async () => {
        document.documentElement.style.fontSize = "32px";
        render(<Row />);
        await frames();
        expect(getComputedStyle(row()).scrollbarWidth).toBe("none");
        const box = next().getBoundingClientRect();
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(shown(next())).toBe(true);
    });

    it("QuickReplies row is this row: no bar, a chevron named for replies", async () => {
        render(
            <div style={{ width: 340 }}>
                <QuickReplies layout="row" arrows="always" replies={LABELS.map((l, i) => ({ id: String(i), label: l }))} onSelect={() => {}} />
            </div>,
        );
        await frames();
        const group = screen.getByRole("group", { name: "Quick replies" });
        expect(getComputedStyle(group).scrollbarWidth).toBe("none");
        expect(shown(screen.getByRole("button", { name: "Show more replies" }))).toBe(true);
        expect(chevron("Show earlier replies")).toBeTruthy();
    });
});
