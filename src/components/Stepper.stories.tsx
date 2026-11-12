import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stepper } from "./Stepper";
import { Card, CardContent } from "./Card";

const ONBOARDING_STEPS = [
  { id: "business-info", label: "Business Info" },
  { id: "verification", label: "Verification" },
  { id: "availability", label: "Availability" },
  { id: "payment", label: "Payment" },
  { id: "review", label: "Review" },
];

const meta = {
  title: "Molecules/Stepper",
  component: Stepper,
  parameters: { layout: "padded" },
  args: {
    steps: ONBOARDING_STEPS,
    currentStep: 1,
  },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="max-w-lg">
      <Stepper {...args} />
    </div>
  ),
};

export const FirstStep: Story = {
  args: { currentStep: 0 },
  render: (args) => (
    <div className="max-w-lg">
      <Stepper {...args} />
    </div>
  ),
};

export const LastStep: Story = {
  args: { currentStep: 4 },
  render: (args) => (
    <div className="max-w-lg">
      <Stepper {...args} />
    </div>
  ),
};

/**
 * Review step — no back-navigation. Completed step labels render as plain
 * text instead of clickable buttons even though `onStepClick` is provided.
 */
export const Locked: Story = {
  args: { currentStep: 4, locked: true, onStepClick: () => {} },
  render: (args) => (
    <div className="max-w-lg">
      <Stepper {...args} />
    </div>
  ),
};

/**
 * Clickable back-navigation to completed steps — the label row response
 * to a real click, same interaction merchant-web's onboarding layout uses
 * to let a merchant jump back to a finished step.
 */
export const Interactive: Story = {
  render: () => {
    function InteractiveStepper() {
      const [step, setStep] = useState(2);
      return (
        <div className="max-w-lg">
          <Stepper steps={ONBOARDING_STEPS} currentStep={step} onStepClick={setStep} />
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            Click a completed step's label to jump back to it.
          </p>
        </div>
      );
    }
    return <InteractiveStepper />;
  },
};

export const Mobile: Story = {
  args: { currentStep: 2 },
  parameters: { viewport: { defaultViewport: "mobile1" } },
  render: (args) => (
    <div className="max-w-sm">
      <Stepper {...args} />
    </div>
  ),
};

export const EdgeSingleStep: Story = {
  args: { steps: [{ id: "only", label: "Only Step" }], currentStep: 0 },
  render: (args) => (
    <div className="max-w-lg">
      <Stepper {...args} />
    </div>
  ),
};

export const EdgeLongLabels: Story = {
  args: {
    steps: [
      { id: "a", label: "Business Information And Registration" },
      { id: "b", label: "Identity & Insurance Verification" },
      { id: "c", label: "Availability" },
      { id: "d", label: "Payment" },
      { id: "e", label: "Review" },
    ],
    currentStep: 1,
  },
  render: (args) => (
    <div className="max-w-lg">
      <Stepper {...args} />
    </div>
  ),
};

/**
 * Inside an onboarding-panel-style card, mirroring how merchant-web's
 * `OnboardingPanel` wraps every wizard step — the real consumer context.
 */
export const InContext: Story = {
  args: { currentStep: 1 },
  render: (args) => (
    <div className="max-w-lg">
      <Card className="p-6 sm:p-8">
        <Stepper {...args} />
        <CardContent className="mt-6 p-0">
          <h2 className="text-xl font-medium text-[var(--text-strong)]">
            Verify your business
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            We need your ABN and a couple of documents before you can start
            accepting bookings.
          </p>
        </CardContent>
      </Card>
    </div>
  ),
};

/**
 * AUTM-744 — the merchant reached Availability, then stepped back to Business
 * Info to fix a typo. Availability stays clickable, so there is a way forward.
 *
 * Without `furthestStep` every step ahead of the current one goes dead and the
 * only escape is typing the URL. That is the bug this prop exists for; compare
 * with the story above.
 */
export const SteppedBack: Story = {
    name: 'Stepped back — the way forward survives',
    args: {
        steps: ONBOARDING_STEPS,
        currentStep: 0,
        furthestStep: 2,
        onStepClick: () => {},
    },
}

/**
 * The customer booking wizard's configuration (AUTM-837): steps are
 * validation-gated so labels never render as navigation - track + "Step N of M"
 * line only, with its own aria label.
 */
export const BookingWizard: Story = {
  args: {
    steps: [
      { id: "service", label: "Service" },
      { id: "details", label: "Details" },
      { id: "vehicle", label: "Vehicle" },
      { id: "when", label: "When" },
      { id: "where", label: "Where" },
      { id: "pay", label: "Pay" },
    ],
    currentStep: 1,
    ariaLabel: "Booking progress",
    hideLabels: true,
  },
  render: (args) => (
    <div style={{ maxWidth: 560 }}>
      <Stepper {...args} />
    </div>
  ),
};

/**
 * AUTM-1867: Wise's desktop steps. A done step says what was chosen under it,
 * the current one what it asks; the label alone stays each step's name.
 */
export const WithDetails: Story = {
    args: {
        ariaLabel: 'Booking progress',
        currentStep: 1,
        onStepClick: () => {},
        steps: [
            { id: 'what', label: 'What and when', detail: 'Express wash, Wed 14 Oct, 9:00 am' },
            { id: 'who', label: 'Who', detail: 'Find them or add them' },
            { id: 'send', label: 'Send' },
        ],
    },
    render: (args) => (
        <div className="max-w-[18rem]">
            <Stepper {...args} />
        </div>
    ),
}
