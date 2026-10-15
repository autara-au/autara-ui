import { useEffect, useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MessageCard } from "./MessageCard";
import { Button } from "./Button";

/**
 * AUTM-1806 (U3). Every figure in these stories stands in for a server value:
 * the amount and the balance come from the booking_addons row and the API's
 * balanceIfApproved, never from the card.
 */
const meta = {
  title: "Molecules/MessageCard",
  component: MessageCard,
  parameters: { layout: "padded" },
  args: { title: "Pet hair removal, rear seats" },
} satisfies Meta<typeof MessageCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const Column = ({ children }: { children: ReactNode }) => (
  <div className="flex max-w-[420px] flex-col gap-4">{children}</div>
);

function useLargeText() {
  useEffect(() => {
    const prev = document.documentElement.style.fontSize;
    document.documentElement.style.fontSize = "200%";
    return () => {
      document.documentElement.style.fontSize = prev;
    };
  }, []);
}

const reason =
  "Heavy hair woven into the fabric. It needs a rubber brush pass before the vacuum, about 30 minutes.";

/** The customer's card: two equal answers, the balance from the server. */
export const CustomerWaiting: Story = {
  render: function CustomerWaitingStory() {
    const [busy, setBusy] = useState<"approve" | "decline" | null>(null);
    return (
      <Column>
        <MessageCard
          kicker="Extra to approve, from Kerbside Car Care"
          title="Pet hair removal, rear seats"
          figure="+$40.00"
          body={reason}
          balance="If you approve, your balance becomes $190.00."
          state="waiting"
          stateLabel="Waiting for you"
          secondaryAction={{
            label: "No thanks",
            ariaLabel: "Decline Pet hair removal, rear seats, $40.00",
            busy: busy === "decline",
            onClick: () => setBusy("decline"),
          }}
          primaryAction={{
            label: "Approve",
            ariaLabel: "Approve Pet hair removal, rear seats, $40.00",
            busy: busy === "approve",
            onClick: () => setBusy("approve"),
          }}
          footnote="Charged with your final balance, not now. You are not charged unless you approve."
          footer={
            <Button variant="link" size="sm">
              Message Kerbside about this
            </Button>
          }
        />
      </Column>
    );
  },
};

/** The pro's card while it waits: Remind and Remove. */
export const MerchantWaiting: Story = {
  render: () => (
    <Column>
      <MessageCard
        kicker="Extra you added"
        title="Roof box clean and wax"
        figure="+$25.00"
        state="waiting"
        stateLabel="Waiting for Sam"
        secondaryAction={{ label: "Remove", ariaLabel: "Remove Roof box clean and wax", onClick: () => {}, destructive: true }}
        primaryAction={{ label: "Remind Sam", ariaLabel: "Remind Sam about Roof box clean and wax", onClick: () => {} }}
        footnote="Not charged unless Sam approves. A reminder can be sent every 15 minutes."
      />
    </Column>
  ),
};

/** Answered and closed states. Declined and expired never wear a warning colour. */
export const States: Story = {
  render: () => (
    <Column>
      <MessageCard
        kicker="Extra you added"
        title="Pet hair removal, rear seats"
        figure="+$40.00"
        state="approved"
        body="Sam approved at 8:43 am. It is added to the balance and charged with the rest at the end, not now."
      />
      <MessageCard
        kicker="Extra from Kerbside Car Care"
        title="Engine bay degrease"
        figure="+$60.00"
        state="declined"
        body="You declined this. You won't be charged."
      />
      <MessageCard
        kicker="Extra from Kerbside Car Care"
        title="Headlight restoration"
        figure="+$35.00"
        state="expired"
        body="Not answered in time. Not charged."
      />
    </Column>
  ),
};

/** The answer did not save: said in words with an icon, the actions stay. */
export const AnswerFailed: Story = {
  render: () => (
    <Column>
      <MessageCard
        kicker="Extra to approve, from Kerbside Car Care"
        title="Pet hair removal, rear seats"
        figure="+$40.00"
        body={reason}
        balance="If you approve, your balance becomes $190.00."
        state="waiting"
        error="We couldn't save your answer. Nothing has changed. Try again."
        secondaryAction={{ label: "No thanks", onClick: () => {} }}
        primaryAction={{ label: "Approve", onClick: () => {} }}
      />
    </Column>
  ),
};

/** A 50-character extra name and no figure line from the server. */
export const LongNameNoBalance: Story = {
  render: () => (
    <Column>
      <MessageCard
        kicker="Extra to approve, from Kerbside Car Care"
        title="Clay bar decontamination and two-stage paint polish"
        figure="+$480.00"
        body="Kerbside Car Care did not add a note explaining this one. You can decline it and ask them first."
        balance="If you approve, it is added to what you pay after the job."
        state="waiting"
        secondaryAction={{ label: "No thanks", onClick: () => {} }}
        primaryAction={{ label: "Approve", onClick: () => {} }}
      />
    </Column>
  ),
};

export const Dark: Story = {
  render: () => (
    <div data-theme="dark" className="rounded-3xl bg-[var(--paper)] p-5">
      <Column>
        <MessageCard
          kicker="Extra to approve, from Kerbside Car Care"
          title="Pet hair removal, rear seats"
          figure="+$40.00"
          body={reason}
          balance="If you approve, your balance becomes $190.00."
          state="waiting"
          secondaryAction={{ label: "No thanks", onClick: () => {} }}
          primaryAction={{ label: "Approve", onClick: () => {} }}
          footnote="Charged with your final balance, not now."
        />
        <MessageCard kicker="Extra you added" title="Roof box clean and wax" figure="+$25.00" state="approved" />
        <MessageCard kicker="Extra you added" title="Headlight restoration" figure="+$35.00" state="expired" />
      </Column>
    </div>
  ),
};

/** 200% text on a small phone: the actions stack, nothing clips. */
export const LargeText: Story = {
  parameters: { viewport: { defaultViewport: "phoneSmall" } },
  render: function LargeTextStory() {
    useLargeText();
    return (
      <Column>
        <MessageCard
          kicker="Extra to approve, from Kerbside Car Care"
          title="Pet hair removal, rear seats"
          figure="+$40.00"
          body={reason}
          balance="If you approve, your balance becomes $190.00."
          state="waiting"
          secondaryAction={{ label: "No thanks", onClick: () => {} }}
          primaryAction={{ label: "Approve", onClick: () => {} }}
        />
      </Column>
    );
  },
};
