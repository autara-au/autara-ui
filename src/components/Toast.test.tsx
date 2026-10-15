import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider, toast } from "./Toast";

/**
 * AUTM-1883 (Don, 2026-10-15): a toast's words wrap to two lines at most.
 * AUTM-1813: one live region for the provider's life.
 * AUTM-1871 (Don, 2026-10-14): the token surface, a type icon, an inline
 * action, 6 s pausing on hover and focus, at most three, bursts collapse.
 * The layout and the swipe are proven in a real browser (Toast.browser.test.tsx);
 * this pins the contract jsdom can see.
 */

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

async function mount(props: Partial<React.ComponentProps<typeof ToastProvider>> = {}) {
    render(<ToastProvider position="top-center" {...props}>{null}</ToastProvider>);
    // The provider registers the singleton in an effect, then mounts the viewport.
    await act(async () => {});
}

async function show(fire: () => void, props?: Partial<React.ComponentProps<typeof ToastProvider>>) {
    await mount(props);
    await act(async () => {
        fire();
    });
}

const capsules = () => Array.from(document.querySelectorAll<HTMLElement>("[data-toast]"));

describe("Toast (AUTM-1883): two lines at most", () => {
    it("wraps its words to two lines at most instead of truncating them", async () => {
        await show(() => toast.success("Reminder sent to Priya by text and email. Next one possible at 15:35."));
        const words = document.querySelector("[data-toast-message]")!;
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

    it("joins a title and a description into one message, the title first", async () => {
        await show(() => toast({ type: "info", title: "Saved.", description: "Two items updated." }));
        const words = document.querySelector("[data-toast-message]")!;
        expect(words).toHaveTextContent("Saved. Two items updated");
        expect(words.firstElementChild).toHaveTextContent("Saved");
        expect(words.firstElementChild!.className).toContain("font-medium");
    });
});

describe("Toast (AUTM-1813): one live region", () => {
    it("the Notifications region and its live regions are in the page before the first toast", async () => {
        await mount();
        expect(screen.getByRole("region", { name: "Notifications" })).toBeInTheDocument();
        const polite = screen.getByRole("status");
        expect(polite).toHaveAttribute("aria-live", "polite");
        expect(polite).toBeEmptyDOMElement();
        expect(screen.getByRole("alert")).toBeEmptyDOMElement();
    });

    it("writes a toast's words into the polite region, and the capsule carries no live role", async () => {
        await show(() => toast.success("Link copied"));
        expect(screen.getByRole("status")).toHaveTextContent("Link copied");
        const capsule = capsules()[0];
        expect(capsule).not.toHaveAttribute("role");
        expect(capsule).not.toHaveAttribute("aria-live");
        // One status in the page, so QA's getByRole('status') finds this one.
        expect(screen.getAllByRole("status")).toHaveLength(1);
    });

    it("a toast's words exist once in the page, inside its live region (getByText finds one element)", async () => {
        await show(() => toast.success("Reminder sent to the customer"));
        expect(screen.getAllByText("Reminder sent to the customer")).toHaveLength(1);
        expect(screen.getByRole("status")).toContainElement(capsules()[0]);
    });

    it("an error is announced assertively, in the alert region", async () => {
        await show(() => toast.error("We couldn't send the reminder. Try again in a moment."));
        expect(screen.getByRole("alert")).toHaveTextContent("We couldn't send the reminder");
        expect(screen.getByRole("status")).toBeEmptyDOMElement();
    });

    it("the words leave the region with the toast", async () => {
        await show(() => toast.success({ description: "Link copied", duration: 0 }));
        fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
        await act(async () => {
            await new Promise((r) => setTimeout(r, 260));
        });
        expect(screen.getByRole("status")).toBeEmptyDOMElement();
        expect(capsules()).toHaveLength(0);
    });
});

describe("Toast (AUTM-1871): the new look", () => {
    it("draws the type's icon on a disc in its tone: lime for done, red for a problem", async () => {
        await show(() => {
            toast.success("Deposit paid");
            toast.error("Payment failed");
        });
        const [ok, bad] = capsules();
        expect(ok.querySelector("[data-toast-icon]")!.className).toContain("bg-[var(--lime)]");
        expect(bad.querySelector("[data-toast-icon]")!.className).toContain("bg-[var(--danger-fill)]");
    });

    it("takes a custom icon and tone (purple to act)", async () => {
        await show(() =>
            toast({ title: "New request from Dinah", icon: <svg data-testid="calendar" />, tone: "act" }),
        );
        const disc = capsules()[0].querySelector("[data-toast-icon]")!;
        expect(disc.className).toContain("bg-[var(--accent-fill)]");
        expect(disc.querySelector('[data-testid="calendar"]')).toBeTruthy();
        expect(disc).toHaveAttribute("aria-hidden", "true");
    });

    it("is the raised token surface, not the ink capsule", async () => {
        await show(() => toast("Synced"));
        const c = capsules()[0];
        expect(c.className).toContain("bg-[var(--raised)]");
        expect(c.className).not.toContain("surface-inverse");
    });

    it("the action is a quiet accent text button; pressing it runs it and dismisses the toast", async () => {
        const onClick = vi.fn();
        await show(() => toast({ title: "New request from Dinah", duration: 0, action: { label: "Answer", onClick } }));
        const answer = screen.getByRole("button", { name: "Answer" });
        expect(answer.className).toContain("text-[var(--accent)]");
        expect(answer.className).not.toMatch(/bg-\[var\(--(cta-fill|surface-inverse|ink)\)\]/);
        fireEvent.click(answer);
        expect(onClick).toHaveBeenCalledTimes(1);
        await act(async () => {
            await new Promise((r) => setTimeout(r, 260));
        });
        expect(capsules()).toHaveLength(0);
    });

    it("closes with the large round Close (AUTM-1756)", async () => {
        await show(() => toast("Synced"));
        expect(screen.getByRole("button", { name: "Dismiss notification" })).toHaveAttribute("data-size", "md");
    });
});

describe("Toast (AUTM-1871): time", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    async function fakeShow(fire: () => void) {
        render(<ToastProvider position="top-center">{null}</ToastProvider>);
        await act(async () => {
            await vi.advanceTimersByTimeAsync(0);
        });
        await act(async () => {
            fire();
        });
    }

    async function wait(ms: number) {
        await act(async () => {
            await vi.advanceTimersByTimeAsync(ms);
        });
    }

    it("stays 6 seconds", async () => {
        await fakeShow(() => toast.success("Link copied"));
        await wait(5_800);
        expect(capsules()).toHaveLength(1);
        await wait(500);
        expect(capsules()).toHaveLength(0);
    });

    it("pauses while the pointer is on it, then finishes the time it had left", async () => {
        await fakeShow(() => toast.success("Link copied"));
        await wait(4_000);
        fireEvent.mouseEnter(capsules()[0]);
        await wait(20_000);
        expect(capsules()).toHaveLength(1);
        fireEvent.mouseLeave(capsules()[0]);
        await wait(1_800);
        expect(capsules()).toHaveLength(1);
        await wait(500);
        expect(capsules()).toHaveLength(0);
    });

    it("pauses while focus is inside it", async () => {
        await fakeShow(() => toast({ description: "Booking moved", action: { label: "View", onClick: () => {} } }));
        await wait(3_000);
        fireEvent.focus(screen.getByRole("button", { name: "View" }));
        await wait(20_000);
        expect(capsules()).toHaveLength(1);
        fireEvent.blur(screen.getByRole("button", { name: "View" }));
        await wait(3_300);
        expect(capsules()).toHaveLength(0);
    });
});

describe("Toast (AUTM-1871): the stack", () => {
    it("shows three at most; a fourth pushes the oldest out", async () => {
        await show(() => {
            toast.info("One");
            toast.info("Two");
            toast.info("Three");
            toast.info("Four");
        });
        expect(capsules().map((c) => c.textContent)).toEqual(
            expect.arrayContaining([expect.stringContaining("Two"), expect.stringContaining("Three"), expect.stringContaining("Four")]),
        );
        expect(capsules()).toHaveLength(3);
        expect(document.body.textContent).not.toContain("One");
    });

    it("keeps a loading toast a caller will still update over an older finished one", async () => {
        await show(() => {
            toast.loading("Sending");
            toast.info("Two");
            toast.info("Three");
            toast.info("Four");
        });
        const words = capsules().map((c) => c.textContent);
        expect(words.some((w) => w?.includes("Sending"))).toBe(true);
        expect(words.some((w) => w?.includes("Two"))).toBe(false);
    });

    it("a burst with one groupKey is one toast, with the newest words", async () => {
        let first = "";
        let second = "";
        await show(() => {
            first = toast({ title: "Dinah confirmed and paid $25.18", groupKey: "booking:b1", tone: "money" });
            second = toast({ title: "Dinah approved a $25.00 extra", groupKey: "booking:b1", tone: "money" });
            toast({ title: "Quentin sent you a message", groupKey: "booking:b2", tone: "act" });
        });
        expect(second).toBe(first);
        expect(capsules()).toHaveLength(2);
        expect(capsules()[0]).toHaveTextContent("Dinah approved a $25.00 extra");
        expect(screen.getByRole("status")).not.toHaveTextContent("Dinah confirmed");
    });

    it("toast() returns the id at once, so update and dismiss work straight after", async () => {
        let id = "";
        await show(() => {
            id = toast.loading("Sending");
            toast.update(id, { type: "success", description: "Sent", duration: 0 });
        });
        expect(id).toMatch(/^toast-/);
        expect(capsules()[0]).toHaveTextContent("Sent");
    });
});
