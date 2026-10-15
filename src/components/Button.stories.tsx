import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { FormField } from "./FormField";
import { Input } from "./Input";
import { SocialButton } from "./SocialButton";

/**
 * Button — canvas v44's "Buttons" (AUTM-1594), as amended by AUTM-1838
 * (Don, 2026-10-12: no black buttons anywhere; lime is the one primary
 * action on a screen, the rest are quiet secondaries).
 *
 *   - `primary`  lime with ink: the one action, on paper, band, sheets and
 *                dialogs alike. `strong` is now a name for it.
 *   - `quiet`    band: secondary choices
 *   - `danger`   band with red words: the destructive action. Never lime,
 *                never a red fill
 *   - `ondeep`   translucent white on a brand-deep hero
 *   - `link`     brand text, 44px tall
 *   - `ghost`    no fill, for toolbars (not on the sheet)
 *
 * Sizes: `sm` 44, `md` 48, `lg` 52; `icon` is a 44px disc (use IconButton).
 * Pills, by a radius of half each size's height. Legacy variant names still
 * render as their sheet equivalent. Flip the Theme toolbar for the dark sheet.
 */
const meta = {
  title: "Atoms/Button",
  component: Button,
  parameters: { layout: "centered" },
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["primary", "quiet", "danger", "ondeep", "ondeep-danger", "link", "ghost", "strong"],
    },
    size: { control: { type: "select" }, options: ["sm", "md", "lg"] },
    disabled: { control: "boolean" },
    busy: { control: "boolean" },
    fullWidth: { control: "boolean" },
  },
  args: { children: "Continue", variant: "primary", size: "md", disabled: false, busy: false },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/* The sheet's own glyphs, 18px at a 1.8 stroke. */
const Glyph = ({ children, size = 18 }: { children: ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const Calendar = () => (
  <Glyph>
    <rect x="4" y="5" width="16" height="15" rx="3" />
    <path d="M4 10h16" />
    <path d="M9 3v4" />
    <path d="M15 3v4" />
  </Glyph>
);
const Tag = () => (
  <Glyph>
    <path d="M4 12.5V5h7.5L20 13.5 13.5 20z" />
    <circle cx="8.5" cy="9" r="1.4" />
  </Glyph>
);
const Doc = () => (
  <Glyph>
    <path d="M7 3.5h7l4 4v13H7z" />
    <path d="M14 3.5v4h4" />
    <path d="M10 13h5M10 16.5h5" />
  </Glyph>
);
const Bell = () => (
  <Glyph size={20}>
    <path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 2h-14z" />
    <path d="M10 20.5h4" />
  </Glyph>
);
/* Stand-in for Badge variant="count" until the status family lands. */
const Count = ({ n }: { n: number }) => (
  <span className="inline-flex h-[1.375rem] min-w-[1.375rem] items-center justify-center rounded-full bg-[#e11d48] px-[0.4375rem] text-xs font-bold text-white">
    {n}
  </span>
);

export const Primary: Story = { args: { leadingIcon: <Calendar />, children: "New booking", size: "lg" } };
/** AUTM-1838: `strong` was the ink button. It is now a name for `primary`: lime. */
export const Strong: Story = { args: { variant: "strong", children: "Confirm" } };
export const Quiet: Story = { args: { variant: "quiet", children: "Add service", leadingIcon: <Tag /> } };
/** AUTM-1838: the destructive action. Red words on band, never lime, never a red fill. */
export const Danger: Story = { args: { variant: "danger", children: "Cancel booking" } };
export const Link: Story = { args: { variant: "link", size: "sm", children: "View all bookings" } };
export const Ghost: Story = { args: { variant: "ghost", children: "Skip" } };
export const Busy: Story = { args: { busy: true, children: "Save changes" } };

/**
 * AUTM-1708: every Button presses by default. Hold the pointer down: 97%, or
 * 98.5% when full width; a link does not shrink; `press={false}` opts out.
 * Off under reduced motion and while disabled or busy.
 */
export const Press: Story = {
  name: "Press, by default",
  render: () => (
    <div className="flex max-w-sm flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <Button>Book now</Button>
        <Button variant="quiet">Add service</Button>
        <Button variant="danger">Remove</Button>
      </div>
      <Button fullWidth size="lg">Pay the deposit (98.5%)</Button>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="link" size="sm">View all bookings (no press)</Button>
        <Button variant="quiet" press={false}>press=false</Button>
        <Button disabled>Disabled (still)</Button>
      </div>
    </div>
  ),
};
/**
 * AUTM-1719: a genuinely unavailable action keeps its real colour, is
 * disabled (aria-disabled, not-allowed cursor, no hover, no press) and says
 * why in text beside it, linked with aria-describedby. A `title` alone does
 * not reach touch or keyboard users.
 */
export const Disabled: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-2">
      <Button disabled aria-describedby="story-disabled-reason">New booking</Button>
      <p id="story-disabled-reason" className="m-0 text-sm text-[var(--text-muted)]">
        Finish your profile to take bookings.
      </p>
    </div>
  ),
};

