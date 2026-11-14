import * as React from 'react'

/** Stories only: the Stone room behind a piece, at a phone's width. */
export function Room({ children, width = 390 }: { children: React.ReactNode; width?: number }) {
    return (
        <div className="au-room" style={{ padding: 20, maxWidth: width, display: 'grid', gap: 16, fontFamily: 'var(--font-brand)' }}>
            {children}
        </div>
    )
}
