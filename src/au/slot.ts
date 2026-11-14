import * as React from 'react'

/**
 * For `asChild`: the one child (a link, a button) keeps its own props and
 * takes `inner` as its content, so a piece can draw its insides into the
 * consumer's element (`<DiscRow asChild><Link href="/x" /></DiscRow>`).
 */
export function withInner(children: React.ReactNode, inner: React.ReactNode): React.ReactElement {
    const child = React.Children.only(children) as React.ReactElement<{ children?: React.ReactNode }>
    return React.cloneElement(child, undefined, inner)
}