const SHEET_VARIANTS = ["primary", "quiet", "danger", "ghost", "link"] as const;

/**
 * AUTM-1719 (Don, 2026-10-04): "don't mute the button colours even if
 * disabled, show the real colour, everywhere, also loading." Every variant at
 * rest, disabled and busy, light and dark: the three rows are the same
 * colours. Disabled differs only by the cursor, the absent hover and press,
 * and aria-disabled; busy by the turning mark and aria-busy.
 */
export const RealColourEveryState: Story = {
  name: "Real colour: rest, disabled, busy, both themes",
  render: () => (
    <div className="grid gap-4 xl:grid-cols-2">
      {[
        { label: "Light", theme: undefined },
        { label: "Dark", theme: "dark" as const },
      ].map((col) => (
        <div key={col.label} data-theme={col.theme} className="flex flex-col gap-3 rounded-autara-lg bg-[var(--background)] p-5">
          <p className="m-0 text-sm font-medium text-[var(--text-muted)]">{col.label}</p>
          {(["rest", "disabled", "busy"] as const).map((state) => (
            <div key={state} className="flex flex-wrap items-center gap-2">
              <span className="w-16 text-sm text-[var(--text-muted)]">{state}</span>
              {SHEET_VARIANTS.map((v) => (
                <Button key={v} variant={v} size="sm" disabled={state === "disabled"} busy={state === "busy"}>
                  {v}
                </Button>
              ))}
              <IconButton icon={<Bell />} label={`Notifications, ${state}`} disabled={state === "disabled"} busy={state === "busy"} />
            </div>
          ))}
          <div className="flex flex-col gap-2 rounded-autara-md bg-[var(--hero)] p-3">
            {(["rest", "disabled", "busy"] as const).map((state) => (
              <div key={state} className="flex gap-2">
                <Button size="sm" disabled={state === "disabled"} busy={state === "busy"}>View booking</Button>
                <Button size="sm" variant="ondeep" disabled={state === "disabled"} busy={state === "busy"}>Add to calendar</Button>
              </div>
            ))}
          </div>
          <div className="flex max-w-sm flex-col gap-2">
            <SocialButton provider="google" theme={col.theme ?? "light"} />
            <SocialButton provider="google" theme={col.theme ?? "light"} disabled />
            <SocialButton provider="google" theme={col.theme ?? "light"} busy />
          </div>
        </div>
      ))}
    </div>
  ),
};

/**
 * AUTM-1719 guidance: **a form's primary button is never disabled.** It stays
 * enabled and in full colour, and pressing it with something missing:
 *
 *   1. shows the inline message under the field (`FormField error`, which is
 *      `role="alert"`, so it is announced),
 *   2. moves focus to the first field that needs attention,
 *   3. does nothing else: no request, no busy state.
 *
 * With everything in place it goes busy (the turning mark over the label) and
 * submits. The switch from `disabled={!valid}` to this is the CONSUMER's: the
 * library cannot know what valid means for a form.
 *
 *     function onSubmit(e) {
 *         e.preventDefault()
 *         if (!isComplete(phone)) {
 *             setError('Enter your full mobile number')
 *             phoneRef.current?.focus()
 *             return
 *         }
 *         submit()
 *     }
 *     <form noValidate onSubmit={onSubmit}>
 *         <FormField label="Mobile number" error={error}><Input ref={phoneRef} ... /></FormField>
 *         <Button type="submit" busy={pending}>Continue</Button>
 *     </form>
 *
 * `noValidate` keeps the browser's own bubble out of it, so the message is
 * the product's, in the product's words. Clear the message as the person
 * types. Keep every `data-testid` where it was.
 */
