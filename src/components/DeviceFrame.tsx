import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/**
 * DeviceFrame — a phone or tablet bezel around a real product screen.
 *
 * AUTM-1425. Marketing pages show Autara's screens inside a device: the
 * customer waitlist hero (a merchant profile as a customer sees it) and the
 * "Run a detailing business?" band (the merchant Today screen). Both pages
 * were about to hand-draw the same bezel, so it lives here once.
 *
 * What it is NOT: a device illustration. There is no camera notch, no
 * buttons, no drop shadow (rule 4). Depth is the ink body plus the 1px inset
 * highlight every glass surface carries, the same device the site uses for
 * depth everywhere else. The screen is whatever the consumer puts inside,
 * usually an <img> of a captured screen at the device's own aspect ratio;
 * the frame never scales or crops it beyond clipping to the screen radius,
 * so what is shown is what the product renders.
 *
 * Aspect ratios are the ones the screens are captured at: a 390x844 phone
 * viewport and a 1194x834 tablet viewport (iPad Pro 11", the merchant
 * app's primary target).
 */
export type DeviceKind = "phone" | "tablet";

export interface DeviceFrameProps {
  kind?: DeviceKind;
  /** The screen content, sized by the consumer to the frame's aspect. */
  children: ReactNode;
  /** Accessible name for the whole device when the screen is decorative. */
  label?: string;
  className?: string;
}

const ASPECT: Record<DeviceKind, string> = {
  phone: "aspect-[390/844]",
  tablet: "aspect-[1194/834]",
};

/* Bezel and screen radii sit on the ladder relative to each other: the
 * screen radius is the bezel radius minus the bezel width, so the two curves
 * are concentric rather than the screen looking pinched in its corners. */
const SHAPE: Record<DeviceKind, { frame: string; screen: string; pad: string }> = {
  phone: { frame: "rounded-[2.75rem]", screen: "rounded-[2.25rem]", pad: "p-2" },
  tablet: { frame: "rounded-[1.75rem]", screen: "rounded-[1.25rem]", pad: "p-2" },
};

export function DeviceFrame({ kind = "phone", children, label, className }: DeviceFrameProps) {
  const shape = SHAPE[kind];
  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      className={cn(
        "relative box-border w-full bg-[var(--text-strong)] text-[var(--background)]",
        ASPECT[kind],
        shape.frame,
        shape.pad,
        className,
      )}
      style={{ boxShadow: "inset 0 1px 0 var(--glass-hi)" }}
      data-device={kind}
    >
      <div className={cn("relative h-full w-full overflow-hidden bg-[var(--background)]", shape.screen)}>
        {children}
      </div>
    </div>
  );
}
