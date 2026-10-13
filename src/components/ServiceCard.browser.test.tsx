/// <reference types="@vitest/browser/providers/playwright" />
/**
 * AUTM-1786, in a real browser: a press anywhere on a ServiceCard is the
 * card's. jsdom cannot test this, because the bug lives in the browser's hit
 * test: the card is one link (or one radio) whose hit area is the name's
 * `::after`, stretched over the card, and anything that moves or shrinks that
 * `::after` between the button going down and coming up sends the click to a
 * plain element, so nothing opens and nothing is selected.
 *
 * Found on qa.autara.au/m/wish-car-care: customer-web scales every `a[href]`
 * to 98.5% while it is pressed. A scaled element is the containing block of
 * its absolutely positioned descendants, so the moment the name link pressed,
 * its `::after` shrank from the card to the name, and the release landed on
 * the photo. Only a press on the name itself still opened booking.
 */
import "../../.storybook/storybook.css";
import { forwardRef, useState, type AnchorHTMLAttributes, type MouseEvent } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { commands, page, userEvent } from "@vitest/browser/context";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceCard } from "./ServiceCard";

declare module "@vitest/browser/context" {
    interface BrowserCommands {
        pressAt: (
            selector: string,
            options?: { fx?: number; fy?: number; holdMs?: number; pointer?: "mouse" | "touch" },
        ) => Promise<void>;
    }
}

/* customer-web's own press rule (src/components/waitlist-aw/waitlist.css on
 * 2026-10-09), unlayered as it is there, scoped to the fixture. It is what
 * broke the card on QA, so the tests run the card under it. */
const CONSUMER_PRESS = `
.consumer-press :is(a[href], button, summary, [role="button"], label:has(input[type="radio"], input[type="checkbox"])) {
  transition-property: color, background-color, border-color, text-decoration-color, opacity, translate, scale;
  transition-duration: 120ms;
}
@media (prefers-reduced-motion: no-preference) {
  .consumer-press :is(button:not(:disabled), [role="button"]:not([aria-disabled="true"])):active { scale: 0.97; }
  .consumer-press :is(a[href], summary, label:has(input[type="radio"]:not(:disabled), input[type="checkbox"]:not(:disabled))):active { scale: 0.985; }
}
/* Consumer CSS the card cannot predict: a positioned heading confines the
   name's ::after to the heading, so the photo is no longer under it at all. */
.consumer-positioned :is(h2, h3) { position: relative; }
`;

const LONG =
    "Hot-water extraction on carpets and cloth seats, leather cleaned and conditioned, headliner spot-cleaned, every vent and seam steamed, glass inside and out.";

/* A data: image, so the photo is a real <img> under the hit area without a
 * network request. */
const PHOTO =
    "data:image/svg+xml;utf8," +
    encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="6"><rect width="8" height="6" fill="#7a6a58"/></svg>');

/**
 * Next's Link handles the click itself and cancels the browser's own. So does
 * this, and it records where it went and whose click it was: the browser's
 * own (the stretched hit area worked), or one the card forwarded (its
 * backstop caught a press the hit area missed).
 */
let opened: string[] = [];
const BOOK = "/m/wish-car-care/book/checkout?serviceId=interior";
const FORWARDED = `${BOOK} (forwarded)`;
const RecordingLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(function RecordingLink(
    { onClick, ...props },
    ref,
) {
    return (
        <a
            ref={ref}
            {...props}
            onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                onClick?.(event);
                event.preventDefault();
                opened.push(`${props.href ?? ""}${event.nativeEvent.isTrusted ? "" : " (forwarded)"}`);
            }}
        />
    );
});

const SERVICES = [
    { id: "wash", name: "Exterior hand wash" },
    { id: "interior", name: "Interior steam clean" },
    { id: "wheels", name: "Wheels off, barrels and calipers" },
];

/* The pro page and the picker as customer-web lays them out: one column of
 * rows on a phone, tiles from 640px. */
function LinkMenu({ scope = "" }: { scope?: string }) {
    return (
        <ul className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${scope}`}>
            {SERVICES.map((s, i) => (
                <li key={s.id} className="flex flex-col">
                    <ServiceCard
                        layout="adaptive"
                        name={s.name}
                        description={LONG}
                        coverImageUrl={PHOTO}
                        durationLabel="2 hr"
                        priceLabel="$188.82"
                        priceLines={[
                            { label: "Service", value: "$180" },
                            { label: "+ booking fee", value: "$8.82" },
                        ]}
                        href={`/m/wish-car-care/book/checkout?serviceId=${s.id}`}
                        as={RecordingLink}
                        actionLabel="Book"
                        revealIndex={i}
                        testId={`card-${s.id}`}
                        testIds={{ price: `price-${s.id}`, descriptionToggle: `more-${s.id}` }}
                    />
                </li>
            ))}
        </ul>
    );
}

function Picker({ onSelect, scope = "" }: { onSelect: (id: string) => void; scope?: string }) {
    const [chosen, setChosen] = useState<string | null>(null);
    return (
        <ul className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${scope}`}>
            {SERVICES.map((s, i) => (
                <li key={s.id} className="flex flex-col">
                    <ServiceCard
                        layout="adaptive"
                        nameAs="h2"
                        name={s.name}
                        description={LONG}
                        coverImageUrl={PHOTO}
                        durationLabel="2 hr"
                        priceLabel="$188.82"
                        groupName="service"
                        value={s.id}
                        selected={chosen === s.id}
                        onSelect={() => {
                            setChosen(s.id);
                            onSelect(s.id);
                        }}
                        revealIndex={i}
                        testId={`card-${s.id}`}
                        testIds={{ action: `radio-${s.id}`, price: `price-${s.id}`, descriptionToggle: `more-${s.id}` }}
                    />
                </li>
            ))}
        </ul>
    );
}

