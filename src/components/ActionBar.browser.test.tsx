/// <reference types="@vitest/browser/providers/playwright" />
/**
 * AUTM-1905, in a real browser (jsdom lays nothing out): at 200% text a labelled
 * pill's icon stays inside its padding and grows with the label. Before, the
 * icon was a fixed 22px and a long label ("Message Fitzroy Paint Co") pushed it
 * onto the pill's edge, because centred content that overflows spills out of
 * both sides. Now the icon wraps onto its own line above the label instead.
 */
import "../../.storybook/storybook.css";
import { page } from "@vitest/browser/context";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ActionBar } from "./ActionBar";

const glyph = (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" />
    </svg>
);

beforeEach(async () => {
    // From lg the icon actions are labelled band pills, the case that failed.
    await page.viewport(1280, 800);
});

afterEach(() => {
    cleanup();
    document.documentElement.style.fontSize = "";
});

function bar() {
    render(
        <div style={{ width: 330 }}>
            <ActionBar
                label="Booking actions"
                primary={{ key: "directions", label: "Directions", icon: glyph, onSelect: () => {} }}
                icons={[
                    { key: "message", label: "Message Fitzroy Paint Co", icon: glyph, onSelect: () => {} },
                    { key: "call", label: "Call Fitzroy Paint Co", icon: glyph, onSelect: () => {} },
                ]}
            />
        </div>
    );
}

describe("ActionBar labelled pills (AUTM-1905)", () => {
    it.each(["16px", "32px"])("keep the icon inside the padding and size it with the text at a %s root", (size) => {
        document.documentElement.style.fontSize = size;
        bar();
        for (const name of ["Message Fitzroy Paint Co", "Call Fitzroy Paint Co", "Directions"]) {
            const button = screen.getByRole("button", { name });
            const icon = button.querySelector("svg") as SVGElement;
            const b = button.getBoundingClientRect();
            const i = icon.getBoundingClientRect();
            const padLeft = parseFloat(getComputedStyle(button).paddingLeft);
            const fontSize = parseFloat(getComputedStyle(button).fontSize);
            expect(i.left, `${name} at ${size}: icon left of the padding`).toBeGreaterThanOrEqual(b.left + padLeft - 1);
            expect(i.right, `${name} at ${size}: icon past the right edge`).toBeLessThanOrEqual(b.right - padLeft + 1);
            expect(button.scrollWidth, `${name} at ${size}: content overflows`).toBeLessThanOrEqual(button.clientWidth + 1);
            expect(Math.abs(i.width - fontSize * 1.375), `${name} at ${size}: icon does not scale`).toBeLessThanOrEqual(1);
        }
    });
});
