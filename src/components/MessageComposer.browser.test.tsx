/// <reference types="@vitest/browser/providers/playwright" />
/**
 * AUTM-1899, in a real browser (jsdom lays nothing out): the inset field is
 * not a scroller while what is typed fits, at any text size, so no platform
 * can draw a bar in a one-line box; at its cap of about four lines it
 * scrolls.
 */
import "../../.storybook/storybook.css";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MessageComposer } from "./MessageComposer";

afterEach(() => {
    cleanup();
    document.documentElement.style.fontSize = "";
});

function inset(value: string) {
    render(
        <div style={{ width: 640 }}>
            <MessageComposer layout="inset" value={value} onChange={() => {}} onSend={() => {}} placeholder="Message Alex" />
        </div>
    );
    return screen.getByRole("textbox", { name: "Message" }) as HTMLTextAreaElement;
}

describe("MessageComposer inset field (AUTM-1899)", () => {
    it.each(["16px", "15px", "17px", "18.5px", "32px"])("one line fits and is not a scroller at a %s root", (size) => {
        document.documentElement.style.fontSize = size;
        for (const value of ["", "On my way, about ten minutes out"]) {
            const field = inset(value);
            expect(getComputedStyle(field).overflowY, `${size} ${JSON.stringify(value)}`).toBe("hidden");
            expect(field.scrollHeight - field.clientHeight).toBeLessThanOrEqual(1);
            cleanup();
        }
    });

    it("grows with each line, then scrolls at its cap", () => {
        const four = inset("one\ntwo\nthree");
        expect(getComputedStyle(four).overflowY).toBe("hidden");
        cleanup();
        const ten = inset(Array.from({ length: 10 }, (_, i) => `line ${i + 1}`).join("\n"));
        expect(getComputedStyle(ten).overflowY).toBe("auto");
        expect(ten.scrollHeight).toBeGreaterThan(ten.clientHeight);
    });
});