/** Marks a part of the second card so the press command can find it. */
function mark(region: "media" | "description" | "price") {
    const card = screen.getByTestId("card-interior");
    const el =
        region === "media"
            ? card.querySelector('[data-slot="media"]')
            : region === "price"
              ? screen.getByTestId("price-interior")
              : Array.from(card.querySelectorAll("p")).find((p) => p.textContent === LONG);
    if (!el) throw new Error(`no ${region} on the card`);
    el.setAttribute("data-press", region);
    return `[data-press="${region}"]`;
}

const REGIONS = ["media", "description", "price"] as const;
const WIDTHS = [390, 834, 1440] as const;

let style: HTMLStyleElement;
beforeEach(() => {
    opened = [];
    style = document.createElement("style");
    style.textContent = CONSUMER_PRESS;
    document.head.append(style);
});
afterEach(() => {
    cleanup();
    style.remove();
});

describe.each(WIDTHS)("ServiceCard at %ipx", (width) => {
    beforeEach(async () => {
        await page.viewport(width, 900);
    });

    describe("link mode, under customer-web's press rule", () => {
        it.each(REGIONS)("a press on the %s opens booking for that service", async (region) => {
            render(<LinkMenu scope="consumer-press" />);
            await commands.pressAt(mark(region));
            expect(opened).toEqual([BOOK]);
        });

        it("a tap on the photo opens booking", async () => {
            render(<LinkMenu scope="consumer-press" />);
            await commands.pressAt(mark("media"), { pointer: "touch" });
            expect(opened).toEqual([BOOK]);
        });

        it("More expands the description and opens nothing", async () => {
            render(<LinkMenu scope="consumer-press" />);
            await commands.pressAt('[data-testid="more-interior"]');
            expect(screen.getByTestId("more-interior").getAttribute("aria-expanded")).toBe("true");
            expect(opened).toEqual([]);
        });
    });

    it("a press held at the very edge of the card still opens booking (the card's own press)", async () => {
        render(<LinkMenu />);
        // About a pixel in from the left edge, held past the press transition.
        await commands.pressAt('[data-testid="card-interior"]', { fx: 0.003, holdMs: 400 });
        expect(opened).toEqual([BOOK]);
    });

    it("a press on the photo opens booking when consumer CSS confines the link's hit area", async () => {
        render(<LinkMenu scope="consumer-positioned" />);
        await commands.pressAt(mark("media"));
        expect(opened).toEqual([FORWARDED]);
    });

    describe("select mode (the booking picker), under customer-web's press rule", () => {
        it.each(REGIONS)("a press on the %s selects that service", async (region) => {
            const onSelect = vi.fn();
            render(<Picker onSelect={onSelect} scope="consumer-press" />);
            await commands.pressAt(mark(region));
            expect(onSelect).toHaveBeenCalledWith("interior");
            expect((screen.getByTestId("radio-interior") as HTMLInputElement).checked).toBe(true);
        });

        it("More expands the description and selects nothing", async () => {
            const onSelect = vi.fn();
            render(<Picker onSelect={onSelect} scope="consumer-press" />);
            await commands.pressAt('[data-testid="more-interior"]');
            expect(screen.getByTestId("more-interior").getAttribute("aria-expanded")).toBe("true");
            expect(onSelect).not.toHaveBeenCalled();
        });

        it("a press held at the very edge of the card still selects it", async () => {
            const onSelect = vi.fn();
            render(<Picker onSelect={onSelect} />);
            await commands.pressAt('[data-testid="card-interior"]', { fx: 0.003, holdMs: 400 });
            expect(onSelect).toHaveBeenCalledWith("interior");
        });
    });
});

describe("ServiceCard from the keyboard", () => {
    it("Enter on the link opens booking", async () => {
        render(<LinkMenu scope="consumer-press" />);
        screen.getByRole("link", { name: "Interior steam clean" }).focus();
        await userEvent.keyboard("{Enter}");
        expect(opened).toEqual([BOOK]);
    });

    it("Space on the radio selects the service", async () => {
        const onSelect = vi.fn();
        render(<Picker onSelect={onSelect} scope="consumer-press" />);
        screen.getByRole("radio", { name: "Interior steam clean" }).focus();
        await userEvent.keyboard(" ");
        expect(onSelect).toHaveBeenCalledWith("interior");
    });
});

