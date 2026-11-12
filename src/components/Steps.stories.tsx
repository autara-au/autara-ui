import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { Stepper } from "./Stepper";
import { ProgressSteps } from "./ProgressSteps";
import { Progress } from "./Progress";
import { Countdown } from "./Countdown";

/**
 * Steps and progress — canvas v44's section (AUTM-1594), laid out at the
 * sheet's geometry for the overlay. The desktop stepper shows from 64rem;
 * the phone specimen is the same component with `compact`.
 */
const meta = {
  title: "Molecules/Steps and progress",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const BOOKING = ["Service", "Vehicle", "When", "Review and pay"].map((label, i) => ({ id: String(i), label }));
const IN_FOUR_HOURS = new Date(Date.now() + 4 * 3600_000 + 30_000).toISOString();

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

export const Sheet: Story = {
  render: () => (
    <div style={{ padding: "72px 80px", background: "var(--paper)", color: "var(--text-strong)" }}>
      <section className="flex flex-col gap-5 border-t border-[var(--hairline)] py-10">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-section m-0">Steps and progress</h2>
          <p className="text-body m-0 text-[var(--text-muted)]">
            Numbered steps on desktop, a bar with “Step N of M” on a phone; booking progress is four steps everywhere.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-x-10 gap-y-8">
          <Specimen name="Stepper, desktop" component="Stepper">
            <Stepper steps={BOOKING} currentStep={2} ariaLabel="Booking progress" />
          </Specimen>
          <Specimen name="Stepper, phone" component="Stepper compact">
            <Stepper steps={BOOKING} currentStep={2} ariaLabel="Booking progress, phone" compact />
          </Specimen>
          <Specimen name="Booking progress" component="Progress">
            <ProgressSteps steps={["Requested", "Confirmed", "In progress", "Completed"]} current={1} label="Booking progress" />
          </Specimen>
          <Specimen name="Checklist" component="Progress + StepCard">
            <Progress value={33} aria-label="Setup checklist" />
          </Specimen>
          <Specimen name="Countdown" component="Countdown" note="Request expiry and hold timers; the words carry the urgency, not colour.">
            <Countdown until={IN_FOUR_HOURS} />
          </Specimen>
        </div>
      </section>
    </div>
  ),
};

/**
 * AUTM-1797 / AUTM-1799: ProgressSteps with an icon per step, the customer
 * booking screen's track. Reached steps are lime with a tick, the current one
 * aqua and breathing, the rest band; only the current word is drawn, every
 * word is read out.
 */
export const IconTrack: Story = {
  render: () => {
    const g = (d: string) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path d={d} />
      </svg>
    );
    const icons = [g("M7 17 17 7M9 7h8v8"), g("M4 10v9h16v-9M3 6l1.5-3h15L21 6"), g("M12 3v4M12 17v4M3 12h4M17 12h4"), g("M3 7h18v10H3zM3 11h18")];
    return (
      <div className="flex max-w-[390px] flex-col gap-8 p-6">
        <ProgressSteps steps={["Sent", "Accepted", "The job", "Paid"]} current={1} label="Where your booking is" icons={icons} />
        <ProgressSteps steps={["Requested", "Accepted", "In progress", "Done"]} current={2} label="Where your booking is" icons={icons} />
      </div>
    );
  },
};
