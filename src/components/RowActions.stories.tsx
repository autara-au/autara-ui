import type { Meta, StoryObj } from "@storybook/react-vite";
import { RowActions, type RowAction } from "./RowActions";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";

/**
 * RowActions (AUTM-1787): a list row's everyday actions without opening the
 * record. The ROW is the container (`row-actions-host`): under 36em a More
 * menu, from 36em icon discs, from 60em icon and label. Resize the frames, or
 * use the 200% text story, to see each.
 *
 * Graduated from the merchant portal (AUTM-1777): Download, Send reminder and
 * Copy payment link on an Invoices row; Call and Text on a Customers row.
 */
const meta = {
  title: "Molecules/RowActions",
  component: RowActions,
  parameters: { layout: "padded" },
} satisfies Meta<typeof RowActions>;

export default meta;
type Story = StoryObj<typeof meta>;

const icon = (d: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const Download = icon("M12 4v11m0 0-4-4m4 4 4-4M5 20h14");
const Bell = icon("M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 2h-14zM10 20.5h4");
const Copy = icon("M8 8h11v11H8zM5 16V5h11");
const Phone = icon("M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1");
const Chat = icon("M4 5h16v11H8l-4 4z");

const noop = () => {};

const INVOICE_ACTIONS: RowAction[] = [
  { id: "download", label: "Download", accessibleLabel: "Download invoice INV-0102", icon: Download, onSelect: noop, testId: "invoices-row-download", menuTestId: "invoices-row-menu-download" },
  { id: "remind", label: "Send reminder", accessibleLabel: "Send a payment reminder for invoice INV-0102", icon: Bell, onSelect: noop, testId: "invoices-row-remind", menuTestId: "invoices-row-menu-remind" },
  { id: "copy-link", label: "Copy payment link", accessibleLabel: "Copy the payment link for invoice INV-0102", icon: Copy, onSelect: noop, testId: "invoices-row-copy-link", menuTestId: "invoices-row-menu-copy-link" },
];

const CUSTOMER_ACTIONS: RowAction[] = [
  { id: "call", label: "Call", accessibleLabel: "Call Alex Chen", icon: Phone, href: "tel:+61400111000", testId: "customers-row-call", menuTestId: "customers-row-menu-call" },
  { id: "text", label: "Text", accessibleLabel: "Text Alex Chen", icon: Chat, href: "sms:+61400111000", testId: "customers-row-text", menuTestId: "customers-row-menu-text" },
];

/** An Invoices row as the merchant portal draws it: the row opens the invoice, the actions sit beside it. */
function InvoiceRow({ width, actions = INVOICE_ACTIONS }: { width: number; actions?: RowAction[] }) {
  return (
    <div style={{ width }} className="overflow-hidden rounded-2xl bg-[var(--paper)]">
      <div className="row-actions-host flex items-center gap-2 pr-3">
        <button type="button" className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1 px-[22px] py-[17px] text-left hover:bg-[var(--band)]">
          <span className="w-24 text-[0.75rem] font-medium text-[var(--text-muted)]">INV-0102</span>
          <span className="min-w-[8rem] flex-1 truncate font-medium text-[var(--text-strong)]">Priya Nandakumar</span>
          <span className="font-bold tabular-nums text-[var(--text-strong)]">$242.00</span>
          <InvoiceStatusBadge state="DUE" />
        </button>
        <RowActions actions={actions} menuLabel="More actions for invoice INV-0102" menuTestId="invoices-row-actions-open" />
      </div>
    </div>
  );
}

function CustomerRow({ width }: { width: number }) {
  return (
    <div style={{ width }} className="overflow-hidden rounded-2xl bg-[var(--paper)]">
      <div className="row-actions-host flex items-center gap-2 pr-3">
        <button type="button" className="flex min-w-0 flex-1 flex-col px-[22px] py-[17px] text-left hover:bg-[var(--band)]">
          <span className="truncate font-medium text-[var(--text-strong)]">Alex Chen</span>
          <span className="truncate text-[0.8125rem] text-[var(--text-muted)]">+61 400 111 000 · last seen Wed 20 Aug</span>
        </button>
        <RowActions actions={CUSTOMER_ACTIONS} menuLabel="Contact Alex Chen" menuTestId="customers-row-actions-open" />
      </div>
    </div>
  );
}

/** A phone: the actions fold into one More menu. */
export const InvoiceRowPhone: Story = {
  args: { actions: INVOICE_ACTIONS, menuLabel: "More actions for invoice INV-0102" },
  render: () => <InvoiceRow width={358} />,
};

/** A tablet: one 44px disc per action, named in aria-label and title. */
export const InvoiceRowTablet: Story = {
  args: { actions: INVOICE_ACTIONS, menuLabel: "More actions for invoice INV-0102" },
  render: () => <InvoiceRow width={786} />,
};

/** A wide list: icon and visible label. */
export const InvoiceRowWide: Story = {
  args: { actions: INVOICE_ACTIONS, menuLabel: "More actions for invoice INV-0102" },
  render: () => <InvoiceRow width={1100} />,
};

/** A paid invoice: only Download. A draft has none, and renders nothing. */
export const PaidAndDraft: Story = {
  args: { actions: INVOICE_ACTIONS.slice(0, 1), menuLabel: "More actions for invoice INV-0101" },
  render: () => (
    <div className="space-y-3">
      <InvoiceRow width={1100} actions={INVOICE_ACTIONS.slice(0, 1)} />
      <InvoiceRow width={1100} actions={[]} />
    </div>
  ),
};

/** Links rather than buttons: Call and Text hand off to the phone. */
export const CustomerRowLinks: Story = {
  args: { actions: CUSTOMER_ACTIONS, menuLabel: "Contact Alex Chen" },
  render: () => (
    <div className="space-y-3">
      <CustomerRow width={358} />
      <CustomerRow width={786} />
      <CustomerRow width={1100} />
    </div>
  ),
};

/** 200% text: the same 786px row has half the room in em, so it folds to the menu. */
export const LargeText: Story = {
  args: { actions: INVOICE_ACTIONS, menuLabel: "More actions for invoice INV-0102" },
  render: () => (
    <div style={{ fontSize: "200%" }}>
      <InvoiceRow width={786} />
    </div>
  ),
};

/** Both themes side by side. */
export const Dark: Story = {
  args: { actions: INVOICE_ACTIONS, menuLabel: "More actions for invoice INV-0102" },
  render: () => (
    <div data-theme="dark" className="rounded-3xl bg-[var(--canvas)] p-4">
      <InvoiceRow width={1100} />
    </div>
  ),
};