export const ValidateOnPress: Story = {
  name: "Guidance: validate on press, never a disabled primary",
  render: function ValidateOnPressStory() {
    const [phone, setPhone] = useState("");
    const [error, setError] = useState<string>();
    const [pending, setPending] = useState(false);
    const [sent, setSent] = useState(false);
    const phoneRef = useRef<HTMLInputElement>(null);
    const digits = phone.replace(/\D/g, "");
    function onSubmit(e: FormEvent) {
      e.preventDefault();
      if (digits.length < 9) {
        setError("Enter your full mobile number");
        phoneRef.current?.focus();
        return;
      }
      setError(undefined);
      setPending(true);
      window.setTimeout(() => {
        setPending(false);
        setSent(true);
      }, 1500);
    }
    return (
      <form noValidate onSubmit={onSubmit} className="flex max-w-sm flex-col gap-4 text-[var(--text-strong)]">
        <h3 className="m-0 text-xl font-bold">Sign in</h3>
        <FormField label="Mobile number" error={error}>
          <Input
            ref={phoneRef}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0412 345 678"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (error) setError(undefined);
              setSent(false);
            }}
            data-testid="sign-in-phone"
          />
        </FormField>
        <Button type="submit" size="lg" fullWidth busy={pending} data-testid="sign-in-continue">
          Continue
        </Button>
        <p role="status" className="m-0 min-h-5 text-sm text-[var(--text-muted)]">
          {sent ? "We sent a code to your mobile." : ""}
        </p>
      </form>
    );
  },
};

/** On a brand-deep hero, lime leads and the rest are translucent white. */
export const OnBrandDeep: Story = {
  render: () => (
    <div className="flex gap-2 rounded-[1.25rem] bg-[var(--hero)] p-3.5">
      <Button>View booking</Button>
      <Button variant="ondeep">Add to calendar</Button>
    </div>
  ),
};

/**
 * AUTM-1878 follow-up: the destructive action on a brand-deep hero (a
 * request's Decline on the record's ticket): a white pill with the fill red
 * label, 6.5:1 in both themes. Lime still leads.
 */
export const DestructiveOnBrandDeep: Story = {
  render: () => (
    <div className="flex gap-2 rounded-[1.25rem] bg-[var(--hero)] p-3.5">
      <Button variant="ondeep-danger">Decline</Button>
      <Button>Confirm</Button>
    </div>
  ),
};

/**
 * AUTM-1838: the destructive action is `danger`, red words on band, beside a
 * quiet way back. Never lime (lime says go), never a red fill (AUTM-1594).
 * `destructive` and `light-destructive` render the same, and ConfirmDialog
 * `tone="destructive"` draws it.
 */
export const Destructive: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-2.5">
      <span className="text-sm text-[var(--danger)]">Inside 4 hours the deposit is retained.</span>
      <div className="flex flex-wrap items-center gap-2.5">
        <Button variant="quiet" size="lg">
          Keep booking
        </Button>
        <Button variant="danger" size="lg">
          Cancel booking
        </Button>
      </div>
    </div>
  ),
};

export const AsAnchor: Story = {
  args: { asChild: true, variant: "primary" },
  render: (args) => (
    <Button {...args}>
      <a href="#example">Open as anchor</a>
    </Button>
  ),
};

/** At 200% text the label wraps and the pill becomes a rounded rectangle, never a capsule. */
export const LongLabelAtTextScale: Story = {
  name: "Edge — long label at 200% text scale",
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-wrap gap-10">
      {[
        { label: "200% text scale (32px root)", size: "32px" },
        { label: "Normal (16px root)", size: "16px" },
      ].map((col) => (
        <div key={col.label}>
          <p className="mb-3 text-sm font-medium text-[var(--text-muted)]">{col.label}</p>
          <div style={{ fontSize: col.size, width: "183px" }} className="space-y-3">
            <Button fullWidth>
              Go to your dashboard
            </Button>
            <Button variant="quiet" fullWidth size="sm">
              Contact Autara Support
            </Button>
            <Button fullWidth size="lg">
              Confirm and pay the deposit
            </Button>
          </div>
        </div>
      ))}
    </div>
  ),
};

