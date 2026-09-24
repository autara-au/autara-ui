import { expect, it } from 'vitest'

// Throwaway (AUTM-1434): proves CI fails at the Test step. Never merge.
it('red proof: planted failure', () => {
    expect('RED-PROOF-PLANTED').toBe('expected')
})
