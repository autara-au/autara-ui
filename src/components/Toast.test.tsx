import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ToastProvider, toast } from "./Toast";

/**
 * AUTM-1883 (Don, 2026-10-15): a toast's words wrap to two lines at most,
 * never one truncated line. The layout itself is proven in a real browser
 * (Toast.browser.test.tsx); this pins the contract jsdom can see.
 */

afterEach(cleanup);

async function show(fire: () => void) {
    render(<ToastProvider position="top-center">{null}</ToastProvider>);
    // The provider registers the singleton in an effect, then mounts the viewport.
    await act(async () => {});
    await act(async () => {
        fire();
    });
}

describe("Toast (AUTM-1883)", () => {
    it("wraps its words to two lines at most instead of truncating them", async () => {
        await show(() => toast.success("Reminder sent to Priya by text and email. Next one possible at 15:35."));
        const words = screen.getByRole("status").querySelector("[data-toast-message]")!;
        expect(words.className).toContain("line-clamp-2");
        expect(words.className).not.toMatch(/\btruncate\b/);
        expect(words.className).toContain("min-w-0");
        // Large text on a phone: every word, no clamp (the browser test measures it).
        expect(words.className).toContain("@max-[20em]:line-clamp-none");
    });

    it("keeps the whole sentence, without its closing full stop (AUTM-1221)", async () => {
        await show(() => toast.success("Reminder sent to Priya by text and email. Next one possible at 15:35."));
        expect(screen.getByRole("status")).toHaveTextContent(
            "Reminder sent to Priya by text and email. Next one possible at 15:35",
        );
    });

    it("joins a title and a description into one message", async () => {
        await show(() => toast({ type: "info", title: "Saved.", description: "Two items updated." }));
        expect(screen.getByRole("status").querySelector("[data-toast-message]")).toHaveTextContent(
            "Saved. Two items updated",
        );
    });

    it("is an alert for an error, a status otherwise", async () => {
        await show(() => toast.error("We couldn't send the reminder. Try again in a moment."));
        expect(screen.getByRole("alert")).toHaveTextContent("We couldn't send the reminder");
    });
});
