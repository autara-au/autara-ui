import type { Meta, StoryObj } from '@storybook/react-vite'

/**
 * # Scrollbars
 *
 * AUTM-1739 (Don, 2026-10-05: "scroll bars in windows pretty much ugly
 * default, need visual perfection on scroll views as well"), then AUTM-1756
 * (Don, 2026-10-15: "it's bad when I see the scroll bar, make it brand
 * native"). Every scroll area takes these from utilities/scrollbars.css, in
 * the base layer: a thin, rounded thumb in the brand purple, 3:1 or better
 * on every ground. A ScrollArea (or a scroller given `useScrollbarReveal`)
 * shows it only while the pointer is over it, while focus is inside it and
 * while it scrolls; any other scroller shows it at rest, so it can always be
 * found. Nothing is hidden. On a brand-deep ground, `.scroll-on-deep`
 * (or `data-ground="deep"`) takes the lighter purple thumb. Under forced
 * colours the system draws its own; a finger keeps the platform's overlay bar.
 *
 * Overlay scrollbars (macOS by default, phones) only show while scrolling;
 * Chrome and Safari draw the brand thumb in place of them when a mouse or a
 * trackpad is the pointer.
 */
const meta = {
    title: 'Foundations/Scrollbars',
    parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const rows = Array.from({ length: 24 }, (_, i) => `Booking ${i + 1} · Full Interior Clean · $189`)

function Scrollers({ deep }: { deep?: boolean }) {
    const card = { background: deep ? 'rgb(255 255 255 / 0.06)' : 'var(--band)', borderRadius: '1rem', padding: '1rem' }
    return (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))' }}>
            <section style={card} aria-label="A vertical list">
                <h3 style={{ margin: '0 0 0.5rem', color: 'inherit' }}>A list (a dialog, a sheet, a dropdown)</h3>
                <ul tabIndex={0} style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: '12rem', overflowY: 'auto' }}>
                    {rows.map((r) => (
                        <li key={r} style={{ padding: '0.5rem 0' }}>
                            {r}
                        </li>
                    ))}
                </ul>
            </section>
            <section style={card} aria-label="A horizontal rail">
                <h3 style={{ margin: '0 0 0.5rem', color: 'inherit' }}>A rail (kept visible)</h3>
                <div tabIndex={0} style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {rows.slice(0, 12).map((r) => (
                        <div key={r} style={{ flex: 'none', width: '10rem', borderRadius: '0.75rem', padding: '0.75rem', background: 'var(--paper)', color: 'var(--strong)' }}>
                            {r}
                        </div>
                    ))}
                </div>
            </section>
            <section style={card} aria-label="A wide table">
                <h3 style={{ margin: '0 0 0.5rem', color: 'inherit' }}>A table</h3>
                <div tabIndex={0} style={{ overflow: 'auto', maxHeight: '12rem' }}>
                    <table style={{ borderCollapse: 'collapse', minWidth: '40rem' }}>
                        <tbody>
                            {rows.map((r, i) => (
                                <tr key={r}>
                                    <td style={{ padding: '0.375rem 0.75rem' }}>{i + 1}</td>
                                    <td style={{ padding: '0.375rem 0.75rem' }}>{r}</td>
                                    <td style={{ padding: '0.375rem 0.75rem' }}>Tue 13 Oct</td>
                                    <td style={{ padding: '0.375rem 0.75rem' }}>Confirmed</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    )
}

function Ground({ deep }: { deep?: boolean }) {
    return (
        <div
            className={deep ? 'scroll-on-deep' : undefined}
            style={{
                background: deep ? 'var(--hero)' : 'var(--paper)',
                color: deep ? 'var(--on-deep)' : 'var(--strong)',
                padding: '1.5rem',
                height: '100vh',
                overflowY: 'auto',
                boxSizing: 'border-box',
            }}
        >
            <h2 style={{ marginTop: 0, color: 'inherit' }}>{deep ? 'On the brand-deep ground' : 'On the light ground'}</h2>
            <Scrollers deep={deep} />
            {/* Tall enough that the ground itself scrolls, standing in for a page. */}
            <div style={{ height: '120vh' }} />
        </div>
    )
}

export const LightGround: Story = { render: () => <Ground /> }
export const DeepGround: Story = { render: () => <Ground deep /> }

/** Both grounds side by side, each scrolling as a page would. */
export const BothGrounds: Story = {
    render: () => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100vh' }}>
            <Ground />
            <Ground deep />
        </div>
    ),
}
