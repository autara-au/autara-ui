/// <reference types="@vitest/browser/providers/playwright" />
/**
 * AUTM-1909, in a real browser (jsdom lays nothing out): the pro's name on the
 * pass is a link drawn at its text's height, so its tap target was 24px. The
 * 44px floor (AUTM-622) is an unpainted hit area around it, as on the chips
 * and tabs: a tap 9px above or below the drawn name still lands on the link.
 */
import "../../.storybook/storybook.css";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BookingPass } from "./BookingPass";

afterEach(cleanup);

describe("BookingPass name link (AUTM-1909)", () => {
    it("takes a tap anywhere in a 44px band around the drawn name", () => {
        render(
            <div style={{ width: 360, padding: 24 }}>
                <BookingPass name="Fitzroy Paint Co" href="/m/fitzroy" sub="Paint correction, single stage" />
            </div>,
        );
        const link = screen.getByRole("link", { name: "Fitzroy Paint Co" });
        const r = link.getBoundingClientRect();
        expect(r.height, "the drawn name is shorter than the floor, or this proves nothing").toBeLessThan(44);
        const x = r.left + Math.min(r.width / 2, 20);
        const mid = r.top + r.height / 2;
        for (const y of [mid - 21, mid, mid + 21]) {
            const hit = document.elementFromPoint(x, y);
            expect(hit === link || link.contains(hit), `a tap at ${Math.round(y - mid)}px from the name's centre`).toBe(true);
        }
    });
});
