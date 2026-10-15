import { useEffect, useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChatEventCard, chatEventGlyphs } from "./ChatEventCard";
import { MessageThread, type MessageItem } from "./MessageThread";

/**
 * AUTM-1881, phase 1 for Don's review. Every word and figure here stands in
 * for what the API renders for one reader from the stored booking event: the
 * card never computes copy or money.
 */
const meta = {
  title: "Molecules/ChatEventCard",
  component: ChatEventCard,
  parameters: { layout: "padded" },
  args: { tone: "done", title: "Booking confirmed", time: "9:41 am" },
} satisfies Meta<typeof ChatEventCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const Column = ({ children }: { children: ReactNode }) => (
  <div className="flex max-w-[420px] flex-col items-center gap-4">{children}</div>
);

/** Confirmed, as the customer sees it: done, nothing to do. */
export const Confirmed: Story = {
  render: () => (
    <Column>
      <ChatEventCard
        tone="done"
        icon={chatEventGlyphs.confirmed}
        title="Booking confirmed"
        detail="$40.00 deposit charged. See you Sat 18 Oct, 9:00 am."
        time="9:41 am"
        dateTime="2026-10-15T09:41:00+11:00"
        testId="chat-event-confirmed"
      />
    </Column>
  ),
};

/** Balance due with Pay, as the customer sees it: the one action is the lime primary. */
export const BalanceDueWithPay: Story = {
  render: function BalanceDueStory() {
    const [busy, setBusy] = useState(false);
    return (
      <Column>
        <ChatEventCard
          tone="action"
          icon={chatEventGlyphs.payment}
          title="Job complete, $80.00 to pay"
          detail="Your card wasn't charged, so the balance is still due."
          time="1:12 pm"
          dateTime="2026-10-18T13:12:00+11:00"
          action={{
            label: "Pay $80.00",
            ariaLabel: "Pay the $80.00 balance for Exterior wash",
            busy,
            onClick: () => setBusy(true),
            testId: "chat-event-pay-balance",
          }}
          testId="chat-event-balance-due"
        />
      </Column>
    );
  },
};

/** The Pay action failed: said in place, the action stays, nothing else changes. */
export const ActionFailed: Story = {
  render: () => (
    <Column>
      <ChatEventCard
        tone="action"
        icon={chatEventGlyphs.payment}
        title="Job complete, $80.00 to pay"
        detail="Your card wasn't charged, so the balance is still due."
        time="1:12 pm"
        error="We couldn't open the payment page. Nothing was charged. Try again."
        action={{ label: "Pay $80.00", onClick: () => {} }}
      />
    </Column>
  ),
};

/** Cancelled by the pro with the refund, as the customer sees it: closed, never a warning colour. */
export const CancelledWithRefund: Story = {
  render: () => (
    <Column>
      <ChatEventCard
        tone="closed"
        icon={chatEventGlyphs.cancelled}
        title="Kerbside Car Care cancelled"
        detail="Full refund of $40.00 to your card in 5 to 10 business days."
        time="4:05 pm"
        dateTime="2026-10-16T16:05:00+11:00"
        action={{ label: "Book another time", onClick: () => {}, testId: "chat-event-book-again" }}
        testId="chat-event-cancelled"
      />
    </Column>
  ),
};

/** The four tones side by side, each with the glyph its event uses. */
export const AllTones: Story = {
  render: () => (
    <Column>
      <ChatEventCard
        tone="action"
        icon={chatEventGlyphs.time}
        title="Sam asked for a new time"
        detail="From Sat 18 Oct, 9:00 am to Sun 19 Oct, 10:00 am."
        time="8:02 am"
        action={{ label: "Review new time", onClick: () => {} }}
      />
      <ChatEventCard
        tone="progress"
        icon={chatEventGlyphs.started}
        title="Car care started"
        detail="Kerbside Car Care started at 9:04 am."
        time="9:04 am"
      />
      <ChatEventCard
        tone="done"
        icon={chatEventGlyphs.refund}
        title="Refund on its way"
        detail="$40.00 back to your card in 5 to 10 business days."
        time="4:06 pm"
      />
      <ChatEventCard
        tone="closed"
        icon={chatEventGlyphs.cancelled}
        title="Request expired"
        detail="Kerbside Car Care didn't reply in time. The $40.00 hold on your card is released."
        time="11:30 am"
        action={{ label: "Book another time", onClick: () => {} }}
      />
    </Column>
  ),
};

const thread: MessageItem[] = [
  {
    id: "e1",
    side: "system",
    createdAt: "2026-10-15T09:41:00+11:00",
    body: (
      <ChatEventCard
        tone="done"
        icon={chatEventGlyphs.confirmed}
        title="Booking confirmed"
        detail="$40.00 deposit charged. See you Sat 18 Oct, 9:00 am."
        time="9:41 am"
      />
    ),
  },
  {
    id: "m1",
    side: "incoming",
    createdAt: "2026-10-15T09:44:00+11:00",
    text: "Thanks Sam. Is there a tap I can use near the driveway?",
  },
  { id: "m2", side: "own", createdAt: "2026-10-15T09:46:00+11:00", text: "Yes, on the left of the garage.", status: "sent" },
  {
    id: "e2",
    side: "system",
    createdAt: "2026-10-18T09:04:00+11:00",
    body: (
      <ChatEventCard
        tone="progress"
        icon={chatEventGlyphs.started}
        title="Car care started"
        detail="Kerbside Car Care started at 9:04 am."
        time="9:04 am"
      />
    ),
  },
  {
    id: "e3",
    side: "system",
    createdAt: "2026-10-18T13:12:00+11:00",
    body: (
      <ChatEventCard
        tone="action"
        icon={chatEventGlyphs.payment}
        title="Job complete, $80.00 to pay"
        detail="Your card wasn't charged, so the balance is still due."
        time="1:12 pm"
        arrived
        action={{ label: "Pay $80.00", onClick: () => {} }}
      />
    ),
  },
];

/** The separator in the pro's zone, as a consumer would pass it, so it agrees with the cards' times. */
const sydney = (d: Date) =>
  new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Australia/Sydney",
  }).format(d);

const ThreadFrame = ({ children }: { children: ReactNode }) => (
  <div className="flex h-[640px] max-w-[440px] flex-col rounded-[1.25rem] bg-[var(--paper)]">{children}</div>
);

/** In the customer's thread, light: centred between the two people's messages, where it happened. */
export const InThreadLight: Story = {
  globals: { theme: "light" },
  render: () => (
    <ThreadFrame>
      <MessageThread items={thread} formatTimestamp={sydney} />
    </ThreadFrame>
  ),
};

/** The same thread in dark: the card ground lifts to raised, the discs keep their ink. */
export const InThreadDark: Story = {
  globals: { theme: "dark" },
  parameters: { backgrounds: { default: "Paper, dark" } },
  render: () => (
    <ThreadFrame>
      <MessageThread items={thread} formatTimestamp={sydney} />
    </ThreadFrame>
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

/** 200% text: the time wraps under the title and the button grows with its label, never clipped. */
export const LargeText: Story = {
  render: function LargeTextStory() {
    useLargeText();
    return (
      <Column>
        <ChatEventCard
          tone="action"
          icon={chatEventGlyphs.payment}
          title="Job complete, $80.00 to pay"
          detail="Your card wasn't charged, so the balance is still due."
          time="1:12 pm"
          action={{ label: "Pay $80.00", onClick: () => {} }}
        />
      </Column>
    );
  },
};
