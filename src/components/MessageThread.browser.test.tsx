/// <reference types="@vitest/browser/providers/playwright" />
/**
 * AUTM-1946, in a real browser (jsdom lays nothing out): at 200% text in a
 * phone-sized box, the loading, error and empty states overflow, and each one
 * is a scroll host the keyboard can reach and scroll (axe
 * scrollable-region-focusable on the portal Inbox), with its content's top
 * never cut off above the scroll origin, which `items-center` did.
 */
import "../../.storybook/storybook.css";
import { cleanup, render, screen } from "@testing-library/react";
import { userEvent } from "@vitest/browser/context";
import { afterEach, describe, expect, it } from "vitest";
import { MessageThread } from "./MessageThread";

afterEach(() => {
    cleanup();
    document.documentElement.style.fontSize = "";
});

const EMPTY = (
    <div data-testid="thread-content" className="rounded-[1.5rem] bg-[var(--band)] p-5">
        <p className="text-lg font-bold">No messages yet</p>
        <p className="mt-1 text-[0.9375rem]">
            Ask about parking, access or the car. Kerbside Car Care is told by push and email, and replies here.
        </p>
    </div>
);

const states = {
    loading: { loading: true },
    error: { error: true, onRetry: () => {}, errorMessage: "Check your connection and tap retry." },
    empty: { emptyState: EMPTY },
} as const;

function box(props: Record<string, unknown>) {
    render(
        <>
            <button type="button">Before the thread</button>
            <div style={{ width: 390, height: 360, display: "flex", flexDirection: "column" }}>
                <MessageThread items={[]} label="Messages with Sam" {...props} />
            </div>
        </>
    );
    return screen.getByRole("region", { name: "Messages with Sam" });
}

describe("MessageThread states at 200% text (AUTM-1946)", () => {
    it.each(Object.entries(states))("%s overflows, takes Tab, and scrolls with the keyboard", async (state, props) => {
        document.documentElement.style.fontSize = "200%";
        const region = box(props);
        expect(region.getAttribute("data-state")).toBe(state);
        expect(region.scrollHeight, "it must overflow, or this proves nothing").toBeGreaterThan(region.clientHeight + 20);

        screen.getByRole("button", { name: "Before the thread" }).focus();
        await userEvent.tab();
        expect(document.activeElement).toBe(region);
        // The ring is drawn: a 2px accent box-shadow under focus-visible.
        expect(getComputedStyle(region).boxShadow).not.toBe("none");

        expect(region.scrollTop).toBe(0);
        await userEvent.keyboard("{PageDown}");
        await expect.poll(() => region.scrollTop).toBeGreaterThan(0);
    });

    it.each(["error", "empty"] as const)("%s starts at the top when it overflows, none of it above reach", (state) => {
        document.documentElement.style.fontSize = "200%";
        const region = box(states[state]);
        const content = (region.lastElementChild as HTMLElement).getBoundingClientRect();
        expect(content.top).toBeGreaterThanOrEqual(region.getBoundingClientRect().top - 0.5);
    });

    it.each(["error", "empty"] as const)("%s is centred while it fits", (state) => {
        const region = box(states[state]);
        expect(region.scrollHeight).toBeLessThanOrEqual(region.clientHeight + 1);
        const r = region.getBoundingClientRect();
        const c = (region.lastElementChild as HTMLElement).getBoundingClientRect();
        const above = c.top - r.top;
        const below = r.bottom - c.bottom;
        expect(Math.abs(above - below)).toBeLessThanOrEqual(2);
    });
});
