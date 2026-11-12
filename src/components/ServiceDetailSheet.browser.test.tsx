/// <reference types="@vitest/browser/providers/playwright" />
/**
 * AUTM-1866, in a real browser: the detail sheet is a bottom sheet on a phone
 * and a centred card on a desktop, its Book is a 44px-plus solid purple pill
 * whose white label clears 4.5:1 in both themes, and at 200% text nothing in
 * the foot is cut.
 */
import "../../.storybook/storybook.css";
import { cleanup, render, screen } from "@testing-library/react";
import { page } from "@vitest/browser/context";
import { afterEach, describe, expect, it } from "vitest";
import { ServiceDetailSheet } from "./ServiceDetailSheet";

const PHOTO =
    "data:image/svg+xml;utf8," +
    encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="5"><rect width="8" height="5" fill="#7a6a58"/></svg>');

function Sheet() {
    return (
        <ServiceDetailSheet
            open
            onOpenChange={() => {}}
            name="Interior steam clean"
            description={"Hot-water extraction on carpets and cloth seats.\nLeather cleaned and conditioned."}
            coverImageUrl={PHOTO}
            durationLabel="2 hr"
            locationLabel="Comes to you or at the workshop"
            priceLabel="$188.82"
            priceNote="incl. $8.82 booking fee"
            onBook={() => {}}
            testIds={{ book: "book", price: "price", priceNote: "note" }}
        />
    );
}

type RGBA = [number, number, number, number];
const rgba = (css: string): RGBA => {
    const m = css.match(/rgba?\(([^)]+)\)/);
    if (!m) throw new Error(`not a colour: ${css}`);
    const [r, g, b, a = "1"] = m[1].split(/[ ,/]+/).filter(Boolean);
    return [Number(r), Number(g), Number(b), Number(a)];
};
const over = (fg: RGBA, bg: RGBA): RGBA => [
    fg[0] * fg[3] + bg[0] * (1 - fg[3]),
    fg[1] * fg[3] + bg[1] * (1 - fg[3]),
    fg[2] * fg[3] + bg[2] * (1 - fg[3]),
    1,
];
const lum = ([r, g, b]: RGBA) => {
    const c = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
};
const ratio = (fg: RGBA, bg: RGBA) => {
    const [a, b] = [lum(over(fg, bg)), lum(bg)].sort((x, y) => y - x);
    return (a + 0.05) / (b + 0.05);
};

/* The sheet rises on its entrance; measure where it comes to rest. */
const settled = () => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined)));

afterEach(() => {
    cleanup();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.fontSize = "";
});

describe("ServiceDetailSheet (AUTM-1866)", () => {
    it("is a bottom sheet at 390 and a centred card at 1280", async () => {
        await page.viewport(390, 844);
        const { unmount } = render(<Sheet />);
        await settled();
        let box = screen.getByRole("dialog").getBoundingClientRect();
        expect(Math.round(box.bottom)).toBe(844);
        expect(Math.round(box.width)).toBe(390);
        unmount();
        await page.viewport(1280, 900);
        render(<Sheet />);
        await settled();
        box = screen.getByRole("dialog").getBoundingClientRect();
        expect(box.width).toBeLessThan(640);
        expect(Math.abs(box.left + box.width / 2 - 640)).toBeLessThan(2);
    });

    it.each(["light", "dark"] as const)("Book's white label clears 4.5:1 on its purple pill, %s", async (theme) => {
        await page.viewport(390, 844);
        document.documentElement.setAttribute("data-theme", theme);
        render(<Sheet />);
        const book = screen.getByTestId("book");
        const pill = rgba(getComputedStyle(book).backgroundColor);
        expect(ratio(rgba(getComputedStyle(book).color), pill)).toBeGreaterThanOrEqual(4.5);
        expect(book.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
        // The sheet's own text on its paper.
        const paper = rgba(getComputedStyle(screen.getByRole("dialog")).backgroundColor);
        for (const el of [screen.getByTestId("price"), screen.getByTestId("note")]) {
            expect(ratio(rgba(getComputedStyle(el).color), paper)).toBeGreaterThanOrEqual(4.5);
        }
    });

    it("keeps the price and Book whole at 200% text on a phone", async () => {
        await page.viewport(390, 844);
        document.documentElement.style.fontSize = "32px";
        render(<Sheet />);
        const dialog = screen.getByRole("dialog");
        const book = screen.getByTestId("book").getBoundingClientRect();
        const price = screen.getByTestId("price").getBoundingClientRect();
        expect(book.right).toBeLessThanOrEqual(dialog.getBoundingClientRect().right);
        expect(price.width).toBeGreaterThan(0);
        expect(dialog.scrollWidth).toBeLessThanOrEqual(dialog.clientWidth);
    });
});
