import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { EmptyState } from "./EmptyState";
import { ErrorCard } from "./ErrorCard";
import { Skeleton } from "./Skeleton";
import { Spinner } from "./Spinner";
import { LockedFeature } from "./LockedFeature";
import { Button } from "./Button";

/**
 * Empty, loading and error — canvas v44's last section (AUTM-1594), laid out
 * at the sheet's geometry for the overlay.
 */
const meta = {
  title: "Molecules/Empty, loading and error",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Calendar = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="5" width="16" height="15" rx="3" />
    <path d="M4 10h16" />
    <path d="M9 3v4" />
    <path d="M15 3v4" />
  </svg>
);

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
          <h2 className="text-section m-0">Empty, loading and error</h2>
          <p className="text-body m-0 text-[var(--text-muted)]">
            Every async surface has all three. Copy names the thing and the way out; a retry is always one tap.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-x-10 gap-y-8">
          <Specimen name="Empty" component="EmptyState" note="On band, the action is ink.">
            <EmptyState
              className="w-full"
              icon={Calendar}
              title="Your book is clear"
              description="No jobs today, nothing waiting on you. The actions below are the quickest ways to line the next one up."
              action={<Button size="sm">Share link</Button>}
            />
          </Specimen>
          <Specimen name="Loading" component="Skeleton / AsyncSkeleton" note="Skeletons match the shape that lands; the aria-label says what is loading.">
            <div role="status" aria-label="Loading your bookings" className="flex w-full flex-col gap-2.5">
              <Skeleton className="h-6 w-1/2" label="" />
              <Skeleton className="h-16 w-full" label="" />
              <Skeleton className="h-16 w-full" label="" />
            </div>
          </Specimen>
          <Specimen name="Error" component="ErrorCard">
            <ErrorCard className="w-full" title="Couldn’t load today’s bookings" message="Check your connection and tap retry." onRetry={() => {}} />
          </Specimen>
          <Specimen name="Field error" component="FormField error">
            <span role="alert" className="text-sm text-[var(--danger)]">Please select a time slot</span>
          </Specimen>
          <Specimen name="Spinner" component="Spinner" note="Only inside a button or beside a short status line; never alone on a page.">
            <Spinner size="md" label="Saving" />
          </Specimen>
          <Specimen name="Locked" component="LockedFeature">
            <LockedFeature locked title="Invoices" description="Available once your account is active." className="w-full" />
          </Specimen>
        </div>
      </section>
    </div>
  ),
};
