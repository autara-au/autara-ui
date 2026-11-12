import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CloseButton, IconButton, iconDiscClasses, resolveIconButtonTone } from "./IconButton";

describe("IconButton (AUTM-1594, AUTM-1756)", () => {
    it("is named by its label, not by its icon, and shows it as the tooltip", () => {
        render(<IconButton icon={<svg aria-hidden="true" />} label="Remove vehicle" />);
        const button = screen.getByRole("button", { name: "Remove vehicle" });
        expect(button).toHaveAttribute("title", "Remove vehicle");
    });

    it("requires the label in its type", () => {
        // @ts-expect-error label is required: an icon-only control needs a name.
        render(<IconButton icon={<svg aria-hidden="true" />} />);
    });

    it("is a FILLED 44px disc by default, 48px to a finger, with a 20px glyph", () => {
        render(<IconButton icon={<svg aria-hidden="true" />} label="Remove" />);
        const button = screen.getByRole("button");
        const cls = button.className;
        expect(cls).toMatch(/(^|\s)size-11(\s|$)/);
        expect(cls).toContain("pointer-coarse:size-12");
        expect(cls).toContain("[&_svg]:size-5");
        expect(cls).toMatch(/\brounded-full\b/);
        expect(cls).toContain("bg-[var(--icon-disc)]");
        expect(cls).toContain("text-[var(--on-icon-disc)]");
        expect(button).toHaveAttribute("data-tone", "neutral");
    });

    it("never draws a bare glyph: the old ghost variant is the filled neutral disc", () => {
        render(<IconButton icon={<svg aria-hidden="true" />} label="More" variant="ghost" />);
        const cls = screen.getByRole("button").className;
        expect(cls).toContain("bg-[var(--icon-disc)]");
        expect(cls).not.toContain("bg-transparent");
        // Button's ghost hover (band) is replaced: hover is the layer.
        expect(cls).not.toContain("hover:bg-[var(--band)]");
    });

    it("answers hover and press with the icon-disc layer and the 97% press", () => {
        render(<IconButton icon={<svg aria-hidden="true" />} label="Remove" />);
        const cls = screen.getByRole("button").className;
        expect(cls).toMatch(/\bicon-disc\b/);
        expect(cls).toMatch(/\bmotion-press\b/);
        // Positioned and isolated, so the layer sits between fill and glyph.
        expect(cls).toMatch(/\brelative\b/);
        expect(cls).toMatch(/\bisolate\b/);
    });

    it("carries the library focus ring: full accent with a 2px offset band", () => {
        render(<IconButton icon={<svg aria-hidden="true" />} label="Remove" />);
        const cls = screen.getByRole("button").className;
        expect(cls).toContain("focus-visible:ring-2");
        expect(cls).toContain("focus-visible:ring-[var(--accent)]");
        expect(cls).toContain("focus-visible:ring-offset-2");
    });

    it.each([
        ["primary", "bg-[var(--lime)]", "text-[var(--on-lime)]"],
        ["danger", "bg-[var(--icon-disc)]", "text-[var(--danger)]"],
        ["ondark", "bg-[var(--icon-disc-ondark)]", "text-[var(--on-icon-disc-ondark)]"],
        ["inverse", "bg-[var(--icon-disc-inverse)]", "text-[var(--on-icon-disc-inverse)]"],
    ] as const)("tone %s paints %s with %s", (tone, fill, glyph) => {
        render(<IconButton icon={<svg aria-hidden="true" />} label="Act" tone={tone} />);
        const cls = screen.getByRole("button").className;
        expect(cls).toContain(fill);
        expect(cls).toContain(glyph);
    });

    it("AUTM-1838: strong is the lime disc, never ink", () => {
        render(<IconButton icon={<svg aria-hidden="true" />} label="Send message" variant="strong" />);
        const cls = screen.getByRole("button").className;
        expect(cls).toContain("bg-[var(--lime)]");
        expect(cls).not.toMatch(/--strong\)/);
    });

    it("maps the pre-1756 variants onto tones", () => {
        expect(resolveIconButtonTone(undefined, "quiet")).toBe("neutral");
        expect(resolveIconButtonTone(undefined, "ghost")).toBe("neutral");
        expect(resolveIconButtonTone(undefined, "strong")).toBe("primary");
        expect(resolveIconButtonTone(undefined, "ondeep")).toBe("ondark");
        expect(resolveIconButtonTone("danger", "strong")).toBe("danger");
    });

    it.each([
        ["sm", "size-9", "[&_svg]:size-[1.125rem]"],
        ["lg", "size-13", "[&_svg]:size-6"],
    ] as const)("size %s draws %s with %s", (size, disc, glyph) => {
        render(<IconButton icon={<svg aria-hidden="true" />} label="Act" size={size} />);
        const cls = screen.getByRole("button").className;
        expect(cls).toContain(disc);
        expect(cls).toContain(glyph);
    });

    it("sm keeps a 44px target: the unpainted hit area", () => {
        render(<IconButton icon={<svg aria-hidden="true" />} label="Act" size="sm" />);
        expect(screen.getByRole("button").className).toMatch(/\bicon-disc-hit\b/);
        const css = readFileSync(join(__dirname, "..", "utilities", "icon-disc.css"), "utf8");
        expect(css).toMatch(/\.icon-disc-hit::after\s*\{[^}]*width:\s*max\(100%, 2\.75rem\)/);
        expect(css).toMatch(/\.icon-disc-hit::after\s*\{[^}]*height:\s*max\(100%, 2\.75rem\)/);
    });

    it("a caller's position wins over the disc's own `relative`", () => {
        render(<IconButton icon={<svg aria-hidden="true" />} label="Close" className="absolute right-3 top-3" />);
        const cls = screen.getByRole("button").className;
        expect(cls).toMatch(/\babsolute\b/);
        expect(cls).not.toMatch(/(^|\s)relative(\s|$)/);
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

    it("fires onClick and honours disabled, keeping its real fill (AUTM-1719)", async () => {
        const onClick = vi.fn();
        const { rerender } = render(<IconButton icon={<svg />} label="Remove" onClick={onClick} />);
        await userEvent.click(screen.getByRole("button"));
        expect(onClick).toHaveBeenCalledTimes(1);
        rerender(<IconButton icon={<svg />} label="Remove" onClick={onClick} disabled />);
        await userEvent.click(screen.getByRole("button"));
        expect(onClick).toHaveBeenCalledTimes(1);
        const cls = screen.getByRole("button").className;
        expect(cls).toContain("bg-[var(--icon-disc)]");
        expect(cls).not.toMatch(/opacity-\d/);
    });

    it("composes with a link through asChild, filling the empty element", () => {
        render(
            <IconButton asChild icon={<svg aria-hidden="true" data-testid="glyph" />} label="Edit service">
                <a href="/services/1/edit" />
            </IconButton>,
        );
        const link = screen.getByRole("link", { name: "Edit service" });
        expect(link).toHaveAttribute("href", "/services/1/edit");
        expect(link.className).toContain("bg-[var(--icon-disc)]");
        expect(link).toContainElement(screen.getByTestId("glyph"));
    });

    it("iconDiscClasses gives a non-button control the same disc", () => {
        const cls = iconDiscClasses({ tone: "ondark", size: "lg" });
        expect(cls).toContain("icon-disc");
        expect(cls).toContain("bg-[var(--icon-disc-ondark)]");
        expect(cls).toContain("size-13");
    });
});

describe("CloseButton (AUTM-1756)", () => {
    it("is the neutral 44px disc with a cross, named Close by default", () => {
        render(<CloseButton />);
        const button = screen.getByRole("button", { name: "Close" });
        expect(button.className).toContain("size-11");
        expect(button.className).toContain("bg-[var(--icon-disc)]");
        expect(button.querySelector("svg path")?.getAttribute("d")).toBe("M6 6l12 12M18 6L6 18");
    });

    it("takes the overlay's own name", () => {
        render(<CloseButton label="Close dialog" />);
        expect(screen.getByRole("button", { name: "Close dialog" })).toBeInTheDocument();
    });
});