/** AUTM-977: one focus ring for every variant, in both themes. */
export const FocusRingPerVariant: Story = {
  name: "AUTM-977 — the focus ring, every variant, both themes",
  parameters: { layout: "padded" },
  render: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      {[
        { label: "Light", theme: "light" },
        { label: "Dark", theme: "dark" },
      ].map((col) => (
        <div key={col.label} data-theme={col.theme} className="space-y-3 rounded-[1.5rem] bg-[var(--background)] p-5">
          <p className="text-sm font-medium text-[var(--text-muted)]">{col.label}</p>
          <div className="flex flex-wrap items-center gap-4">
            {(["primary", "quiet", "danger", "link", "ghost"] as const).map((variant) => (
              <Button key={variant} variant={variant} className="ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--background)]">
                {variant}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};

function Specimen({ name, component, note, children }: { name: string; component: string; note?: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.9375rem] leading-[normal] font-bold">{name}</span>
        <code className="font-mono text-xs text-[var(--text-subtle)]">{component}</code>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">{children}</div>
      {note && <span className="text-[0.8125rem] leading-[1.45] text-[var(--text-subtle)]">{note}</span>}
    </div>
  );
}

/**
 * The sheet's Buttons section, laid out at its geometry (1440, 80px gutters,
 * three columns) so it can be overlaid on UiComponents / UiComponentsDark.
 */
export const Sheet: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div style={{ padding: "72px 80px", background: "var(--paper)", color: "var(--text-strong)" }}>
      <section className="flex flex-col gap-5 border-t border-[var(--hairline)] py-10">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-section m-0">Buttons</h2>
          <p className="text-body m-0 text-[var(--text-muted)]">
            Pills, 44px minimum. Lime is the one primary action on a screen, on paper, band, sheets and dialogs alike; the rest are quiet. No black buttons. A destructive action is danger: red words on band, never lime and never a red fill.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-x-10 gap-y-8">
          <Specimen name="Primary" component="Button variant=primary (or strong)" note="Lime with ink text. One per screen, on any surface.">
            <Button size="lg" leadingIcon={<Calendar />}>New booking</Button>
            <Button size="md">Continue</Button>
            <Button size="sm">Save</Button>
          </Specimen>
          <Specimen name="On band" component="Button variant=primary" note="The action inside a band card or sheet is lime too; the ink label identifies it.">
            <div className="flex flex-wrap gap-2 rounded-[1.25rem] bg-[var(--band)] p-3.5">
              <Button size="md">Send request</Button>
              <Button variant="quiet" size="md" className="bg-[var(--raised)]">Not now</Button>
            </div>
          </Specimen>
          <Specimen name="Quiet" component="Button variant=quiet" note="Band. Secondary choices; never competes with the primary.">
            <Button variant="quiet" size="lg">Cancel</Button>
            <Button variant="quiet" size="md" leadingIcon={<Tag />}>Add service</Button>
            <Button variant="quiet" size="sm">Back</Button>
          </Specimen>
          <Specimen name="Destructive" component="Button variant=danger + ConfirmDialog" note="Red words on band beside a quiet way back. Never lime, never a red fill.">
            <Button variant="quiet" size="lg">Keep booking</Button>
            <Button variant="danger" size="lg">Cancel booking</Button>
          </Specimen>
          <Specimen name="On brand-deep" component="Button variant=ondeep" note="Lime leads; the rest are translucent white.">
            <div className="flex gap-2 rounded-[1.25rem] bg-[var(--hero)] p-3.5">
              <Button>View booking</Button>
              <Button variant="ondeep">Add to calendar</Button>
            </div>
          </Specimen>
          <Specimen name="Busy and disabled" component="Button busy / disabled" note="Both keep the real colour (AUTM-1719). Busy turns the Autara mark where the label was; the label holds the width and stays the name. Disabled says why in text beside it; a form's primary is never disabled, it validates on press.">
            <Button busy>Save changes</Button>
            <Button disabled aria-describedby="specimen-disabled-reason">New booking</Button>
            <span id="specimen-disabled-reason" className="text-sm text-[var(--text-muted)]">Finish your profile to take bookings.</span>
          </Specimen>
          <Specimen name="Text" component="Button variant=link">
            <Button variant="link" size="sm">View all bookings</Button>
            <Button variant="link" size="sm">Make default</Button>
          </Specimen>
          <Specimen name="Icon disc" component="IconButton" note="Every icon-only control carries an aria-label.">
            <IconButton icon={<Doc />} label="Remove" />
            <IconButton icon={<Bell />} label="Notifications, 12 unread" badge={<Count n={12} />} />
          </Specimen>
          <Specimen name="Sizes" component="size=lg / md / sm">
            <Button variant="quiet" size="lg">52</Button>
            <Button variant="quiet" size="md">48</Button>
            <Button variant="quiet" size="sm">44</Button>
          </Specimen>
        </div>
      </section>
    </div>
  ),
};
