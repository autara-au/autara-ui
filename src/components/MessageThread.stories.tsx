import { useEffect, useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MessageThread, type MessageItem } from "./MessageThread";
import { MessageComposer } from "./MessageComposer";
import { MessageCard } from "./MessageCard";
import { QuickReplies } from "./QuickReplies";
import { ComposerAttachMenu, attachMenuGlyphs } from "./ComposerAttachMenu";

// Fixed base time so timestamp separators render deterministically.
const BASE = Date.UTC(2026, 4, 15, 9, 17);
const MIN = 60 * 1000;

const SAMPLE: MessageItem[] = [
  {
    id: "s1",
    side: "system",
    text: "Booking confirmed · Fri 15 May, 9:00 AM",
    createdAt: BASE - 60 * MIN,
  },
  {
    id: "1",
    side: "incoming",
    text: "Hi! Are you able to do the interior deep clean this Friday?",
    createdAt: BASE - 58 * MIN,
  },
  {
    id: "2",
    side: "own",
    text: "Yes — 9am works. I'll bring the full kit.",
    createdAt: BASE - 57 * MIN,
  },
  {
    id: "3",
    side: "incoming",
    text: "Perfect. The car's a black SUV, fairly muddy after the weekend.",
    createdAt: BASE - 20 * MIN,
  },
  {
    id: "4",
    side: "own",
    text: "No problem at all. See you Friday.",
    createdAt: BASE - 19 * MIN,
  },
];

const EmptyTile = (
  <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] px-5 py-6 text-center">
    <p className="text-[14px] font-bold text-[var(--text-strong)]">
      No messages yet
    </p>
    <p className="mt-1 text-[13px] text-[var(--text-muted)]">
      Start the conversation — your customer will be notified by push and email.
    </p>
  </div>
);

const meta = {
  title: "Molecules/MessageThread",
  component: MessageThread,
  parameters: { layout: "fullscreen" },
  args: { items: [] },
} satisfies Meta<typeof MessageThread>;

export default meta;
type Story = StoryObj<typeof meta>;

function Frame({ children, tall }: { children: ReactNode; tall?: boolean }) {
  return (
    <div className={tall ? "flex h-[860px] flex-col bg-[var(--background)]" : "flex h-[520px] flex-col bg-[var(--background)]"}>
      {children}
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <Frame>
      <MessageThread items={SAMPLE} />
    </Frame>
  ),
};

export const Loading: Story = {
  render: () => (
    <Frame>
      <MessageThread items={[]} loading />
    </Frame>
  ),
};

/** Empty state is vertically centered — no stranded tile + void. */
export const Empty: Story = {
  render: () => (
    <Frame>
      <MessageThread items={[]} emptyState={EmptyTile} />
    </Frame>
  ),
};

export const ErrorState: Story = {
  render: () => (
    <Frame>
      <MessageThread items={[]} error onRetry={() => {}} />
    </Frame>
  ),
};

/** In context — thread + docked composer, the real screen shape. */
export const InContext: Story = {
  render: () => (
    <Frame>
      <MessageThread items={SAMPLE} />
      <MessageComposer value="" onChange={() => {}} onSend={() => {}} />
    </Frame>
  ),
};

function useLargeText() {
  useEffect(() => {
    const prev = document.documentElement.style.fontSize;
    document.documentElement.style.fontSize = "200%";
    return () => {
      document.documentElement.style.fontSize = prev;
    };
  }, []);
}

/**
 * AUTM-1806 (U1): send status on your own bubble. "Sending" while the call is
 * in flight, then nothing once it landed; a failed send keeps its text and
 * offers a 44px retry. The failure is also said once, politely.
 */
export const SendStatus: Story = {
  render: function SendStatusStory() {
    const [items, setItems] = useState<MessageItem[]>([
      ...SAMPLE,
      { id: "5", side: "own", text: "See you at nine.", createdAt: BASE - 2 * MIN, status: "sending" },
      {
        id: "6",
        side: "own",
        text: "Gate code is 4821.",
        createdAt: BASE - MIN,
        status: "failed",
        onRetry: () =>
          setItems((prev) =>
            prev.map((m) => (m.id === "6" ? { ...m, status: "sending", onRetry: undefined } : m)),
          ),
      },
    ]);
    return (
      <Frame tall>
        <MessageThread items={items} logLabel="Messages with Sam" retryTestId="booking-chat-message-retry" />
      </Frame>
    );
  },
};

const BOOKED = Date.UTC(2026, 8, 23, 8, 41);

