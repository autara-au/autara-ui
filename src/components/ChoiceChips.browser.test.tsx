/// <reference types="@vitest/browser/providers/playwright" />
/**
 * AUTM-2140 R8 (Don's pick C2), in a real browser: whether the tiles go from
 * two even columns to one at 32rem of container (and so at 200% text), and
 * whether each is a 64px tile with a 24px icon in a 44px disc, can only be
 * measured with layout.
 */
import "../../.storybook/storybook.css";
import { cleanup, render, screen } from "@testing-library/react";
import { page } from "@vitest/browser/context";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ChoiceChips, type ChoiceChipOption } from "./ChoiceChips";

function setRootFont(px: number) {
    document.documentElement.style.fontSize = `${px}px`;
}

const CATS: ChoiceChipOption[] = [
    "Exterior Car Care & Detailing",
    "Interior Detailing & Protection",
    "Protection & Restoration",
    "Exterior Styling & Body Modifications",
].map((label, i) => ({ value: `c${i}`, label, icon: <svg viewBox="0 0 24 24" /> }));

describe("ChoiceChips tiles layout (AUTM-2140 R8)", () => {
    beforeEach(async () => {
        await page.viewport(1024, 900);
    });
    afterEach(() => {
        cleanup();
        setRootFont(16);
    });

    function Tiles({ width }: { width: string }) {
        return (
            <div style={{ width }}>
                <ChoiceChips label="Category" layout="tiles" options={CATS} value="c1" onChange={() => {}} />
            </div>
        );
    }
    const tiles = () => screen.getAllByRole("radio").map((el) => el.getBoundingClientRect());

    it("two even columns from 32rem of container, each tile at least 64px, the icon 24px in a 44px disc", () => {
        render(<Tiles width="672px" />);
        const t = tiles();
        expect(Math.round(t[0].top)).toBe(Math.round(t[1].top));
        expect(Math.abs(t[0].width - t[1].width)).toBeLessThan(1);
        for (const r of t) expect(r.height).toBeGreaterThanOrEqual(64);
        const disc = screen.getAllByRole("radio")[0].querySelector('[data-slot="tile-icon"]')!;
        expect(Math.round(disc.getBoundingClientRect().width)).toBe(44);
        expect(Math.round(disc.querySelector("svg")!.getBoundingClientRect().width)).toBe(24);
    });

    it("one column under 32rem (a phone), and at 200% text in the same container", () => {
        render(<Tiles width="390px" />);
        let t = tiles();
        expect(t[1].top).toBeGreaterThanOrEqual(t[0].bottom);
        cleanup();
        setRootFont(32);
        render(<Tiles width="672px" />);
        t = tiles();
        expect(t[1].top).toBeGreaterThanOrEqual(t[0].bottom);
        for (const r of t) expect(r.height).toBeGreaterThanOrEqual(128);
    });
});
