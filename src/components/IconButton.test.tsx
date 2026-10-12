import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IconButton } from "./IconButton";

describe("IconButton (AUTM-1594)", () => {
    it("is named by its label, not by its icon", () => {
        render(<IconButton icon={<svg aria-hidden="true" />} label="Remove vehicle" />);
        expect(screen.getByRole("button", { name: "Remove vehicle" })).toBeInTheDocument();
    });

    it("is a 44px band disc by default", () => {
        render(<IconButton icon={<svg aria-hidden="true" />} label="Remove" />);
        const cls = screen.getByRole("button").className;
        expect(cls).toMatch(/\bsize-11\b/);
        expect(cls).toMatch(/\brounded-full\b/);
        expect(cls).toMatch(/bg-\[var\(--band\)\]/);
    });

    it("AUTM-1838: strong is the lime disc, never ink", () => {
        render(<IconButton icon={<svg aria-hidden="true" />} label="Send message" variant="strong" />);
        const cls = screen.getByRole("button").className;
        expect(cls).toMatch(/bg-\[var\(--lime\)\]/);
        expect(cls).not.toMatch(/--strong\)/);
    });

    it("draws the badge without adding it to the accessible name", () => {
        render(
            <IconButton
                icon={<svg aria-hidden="true" />}
                label="Notifications, 12 unread"
                badge={<span>12</span>}
            />,
        );
        expect(screen.getByRole("button", { name: "Notifications, 12 unread" })).toBeInTheDocument();
        expect(screen.getByText("12").closest("[aria-hidden]")).not.toBeNull();
    });

    it("fires onClick and honours disabled", async () => {
        const onClick = vi.fn();
        const { rerender } = render(<IconButton icon={<svg />} label="Remove" onClick={onClick} />);
        await userEvent.click(screen.getByRole("button"));
        expect(onClick).toHaveBeenCalledTimes(1);
        rerender(<IconButton icon={<svg />} label="Remove" onClick={onClick} disabled />);
        await userEvent.click(screen.getByRole("button"));
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
