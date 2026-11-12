/**
 * "Fitzroy Paint Co" is "FP"; one word is its first letter. For MediaFrame's
 * fallback (AUTM-1781). In its own module, without 'use client', so a server
 * component can call it: a function exported from a client module is a
 * client reference on the server and throws when called there.
 */
export function initialsOf(name: string | null | undefined): string {
    const words = (name ?? '').trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) return ''
    if (words.length === 1) return words[0].slice(0, 1).toUpperCase()
    return (words[0][0] + words[1][0]).toUpperCase()
}