/** AUTM-1806: a card as a thread row, sorted with the messages by time. */
const WITH_CARD: MessageItem[] = [
  {
    id: "m1",
    side: "incoming",
    text: "Hi Sam, started on the inside. The rear seats have a lot of pet hair.",
    createdAt: BOOKED,
  },
  {
    id: "x1",
    side: "incoming",
    createdAt: BOOKED + 30 * 1000,
    testId: "booking-detail-chat-extra-card",
    body: (
      <MessageCard
        kicker="Extra to approve, from Kerbside Car Care"
        title="Pet hair removal, rear seats"
        figure="+$40.00"
        body="Heavy hair woven into the fabric. It needs a rubber brush pass before the vacuum, about 30 minutes."
        balance="If you approve, your balance becomes $190.00."
        state="waiting"
        stateLabel="Waiting for you"
        secondaryAction={{ label: "No thanks", onClick: () => {} }}
        primaryAction={{ label: "Approve", onClick: () => {} }}
        footnote="Charged with your final balance, not now. You are not charged unless you approve."
      />
    ),
  },
  { id: "m2", side: "own", text: "Looks right, go ahead.", createdAt: BOOKED + 2 * MIN },
];

/** The whole Phase 1A screen: thread with a card, quick replies, the plus. */
export const WithCardsAndQuickReplies: Story = {
  render: function WithCardsStory() {
    const [value, setValue] = useState("");
    return (
      <Frame tall>
        <MessageThread items={WITH_CARD} logLabel="Messages with Kerbside Car Care" />
        <div className="mx-auto w-full max-w-[680px] px-4 pb-2">
          <QuickReplies
            replies={[
              { id: "late", label: "I'm running late" },
              { id: "here", label: "I'm here" },
              { id: "park", label: "Where do I park?" },
            ]}
            onSelect={(r) => setValue(r.label)}
            chipTestId="booking-detail-chat-quick-reply"
          />
        </div>
        <MessageComposer
          value={value}
          onChange={setValue}
          onSend={() => setValue("")}
          maxLength={2000}
          placeholder="Message Kerbside Car Care"
          leading={
            <ComposerAttachMenu
              triggerTestId="booking-detail-chat-attach-open"
              items={[
                {
                  id: "ask",
                  label: "Ask about an extra",
                  icon: attachMenuGlyphs.question,
                  onSelect: () => {},
                  testId: "booking-detail-chat-extra-ask",
                },
              ]}
            />
          }
        />
      </Frame>
    );
  },
};

/** Near the 2,000-character cap the composer says how many are left. */
export const NearTheCap: Story = {
  render: function NearTheCapStory() {
    const [value, setValue] = useState("a".repeat(1890));
    return (
      <Frame>
        <MessageThread items={SAMPLE} />
        <MessageComposer value={value} onChange={setValue} onSend={() => setValue("")} maxLength={2000} />
      </Frame>
    );
  },
};

export const Dark: Story = {
  render: () => (
    <div data-theme="dark" className="flex h-[860px] flex-col bg-[var(--paper)]">
      <MessageThread
        items={[
          ...WITH_CARD,
          { id: "f", side: "own", text: "Gate code is 4821.", createdAt: BOOKED + 3 * MIN, status: "failed", onRetry: () => {} },
        ]}
      />
      <MessageComposer value="" onChange={() => {}} onSend={() => {}} />
    </div>
  ),
};

/** 200% text on a small phone: bubbles, the card and the retry line wrap. */
export const LargeText: Story = {
  parameters: { viewport: { defaultViewport: "phoneSmall" } },
  render: function LargeTextStory() {
    useLargeText();
    return (
      <div className="flex h-[1400px] flex-col bg-[var(--paper)]">
        <MessageThread
          items={[
            ...WITH_CARD,
            { id: "f", side: "own", text: "Gate code is 4821.", createdAt: BOOKED + 3 * MIN, status: "failed", onRetry: () => {} },
          ]}
        />
      </div>
    );
  },
};

/**
 * AUTM-1878 — a bounded box: `anchor="end"` opens on the newest message,
 * `fadeTop` softens the top edge while there is more above (scroll down to
 * the top and it goes), and `before` holds a "Load earlier" control. Tab to
 * the thread to scroll it with the keyboard.
 */
export const AnchoredInABox: Story = {
  render: function AnchoredStory() {
    const [all, setAll] = useState(false);
    const many: MessageItem[] = [
      ...SAMPLE,
      { id: "5", side: "incoming", text: "Is there power near the driveway?", createdAt: BASE - 15 * MIN },
      { id: "6", side: "own", text: "Yes, the outlet by the garage works.", createdAt: BASE - 14 * MIN },
      { id: "7", side: "incoming", text: "Great. Gate code is 4412.", createdAt: BASE - 5 * MIN },
      { id: "8", side: "own", text: "Got it, see you at 9.", createdAt: BASE - 4 * MIN },
    ];
    const shown = all ? many : many.slice(-4);
    return (
      <div className="mx-auto flex h-[360px] max-w-[420px] flex-col overflow-hidden rounded-[1.5rem] bg-[var(--surface-warm)]">
        <MessageThread
          items={shown}
          anchor="end"
          fadeTop
          measureClassName="max-w-none"
          label="Messages with Sam"
          before={
            all ? null : (
              <button
                type="button"
                onClick={() => setAll(true)}
                className="min-h-11 rounded-full bg-[var(--paper)] px-4 text-[0.875rem] font-medium text-[var(--text-strong)]"
              >
                Show {many.length - 4} earlier messages
              </button>
            )
          }
        />
      </div>
    );
  },
};

