import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SplitPane } from "./SplitPane";

/**
 * AUTM-1755: the splitter's contract. jsdom has no layout, so the split is
 * given a 1200px width; at a 16px root the bounds are then 320px (20rem) to
 * 624px (1200 less the record's 36rem), and the default is 400px (30% is
 * 360, under the 25rem default floor).
 */
const KEY = "test.split.width";

function renderSplit(props: Partial<Parameters<typeof SplitPane>[0]> = {}) {
  return render(
    <SplitPane
      label="Resize the list"
      storageKey={KEY}
      testId="inbox-split"
      primary={<p>List</p>}
      secondary={<p>Record</p>}
      {...props}
    />,
  );
}

describe("SplitPane", () => {
  let width: PropertyDescriptor | undefined;
  beforeEach(() => {
    width = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
    Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get: () => 1200 });
    window.localStorage.clear();
  });
  afterEach(() => {
    if (width) Object.defineProperty(HTMLElement.prototype, "clientWidth", width);
    vi.restoreAllMocks();
  });

  it("is a named, focusable vertical separator with its bounds", () => {
    renderSplit();
    const handle = screen.getByRole("separator", { name: "Resize the list" });
    expect(handle).toHaveAttribute("tabindex", "0");
    expect(handle).toHaveAttribute("aria-orientation", "vertical");
    expect(handle).toHaveAttribute("aria-valuenow", "400");
    expect(handle).toHaveAttribute("aria-valuemin", "320");
    expect(handle).toHaveAttribute("aria-valuemax", "624");
    expect(handle).toHaveAttribute("aria-valuetext", "33% of the width");
    expect(handle).toHaveAttribute("data-testid", "inbox-split-resize");
    expect(handle.getAttribute("aria-controls")).toBe(screen.getByTestId("inbox-split-list").id);
  });

  it("moves by a step on the arrows, four with Shift, and remembers it", () => {
    renderSplit();
    const handle = screen.getByRole("separator");
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(handle).toHaveAttribute("aria-valuenow", "416");
    fireEvent.keyDown(handle, { key: "ArrowLeft", shiftKey: true });
    expect(handle).toHaveAttribute("aria-valuenow", "352");
    expect(window.localStorage.getItem(KEY)).toBe("22");
  });

  it("goes to the bounds on Home and End, and no further", () => {
    renderSplit();
    const handle = screen.getByRole("separator");
    fireEvent.keyDown(handle, { key: "End" });
    expect(handle).toHaveAttribute("aria-valuenow", "624");
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(handle).toHaveAttribute("aria-valuenow", "624");
    fireEvent.keyDown(handle, { key: "Home" });
    expect(handle).toHaveAttribute("aria-valuenow", "320");
    fireEvent.keyDown(handle, { key: "ArrowLeft" });
    expect(handle).toHaveAttribute("aria-valuenow", "320");
  });

  it("leaves Up and Down to the page", () => {
    renderSplit();
    const handle = screen.getByRole("separator");
    const event = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });
    handle.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(handle).toHaveAttribute("aria-valuenow", "400");
  });

  it("starts from the remembered width, held inside the bounds", () => {
    window.localStorage.setItem(KEY, "30");
    renderSplit();
    expect(screen.getByRole("separator")).toHaveAttribute("aria-valuenow", "480");
  });

  it("resets to the default on double-click and forgets the width", () => {
    window.localStorage.setItem(KEY, "30");
    renderSplit();
    const handle = screen.getByRole("separator");
    fireEvent.doubleClick(handle);
    expect(handle).toHaveAttribute("aria-valuenow", "400");
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it("still works when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    renderSplit();
    const handle = screen.getByRole("separator");
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(handle).toHaveAttribute("aria-valuenow", "416");
  });

  it("ignores a garbage stored value", () => {
    window.localStorage.setItem(KEY, "wide");
    renderSplit();
    expect(screen.getByRole("separator")).toHaveAttribute("aria-valuenow", "400");
  });

  it("sizes the list with CSS before it is measured", () => {
    renderSplit();
    expect(screen.getByTestId("inbox-split-list").style.width).toContain("clamp(20rem");
  });

  // AUTM-1878 follow-up: a side panel at the end, sized by the same splitter.
  describe('side="end"', () => {
    const panel = (props: Partial<Parameters<typeof SplitPane>[0]> = {}) =>
      renderSplit({
        side: "end",
        label: "Resize the booking panel",
        testId: "inbox-panel-split",
        defaultFraction: 0,
        defaultMinRem: 24,
        defaultMaxRem: 24,
        minRem: 20,
        maxRem: 36,
        secondaryMinRem: 30,
        ...props,
      });

    it("sizes the end pane, which comes after the line, and names it", () => {
      panel();
      const handle = screen.getByRole("separator", { name: "Resize the booking panel" });
      expect(handle).toHaveAttribute("aria-valuenow", "384");
      expect(handle).toHaveAttribute("aria-valuemin", "320");
      expect(handle).toHaveAttribute("aria-valuemax", "576");
      const sized = screen.getByTestId("inbox-panel-split-panel");
      expect(handle.getAttribute("aria-controls")).toBe(sized.id);
      expect(sized).toHaveTextContent("Record");
      expect(screen.getByTestId("inbox-panel-split-main")).toHaveTextContent("List");
      // The panel is the last of the three, after the line.
      expect(handle.compareDocumentPosition(sized) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("follows the line: Left widens the panel, Right narrows it, Home and End are its bounds", () => {
      panel();
      const handle = screen.getByRole("separator");
      fireEvent.keyDown(handle, { key: "ArrowLeft" });
      expect(handle).toHaveAttribute("aria-valuenow", "400");
      fireEvent.keyDown(handle, { key: "ArrowRight", shiftKey: true });
      expect(handle).toHaveAttribute("aria-valuenow", "336");
      fireEvent.keyDown(handle, { key: "End" });
      expect(handle).toHaveAttribute("aria-valuenow", "576");
      fireEvent.keyDown(handle, { key: "Home" });
      expect(handle).toHaveAttribute("aria-valuenow", "320");
      expect(window.localStorage.getItem(KEY)).toBe("20");
      fireEvent.doubleClick(handle);
      expect(handle).toHaveAttribute("aria-valuenow", "384");
      expect(window.localStorage.getItem(KEY)).toBeNull();
    });
  });
});
