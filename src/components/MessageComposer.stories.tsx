import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MessageComposer, type MessageComposerProps } from "./MessageComposer";

const meta = {
  title: "Molecules/MessageComposer",
  component: MessageComposer,
  parameters: { layout: "fullscreen" },
  args: { value: "", onChange: () => {}, onSend: () => {} },
} satisfies Meta<typeof MessageComposer>;

export default meta;
type Story = StoryObj<typeof meta>;

function Demo(props: Partial<MessageComposerProps>) {
  const [value, setValue] = useState(props.value ?? "");
  return (
    <div className="flex min-h-[240px] flex-col bg-[var(--background)]">
      <div className="flex flex-1 items-center justify-center text-[13px] text-[var(--text-subtle)]">
        thread scroll area
      </div>
      <MessageComposer
        value={value}
        onChange={setValue}
        onSend={() => setValue("")}
        {...props}
      />
    </div>
  );
}

export const Default: Story = { render: () => <Demo /> };

export const WithText: Story = {
  render: () => <Demo value="On my way — about 5 minutes out." />,
};

export const Sending: Story = {
  render: () => <Demo value="On my way — about 5 minutes out." sending />,
};

export const WithError: Story = {
  render: () => (
    <Demo
      value="On my way — about 5 minutes out."
      error="We couldn't send your message — check your connection and try again."
    />
  ),
};

/** With a leading control (e.g. an attach / plus button) left of the field. */
export const WithLeading: Story = {
  render: () => (
    <Demo
      leading={
        <button
          type="button"
          aria-label="Add attachment"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-[var(--text-subtle)] transition-colors hover:text-[var(--text-muted)]"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" />
            <path
              d="M12 8.5v7M8.5 12h7"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      }
    />
  ),
};

/**
 * AUTM-1878 — `layout="inset"`: one field across the panel, the plus inside
 * its leading edge and Send (the lime disc) inside its trailing edge. Type
 * past a line: the field grows to about four lines, then scrolls. Enter
 * sends, Shift+Enter adds a line.
 */
const PLUS = (
  <button
    type="button"
    aria-label="Add an extra"
    className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--band)] text-[var(--text-strong)]"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  </button>
);

export const Inset: Story = {
  render: () => <Demo layout="inset" measureClassName="max-w-none" leading={PLUS} />,
};

export const InsetLongText: Story = {
  render: () => (
    <Demo
      layout="inset"
      measureClassName="max-w-none"
      leading={PLUS}
      value={
        "Running about 15 minutes over on the paint correction.\nThe clay bar is taking longer on the bonnet.\nI'll message when I'm packing up.\nThe car is in the shade by the garage.\nNo need to move it."
      }
    />
  ),
};

export const InsetSending: Story = {
  render: () => <Demo layout="inset" measureClassName="max-w-none" leading={PLUS} value="On my way." sending />,
};

export const InsetWithError: Story = {
  render: () => (
    <Demo
      layout="inset"
      measureClassName="max-w-none"
      value="On my way."
      error="We couldn't send your message. Check your connection and try again."
    />
  ),
};

export const InsetDark: Story = {
  render: () => (
    <div data-theme="dark" className="bg-[var(--background)]">
      <Demo layout="inset" measureClassName="max-w-none" leading={PLUS} value="All done, ready to collect." />
    </div>
  ),
};
