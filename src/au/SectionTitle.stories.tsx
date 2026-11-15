import type { Meta, StoryObj } from '@storybook/react-vite'
import { SectionTitle, PageTitle } from './SectionTitle'
import { Room } from './_story'

/** AU/SectionTitle and PageTitle: a section's heading with a link on its baseline; a screen's own title. */
const meta: Meta<typeof SectionTitle> = { title: 'AU/SectionTitle', component: SectionTitle }
export default meta
type Story = StoryObj<typeof SectionTitle>

export const Default: Story = {
    render: () => (
        <Room>
            <PageTitle>Bookings</PageTitle>
            <SectionTitle text="Book again" />
            <SectionTitle text="Near Surry Hills" link={<a href="#all">See all</a>} />
        </Room>
    ),
}
