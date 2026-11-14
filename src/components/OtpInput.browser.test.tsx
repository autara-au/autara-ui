/// <reference types="@vitest/browser/providers/playwright" />
/**
 * AUTM-2140 R2 (Don's pick A1), in a real browser: jsdom has no layout, so
 * whether the pill fills its container, whether a slot is still a 44px target
 * on a phone, and whether the threes stack where one row cannot fit (and at
 * 200% text) can only be measured here.
 */
import "../../.storybook/storybook.css";
import { cleanup, render, screen } from "@testing-library/react";
import { page } from "@vitest/browser/context";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useState } from "react";
import { OtpInput } from "./OtpInput";

function setRootFont(px: number) {
    document.documentElement.style.fontSize = `${px}px`;
}

function Otp({ width, seed = "" }: { width: string; seed?: string }) {
    const [code, setCode] = useState(seed);
    return (
        <div style={{ width }} data-testid="host">
            <OtpInput value={code} onChange={setCode} autoFocus={false} />
        </div>
    );
}

const slots = () => screen.getAllByRole("textbox").map((el) => el.getBoundingClientRect());
const pill = () => document.querySelector(".otp-field")!.getBoundingClientRect();

describe("OtpInput layout (AUTM-2140 R2)", () => {
    beforeEach(async () => {
        await page.viewport(1024, 900);
    });
    afterEach(() => {
        cleanup();
        setRootFont(16);
    });

    it("in the 448px sign-in column: one pill the column's width, six 50px slots on one row, centred", () => {
        render(<Otp width="448px" />);
        const host = screen.getByTestId("host").getBoundingClientRect();
        const p = pill();
        expect(Math.round(p.width)).toBe(Math.round(host.width));
        expect(Math.round(p.height)).toBe(72);
        const s = slots();
        expect(new Set(s.map((r) => Math.round(r.top))).size).toBe(1);
        for (const r of s) {
            expect(Math.round(r.width)).toBe(50);
            expect(Math.round(r.height)).toBe(52);
        }
        // Centred: the space left of slot 1 equals the space right of slot 6.
        expect(Math.abs(s[0].left - p.left - (p.right - s[5].right))).toBeLessThan(1.5);
        // The dash sits between the threes.
        const sep = document.querySelector(".otp-sep")!.getBoundingClientRect();
        expect(sep.left).toBeGreaterThan(s[2].right);
        expect(sep.right).toBeLessThan(s[3].left);
    });

    it("on a 375px phone (343 wide): still one row, every slot at least 44 by 44", () => {
        render(<Otp width="343px" />);
        const s = slots();
        expect(new Set(s.map((r) => Math.round(r.top))).size).toBe(1);
        for (const r of s) {
            expect(r.width).toBeGreaterThanOrEqual(44);
            expect(r.height).toBeGreaterThanOrEqual(44);
        }
        expect(s[5].right).toBeLessThanOrEqual(pill().right);
    });

    it("on a 320px phone (288 wide): the threes stack, the dash hides, nothing overflows", () => {
        render(<Otp width="288px" />);
        const s = slots();
        expect(Math.round(s[3].top)).toBeGreaterThan(Math.round(s[0].bottom));
        expect(getComputedStyle(document.querySelector(".otp-sep")!).display).toBe("none");
        const p = pill();
        for (const r of s) {
            expect(r.width).toBeGreaterThanOrEqual(44);
            expect(r.left).toBeGreaterThanOrEqual(p.left);
            expect(r.right).toBeLessThanOrEqual(p.right);
            expect(r.bottom).toBeLessThanOrEqual(p.bottom);
        }
    });

    it("200% text on a 390 phone: the digit and slots double, the threes stack, nothing is cut off", () => {
        setRootFont(32);
        render(<Otp width="358px" seed="4829" />);
        const box = screen.getByRole("textbox", { name: "Digit 1 of 6" });
        expect(getComputedStyle(box).fontSize).toBe("56px");
        const s = slots();
        expect(Math.round(s[3].top)).toBeGreaterThan(Math.round(s[0].bottom));
        const p = pill();
        for (const r of s) {
            expect(r.width).toBeGreaterThanOrEqual(88);
            expect(r.right).toBeLessThanOrEqual(p.right);
        }
        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    });

    it("in a shrink-to-fit parent it keeps its one-row width instead of collapsing", () => {
        render(
            <div style={{ display: "inline-flex" }} data-testid="fit">
                <OtpInput value="" onChange={() => {}} autoFocus={false} />
            </div>,
        );
        expect(Math.round(pill().width)).toBe(380);
        expect(slots()[0].width).toBeGreaterThanOrEqual(44);
    });

    it("focus: the pill takes the accent edge, the current slot the tint and a visible caret; the empty ones a dot", async () => {
        render(<Otp width="448px" seed="482" />);
        screen.getByRole("textbox", { name: "Digit 4 of 6" }).focus();
        const slot4 = screen.getByRole("textbox", { name: "Digit 4 of 6" }).closest(".otp-slot")!;
        const slot5 = screen.getByRole("textbox", { name: "Digit 5 of 6" }).closest(".otp-slot")!;
        const slot1 = screen.getByRole("textbox", { name: "Digit 1 of 6" }).closest(".otp-slot")!;
        expect(getComputedStyle(slot4.querySelector(".otp-caret")!).display).toBe("block");
        expect(getComputedStyle(slot5.querySelector(".otp-caret")!).display).toBe("none");
        expect(getComputedStyle(slot5, "::before").content).not.toBe("none");
        expect(getComputedStyle(slot1, "::before").content).toBe("none");
        expect(getComputedStyle(slot4, "::before").content).toBe("none");
        // The tint is on once its 160ms step has run.
        await new Promise((r) => setTimeout(r, 300));
        expect(getComputedStyle(slot4).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
        expect(getComputedStyle(slot5).backgroundColor).toBe("rgba(0, 0, 0, 0)");
        const field = document.querySelector(".otp-field")!;
        expect(getComputedStyle(field).getPropertyValue("--edge-ring").trim()).toContain("color-mix");
    });
});
