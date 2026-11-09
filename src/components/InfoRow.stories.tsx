import type { Meta, StoryObj } from '@storybook/react-vite'
import { InfoRow } from './InfoRow'

const meta: Meta<typeof InfoRow> = {
    title: 'Molecules/InfoRow',
    component: InfoRow,
    parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof InfoRow>

export const Default: Story = {
    args: { label: 'Subtotal', value: '$230.00' },
}

export const Emphasised: Story = {
    args: { label: 'Total', value: '$253.00', emphasised: true },
}

export const TextValue: Story = {
    args: { label: 'Status', value: 'Deposit captured' },
}

export const InPaymentSummary: Story = {
    name: 'In context — payment summary card',
    render: () => (
        // AUTM-2042 (Don, 2026-11-08: no hairlines): a band card, rows apart by space.
        <div className="w-[420px] rounded-[1.5rem] bg-[var(--band)] p-5">
            <p className="text-[0.75rem] font-medium text-[var(--text-subtle)]">
                Payment
            </p>
            <div className="mt-2">
                <InfoRow label="Subtotal" value="$230.00" />
                <InfoRow label="Deposit captured" value="$50.00" />
                <InfoRow label="Add-on — interior" value="$45.00" />
                <InfoRow label="Total" value="$320.00" emphasised />
            </div>
        </div>
    ),
}
