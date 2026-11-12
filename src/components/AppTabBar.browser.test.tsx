/// <reference types="@vitest/browser/providers/playwright" />
/**
 * AUTM-1816 and AUTM-1802, in a real browser: the dock at 390 wide, at 100%
 * and 200% text. jsdom has no layout, so whether the current tab's name fits
 * can only be measured here.
 *
 * 200% text is the ROOT font size doubling (a phone's text-size setting),
 * which grows every rem in the dock. Before AUTM-1816 the current name broke
 * mid-word ("Me/ssa/ge/s") and the dock grew to a third of the screen.
 */
import "../../.storybook/storybook.css";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { page } from "@vitest/browser/context";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppTabBar, type AppTabBarItem } from "./AppTabBar";

const Glyph = () => (
    <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
    </svg>
);

const items = (messages: number, active = "messages"): AppTabBarItem[] => [
    { key: "bookings", label: "Bookings", icon: <Glyph />, href: "#b", active: active === "bookings", badge: 1, badgeLabel: "1 payment due" },
    { key: "messages", label: "Messages", icon: <Glyph />, href: "#m", active: active === "messages", badge: messages, badgeLabel: `${messages} unread` },
    { key: "account", label: "Account", icon: <Glyph />, href: "#a", active: active === "account" },
];

function setRootFont(px: number) {
    document.documentElement.style.fontSize = `${px}px`;
}

/**
 * The dock is wholly on screen and nothing in it scrolls sideways. Measured
 * once the tab slide has finished: the bar remembers the last bar's layout
 * per label, so a test whose current tab differs from the previous test's
 * plays the slide, and tabs in flight are not where they will rest.
 */
async function expectFits() {
    await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined)));
    const nav = screen.getByRole("navigation", { name: "Account" });
    const list = nav.querySelector("ul")!;
    const box = list.getBoundingClientRect();
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(window.innerWidth);
    expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth + 1);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
}

describe("AppTabBar dock at 390 (AUTM-1802, AUTM-1816)", () => {
    beforeEach(async () => {
        await page.viewport(390, 844);
    });
    afterEach(() => {
        cleanup();
        setRootFont(16);
    });

    for (const n of [3, 12]) {
        it(`100% text, ${n} unread: the name on one line, the count in the pill after it, vertically centred`, async () => {
            setRootFont(16);
            render(<AppTabBar label="Account" items={items(n)} hideFrom="never" />);
            const tab = screen.getByTestId("app-tab-messages");
            const name = within(tab).getByText("Messages");
            const count = within(tab).getByText(String(n));
            await waitFor(() => expect(name).not.toHaveAttribute("data-name-hidden"));
            const nb = name.getBoundingClientRect();
            const cb = count.getBoundingClientRect();
            const pill = tab.querySelector("[data-tab-pill]")!.getBoundingClientRect();
            // One line: no taller than one line box.
            expect(nb.height).toBeLessThanOrEqual(parseFloat(getComputedStyle(name).lineHeight) + 1);
            // After the name, clear of it, inside the pill, centred on it.
            expect(cb.left).toBeGreaterThanOrEqual(nb.right);
            expect(cb.right).toBeLessThanOrEqual(pill.right);
            expect(Math.abs(cb.top + cb.height / 2 - (pill.top + pill.height / 2))).toBeLessThanOrEqual(1);
            await expectFits();
        });

        it(`200% text, ${n} unread: the pill shows the icon and the count, the tab still says its name`, async () => {
            setRootFont(32);
            render(<AppTabBar label="Account" items={items(n)} hideFrom="never" />);
            const tab = screen.getByTestId("app-tab-messages");
            const name = within(tab).getByText("Messages");
            await waitFor(() => expect(name).toHaveAttribute("data-name-hidden"));
            // sr-only: in the tree, not drawn, and taking no room in the row.
            expect(getComputedStyle(name).position).toBe("absolute");
            expect(name.getBoundingClientRect().width).toBeLessThanOrEqual(1);
            expect(screen.getByRole("link", { name: `Messages, ${n} unread` })).toHaveAttribute("aria-current", "page");
            const count = within(tab).getByText(String(n));
            const cb = count.getBoundingClientRect();
            const pill = tab.querySelector("[data-tab-pill]")!.getBoundingClientRect();
            expect(cb.width).toBeGreaterThan(0);
            expect(cb.right).toBeLessThanOrEqual(pill.right);
            // One row: the dock is no taller than its tabs.
            const nav = screen.getByRole("navigation", { name: "Account" });
            expect(nav.querySelector("ul")!.getBoundingClientRect().height).toBeLessThan(120);
            await expectFits();
        });
    }

    it("the name comes back when the text is made smaller again", async () => {
        setRootFont(32);
        render(<AppTabBar label="Account" items={items(12)} hideFrom="never" />);
        const name = within(screen.getByTestId("app-tab-messages")).getByText("Messages");
        await waitFor(() => expect(name).toHaveAttribute("data-name-hidden"));
        setRootFont(16);
        await waitFor(() => expect(name).not.toHaveAttribute("data-name-hidden"));
        await expectFits();
    });

    it("200% text with Account current and no count: one row, no sideways scroll", async () => {
        setRootFont(32);
        render(<AppTabBar label="Account" items={items(140, "account")} hideFrom="never" />);
        await waitFor(() => expect(screen.getByRole("navigation", { name: "Account" }).querySelector("ul")!.getBoundingClientRect().height).toBeLessThan(120));
        await expectFits();
    });
});
