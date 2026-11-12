import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RowActions } from "./RowActions";

/**
 * AUTM-1787: which controls render is CSS (a container query); these pin the
 * contract the markup carries: names, targets, test ids, links and the menu.
 */
const icon = <svg aria-hidden="true" />;

describe("RowActions", () => {
  it("renders nothing for no actions", () => {
    const { container } = render(<RowActions actions={[]} menuLabel="More" />);
    expect(container.firstChild).toBeNull();
  });

  it("names each inline control for its object and fires it", async () => {
    const onSelect = vi.fn();
    render(
      <RowActions
        menuLabel="More actions for invoice INV-1"
        actions={[{ id: "download", label: "Download", accessibleLabel: "Download invoice INV-1", icon, onSelect, testId: "row-download" }]}
      />,
    );
    const button = screen.getByRole("button", { name: "Download invoice INV-1" });
    expect(button).toHaveAttribute("data-testid", "row-download");
    expect(button.className).toMatch(/\bmin-h-11\b/);
    await userEvent.click(button);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("renders a link action as a link, for tel: and sms:", () => {
    render(
      <RowActions
        menuLabel="Contact Alex"
        actions={[{ id: "call", label: "Call", accessibleLabel: "Call Alex", icon, href: "tel:+61400111000" }]}
      />,
    );
    expect(screen.getByRole("link", { name: "Call Alex" })).toHaveAttribute("href", "tel:+61400111000");
  });

  it("offers the same actions in a named menu", async () => {
    const onSelect = vi.fn();
    render(
      <RowActions
        menuLabel="More actions for invoice INV-1"
        menuTestId="row-menu"
        actions={[
          { id: "download", label: "Download", accessibleLabel: "Download invoice INV-1", icon, onSelect, menuTestId: "row-menu-download" },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "More actions for invoice INV-1" }));
    const item = await screen.findByTestId("row-menu-download");
    await userEvent.click(item);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
