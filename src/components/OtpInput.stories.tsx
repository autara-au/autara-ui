import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "./Button";
import { GlassEdgeTracker } from "./GlassEdge";
import { OtpInput, type OtpInputProps } from "./OtpInput";

/**
 * AUTM-2140 R2, Don's pick A1 "One field, six slots" (portal review,
 * 2026-11-14): one glass pill, six borderless slots split 3 and 3. The whole
 * pill takes the accent focus edge, or the danger edge when `invalid`; the
 * current slot takes a soft accent tint and a caret; an empty slot shows a
 * dot. Check every story in both themes (the toolbar's Theme).
 *
 * OtpInput is controlled, so every story wraps it in a tiny stateful host.
 * `seed` pre-fills the slots; `focusAt` puts the caret in a slot on mount,
 * the way the field looks while a code is being typed.
 */
function ControlledOtp({
  seed = "",
  length,
  invalid,
  disabled,
  autoFocus = false,
  focusAt,
  showValue = true,
}: {
  seed?: string;
  length?: OtpInputProps["length"];
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  focusAt?: number;
  showValue?: boolean;
}) {
  const [code, setCode] = useState(seed);
  const [done, setDone] = useState<string | null>(
    seed.length === (length ?? 6) ? seed : null,
  );
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focusAt === undefined) return;
    ref.current?.querySelectorAll("input")[focusAt]?.focus();
  }, [focusAt]);
  return (
    <div ref={ref} className="grid w-full gap-3">
      <OtpInput
        value={code}
        onChange={(c) => {
          setCode(c);
          setDone(null);
        }}
        onComplete={setDone}
        length={length}
        invalid={invalid}
        disabled={disabled}
        autoFocus={autoFocus}
      />
      {showValue ? (
        <p className="text-[0.8125rem] text-[var(--text-muted)]">
          {done ? `Completed: ${done}` : `Value: ${code || "nothing yet"}`}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The sign-in column (28rem) on the room's band, as A1 draws it: white glass
 * on white paper all but vanishes at rest, which is why a consumer re-points
 * `--field-glass` on a white surface (see the Glass fields gotcha).
 */
function Column({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-[31rem] rounded-[1.5rem] bg-[var(--band)] p-6 text-[var(--text-strong)]">
      {children}
    </div>
  );
}

const meta = {
  title: "Forms/OtpInput",
  component: OtpInput,
  parameters: { layout: "padded" },
  // Required props live here so the render-based stories below don't each
  // have to restate them (the stories drive state via ControlledOtp).
  args: { value: "", onChange: () => {} },
} satisfies Meta<typeof OtpInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Empty and focused: type or paste a code; `onComplete` fires on the 6th digit. */
export const Default: Story = {
  render: () => (
    <Column>
      <ControlledOtp autoFocus />
    </Column>
  ),
};

/** At rest, nothing typed and not focused: six dots on the glass. */
export const AtRest: Story = {
  render: () => (
    <Column>
      <ControlledOtp />
    </Column>
  ),
};

/** Mid-entry: three digits in, the fourth slot current (tint and caret), the pill on the focus edge. */
export const MidEntry: Story = {
  render: () => (
    <Column>
      <ControlledOtp seed="482" focusAt={3} />
    </Column>
  ),
};

/**
 * A wrong code: the consumer remounts the field (a new `key`) so it is
 * cleared and back on the first slot, and passes `invalid` for the danger
 * edge until the next digit. The message is the consumer's.
 */
export const WrongCode: Story = {
  render: () => (
    <Column>
      <ControlledOtp invalid autoFocus showValue={false} />
      <p role="alert" className="mt-2 text-[0.875rem] text-[var(--danger)]">
        That code didn&apos;t match. Try again, or send a new code.
      </p>
    </Column>
  ),
};

/** All six in: `onComplete` has fired and the field checks itself, no tap needed. */
export const Complete: Story = {
  render: () => (
    <Column>
      <ControlledOtp seed="482915" focusAt={5} />
    </Column>
  ),
};

/** Disabled while the code is checked: dimmed, no light, no input. */
export const Disabled: Story = {
  render: () => (
    <Column>
      <ControlledOtp seed="482915" disabled />
    </Column>
  ),
};

/** Configurable length: four slots split 2 and 2. */
export const FourDigit: Story = {
  render: () => (
    <Column>
      <ControlledOtp length={4} autoFocus />
    </Column>
  ),
};

/**
 * A 375px phone (343 wide inside 16px gutters): the slots shrink toward
 * 44px and keep one row. On a 320px phone the threes stack.
 */
export const Phone: Story = {
  render: () => (
    <div className="grid w-fit gap-8 rounded-[1.5rem] bg-[var(--band)] p-4 text-[var(--text-strong)]">
      <div className="w-[21.4375rem]">
        <ControlledOtp seed="48" focusAt={2} />
      </div>
      <div className="w-[18rem]">
        <ControlledOtp seed="48" />
      </div>
    </div>
  ),
};

function LargeText({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const was = root.style.fontSize;
    root.style.fontSize = "200%";
    return () => {
      root.style.fontSize = was;
    };
  }, []);
  return <>{children}</>;
}

/**
 * 200% text: everything is rem, so the slots, the digit and the query that
 * stacks them all double. On a phone the threes stack; in an iPad column
 * they keep one row. Nothing is cut off.
 */
export const LargeText200: Story = {
  render: () => (
    <LargeText>
      <div className="grid gap-8 rounded-[1.5rem] bg-[var(--band)] p-4 text-[var(--text-strong)]">
        <div className="w-[390px] max-w-full">
          <ControlledOtp seed="4829" />
        </div>
        <div className="w-[700px] max-w-full">
          <ControlledOtp seed="4829" />
        </div>
      </div>
    </LargeText>
  ),
};

/**
 * In context: the portal's "Check your email" step as A1 draws it. The one
 * lime Continue (the manual fallback and the busy state, since a complete
 * code submits itself), then the two ways out as quiet text buttons on one
 * line, their words unchanged (QA locates by them). Move the cursor across
 * the pill for the lit edge.
 */
export const InContext: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="min-h-screen bg-[var(--band)] px-4 py-12 text-[var(--text-strong)]">
      <GlassEdgeTracker />
      <div className="mx-auto grid w-full max-w-[28rem] gap-8">
        <div>
          <h2>
            <span className="block text-[2.125rem] leading-tight font-bold">
              Check your email
            </span>
          </h2>
          <p className="mt-3 text-base text-[var(--text-muted)]">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-[var(--text-strong)]">
              alex@shinebay.com.au
            </span>
            .
          </p>
        </div>
        <form className="grid gap-4" onSubmit={(e) => e.preventDefault()}>
          <ControlledOtp autoFocus showValue={false} />
          <Button type="submit" variant="primary" size="lg" fullWidth>
            Continue
          </Button>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1">
            <Button type="button" variant="ghost" size="sm">
              Send a new code
            </Button>
            <Button type="button" variant="ghost" size="sm">
              Use a different email or phone
            </Button>
          </div>
        </form>
      </div>
    </div>
  ),
};
