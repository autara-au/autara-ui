/// <reference types="@vitest/browser/providers/playwright" />
/**
 * In a real browser, because what runs where (an animation's target, its
 * clock) and what the stylesheet draws on its own are things jsdom does not do.
 *
 * AUTM-2042 (Don, 2026-11-08: "intial loading spin still feels like
 * lagging"). On a cold start the bundle blocks the main thread for 650ms
 * inside the one-second arrival. The rays were SVG `<g>`s, each with two
 * transform animations whose keyframes read `var()`; Chrome kept those on the
 * main thread, so the rays froze unseen and then snapped to rest, and WebKit
 * (the iPad app) composites no SVG child at all. Every moving part is now an
 * HTML span, one transform animation per element, no `var()` in a keyframe.
 */
import "../../.storybook/storybook.css";
import splashCss from "../utilities/splash.css?raw";
import { renderToStaticMarkup } from "react-dom/server";
import { cleanup, render } from "@testing-library/react";
import { commands } from "@vitest/browser/context";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AutaraSplash } from "./AutaraSplash";
import { AutaraSplashScreen } from "./AutaraSplashScreen";

declare module "@vitest/browser/context" {
    interface BrowserCommands {
        reducedMotion: (on: boolean) => Promise<void>;
    }
}

const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("AutaraSplash in a browser (AUTM-2042)", () => {
    beforeEach(async () => {
        await commands.reducedMotion(false);
    });
    afterEach(async () => {
        cleanup();
        await commands.reducedMotion(false);
    });

    it("animates HTML elements only, one transform animation on each", async () => {
        const { container } = render(<AutaraSplash decorative />);
        await frame();
        const anims = (container.firstElementChild as HTMLElement).getAnimations({ subtree: true }) as CSSAnimation[];
        // The turn, eight settles, eight drifts, the ring, eight dims, eight glows.
        expect(anims).toHaveLength(34);
        const transformsOn = new Map<Element, number>();
        for (const a of anims) {
            const target = (a.effect as KeyframeEffect).target!;
            expect(target instanceof HTMLElement, `${a.animationName} on <${target.tagName}>`).toBe(true);
            const props = (a.effect as KeyframeEffect).getKeyframes().flatMap((k) => Object.keys(k));
            if (props.includes("transform")) transformsOn.set(target, (transformsOn.get(target) ?? 0) + 1);
        }
        for (const [el, n] of transformsOn) expect(n, el.className).toBe(1);
        expect(anims[0].animationName).toBe("autara-splash-turn");
    });

    it("draws the mark from splash.css alone, as the pre-JS shell does", async () => {
        // Held still, so the boxes measured are the layout's, not mid-turn.
        await commands.reducedMotion(true);
        const iframe = document.createElement("iframe");
        iframe.style.cssText = "width:300px;height:300px;border:0";
        document.body.append(iframe);
        try {
            const doc = iframe.contentDocument!;
            doc.open();
            doc.write(
                `<!doctype html><html><head><style>body{margin:0;background:#2e1070}${splashCss}</style></head><body>` +
                    `<div style="padding:20px">${renderToStaticMarkup(<AutaraSplash size={96} on="deep" />)}</div></body></html>`,
            );
            doc.close();
            await wait(50);
            const root = doc.querySelector<HTMLElement>(".autara-splash")!;
            const box = root.getBoundingClientRect();
            expect(box.width).toBeCloseTo(96, 0);
            expect(box.height).toBeCloseTo(96, 0);
            // Every layer is the whole mark, so it turns and scales about its centre.
            for (const el of doc.querySelectorAll<HTMLElement>(".autara-splash-frame, .autara-splash-frame span, .autara-splash-frame svg")) {
                const b = el.getBoundingClientRect();
                expect([b.width, b.height], el.className || el.tagName).toEqual([box.width, box.height]);
            }
            const win = iframe.contentWindow!;
            const path = doc.querySelector(".autara-splash-ray-base path")!;
            expect(win.getComputedStyle(path).fill).toBe("rgb(255, 255, 255)");
            expect(win.getComputedStyle(doc.querySelector(".autara-splash-ring circle")!).stroke).toBe("rgb(255, 255, 255)");
            // The label stays for a screen reader without Tailwind's sr-only.
            const label = doc.querySelector<HTMLElement>(".autara-splash-label")!;
            expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(1);
        } finally {
            iframe.remove();
        }
    });

    it("hands over after the arrival at the time actually played, not the turn's end", async () => {
        // A splash React never mounted the hook on, as the static shell is.
        render(<AutaraSplash decorative />);
        await frame();
        await wait(1300);
        const { container } = render(<AutaraSplashScreen position="fill" />);
        const mark = container.querySelector<HTMLElement>(".autara-splash");
        const t0 = -parseFloat(mark!.style.getPropertyValue("--autara-splash-t0"));
        // The turn finished at 900ms and holds its clock there; the glow does not.
        expect(t0).toBeGreaterThan(1250);
        expect(t0).toBeLessThan(2500);
    });
});