describe("ServiceCard at rest", () => {
    it("the hit area is exactly the card, so it never makes a page scroll sideways", () => {
        render(<LinkMenu />);
        const link = screen.getByRole("link", { name: "Interior steam clean" });
        const card = screen.getByTestId("card-interior").getBoundingClientRect();
        const after = getComputedStyle(link, "::after");
        expect([after.top, after.right, after.bottom, after.left]).toEqual(["0px", "0px", "0px", "0px"]);
        expect(getComputedStyle(link).scale).toBe("none");
        expect(card.width).toBeGreaterThan(0);
    });
});

describe("ServiceCard with a plain anchor", () => {
    it("a press on the photo navigates the browser itself", async () => {
        const before = window.location.hash;
        render(
            <div className="consumer-press max-w-sm">
                <ServiceCard
                    name="Exterior hand wash"
                    description={LONG}
                    coverImageUrl={PHOTO}
                    priceLabel="$80"
                    layout="vertical"
                    href="#booked-wash"
                    testId="card-plain"
                />
            </div>,
        );
        await commands.pressAt('[data-testid="card-plain"] [data-slot="media"]');
        expect(window.location.hash).toBe("#booked-wash");
        window.location.hash = before;
    });
});

/**
 * AUTM-1848: More used to appear only after hydration, as a row of its own,
 * so the first card's text block grew and its price moved down on every load
 * of /m with a long description (CLS 0.0016, the page's whole CLS). Here the
 * server's HTML goes in first and is painted, then React hydrates it, and the
 * cards must not move: same boxes, and no layout-shift entry from inside
 * them, while More does appear.
 */
describe.each([390, 412, 1440] as const)("ServiceCard hydrating at %ipx (AUTM-1848)", (width) => {
    const frames = () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

    function boxes(root: HTMLElement) {
        return Array.from(root.querySelectorAll<HTMLElement>('[data-slot="service-card"], [data-testid^="price-"]')).map(
            (el) => {
                const r = el.getBoundingClientRect();
                return { id: el.dataset.testid, top: r.top, height: r.height, width: r.width };
            },
        );
    }

    it.each(["adaptive", "vertical"] as const)("a %s card keeps its box when More arrives", async (layout) => {
        await page.viewport(width, 900);
        const { renderToString } = await import("react-dom/server");
        const { hydrateRoot } = await import("react-dom/client");
        const { act } = await import("react");

        const menu = (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {SERVICES.map((s) => (
                    <li key={s.id} className="flex flex-col">
                        <ServiceCard
                            layout={layout}
                            name={s.name}
                            description={LONG}
                            coverImageUrl={PHOTO}
                            durationLabel="2 hr"
                            priceLabel="$188.82"
                            priceLines={[
                                { label: "Service", value: "$180" },
                                { label: "+ booking fee", value: "$8.82" },
                            ]}
                            href={`/m/wish-car-care/book/checkout?serviceId=${s.id}`}
                            as={RecordingLink}
                            testId={`card-${s.id}`}
                            testIds={{ price: `price-${s.id}`, descriptionToggle: `more-${s.id}` }}
                        />
                    </li>
                ))}
            </ul>
        );

        const host = document.createElement("div");
        document.body.append(host);
        host.innerHTML = renderToString(menu);
        // The server's HTML has the description and no More.
        expect(host.querySelector('[data-testid="more-interior"]')).toBeNull();
        await frames();
        const before = boxes(host);

        const shifts: string[] = [];
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as unknown as {
                value: number;
                sources?: { node?: Node | null }[];
            }[]) {
                const inside = (entry.sources ?? []).filter((s) => s.node && host.contains(s.node));
                if (inside.length > 0) {
                    shifts.push(
                        `${entry.value.toFixed(4)} from ${inside.map((s) => (s.node as Element).outerHTML?.slice(0, 80) ?? s.node?.nodeName).join(", ")}`,
                    );
                }
            }
        });
        observer.observe({ type: "layout-shift" });

        const root = await act(async () => hydrateRoot(host, menu));
        await frames();
        await frames();

        try {
            // More is there now.
            const more = host.querySelector<HTMLElement>('[data-testid="more-interior"]');
            expect(more).not.toBeNull();
            expect(more!.getAttribute("aria-expanded")).toBe("false");

            // And nothing moved for it.
            expect(boxes(host)).toEqual(before);
            await new Promise((resolve) => setTimeout(resolve, 50));
            expect(shifts).toEqual([]);

            // It sits over the end of the clamped second line.
            const text = more!.previousElementSibling as HTMLElement;
            expect(text.dataset.clamped).toBe("true");
            const m = more!.getBoundingClientRect();
            const t = text.getBoundingClientRect();
            expect(Math.abs(m.bottom - t.bottom)).toBeLessThan(1.5);
            expect(Math.abs(m.right - t.right)).toBeLessThan(1.5);
        } finally {
            observer.disconnect();
            act(() => root.unmount());
            host.remove();
        }
    });
});
