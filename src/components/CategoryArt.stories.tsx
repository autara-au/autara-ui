import type { Meta, StoryObj } from '@storybook/react-vite'
import { CategoryArt } from './CategoryArt'

/**
 * AUTM-1105, moved here for AUTM-1800: light, not objects. The art Autara
 * draws where a photograph would be: the category tiles, the marketing hero,
 * and a pro's cover when they have no photo.
 */
const meta: Meta<typeof CategoryArt> = {
    title: 'Marketplace/CategoryArt',
    component: CategoryArt,
    parameters: { layout: 'padded' },
    args: { kind: 'exterior' },
    argTypes: { kind: { control: 'inline-radio', options: ['exterior', 'interior', 'protection'] } },
    render: (args) => (
        <div style={{ position: 'relative', width: 320, aspectRatio: '4 / 3', borderRadius: 24, overflow: 'hidden' }}>
            <CategoryArt {...args} className="absolute inset-0 h-full w-full" />
        </div>
    ),
}
export default meta
type Story = StoryObj<typeof CategoryArt>

export const Exterior: Story = { args: { kind: 'exterior', idPrefix: 'story-exterior' } }
export const Interior: Story = { args: { kind: 'interior', idPrefix: 'story-interior' } }
export const Protection: Story = { args: { kind: 'protection', idPrefix: 'story-protection' } }

/** The three together, each with its own id prefix: two of one kind on a page must not share gradient ids. */
export const AllKinds: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {(['exterior', 'interior', 'protection'] as const).map((kind) => (
                <div
                    key={kind}
                    style={{ position: 'relative', width: 200, aspectRatio: '4 / 3', borderRadius: 20, overflow: 'hidden' }}
                >
                    <CategoryArt kind={kind} idPrefix={`all-${kind}`} className="absolute inset-0 h-full w-full" />
                </div>
            ))}
        </div>
    ),
}

/** Dark theme: artwork, so it reads as it does in light. */
export const Dark: Story = { globals: { theme: 'dark' }, args: { kind: 'exterior', idPrefix: 'story-dark' } }
