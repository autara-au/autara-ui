import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LockedFeature } from './LockedFeature'

/**
 * AUTM-1308 — two properties, and neither is about how it looks.
 *
 * FAIL OPEN. `locked={false}` renders the real thing. That is also the value a
 * caller passes while the entitlement read is unresolved or has failed, so
 * this is the path a merchant lands on when the server cannot answer. Hiding
 * work from someone entitled to do it is the expensive direction; an extra
 * click is not.
 *
 * THE CHILDREN MUST NOT BE IN THE DOM WHEN LOCKED. The tempting design is the
 * real content behind a blur, and it is the one thing this component must not
 * do: a paywall drawn over real customer data is a data leak wearing a design,
 * and the data is still there for anyone who opens the inspector. Testing for
 * absence rather than for invisibility is the whole point.
 */
describe('LockedFeature', () => {
	it('renders the feature untouched when it is not locked', () => {
		render(
			<LockedFeature locked={false} title="Customer directory is on Pro">
				<p>Ava Mitchell</p>
			</LockedFeature>,
		)

		expect(screen.getByText('Ava Mitchell')).toBeTruthy()
		expect(screen.queryByText('Customer directory is on Pro')).toBeNull()
	})

	it('does not put the locked content in the DOM at all', () => {
		render(
			<LockedFeature locked title="Customer directory is on Pro">
				<p>Ava Mitchell</p>
			</LockedFeature>,
		)

		// Not "is hidden". Absent.
		expect(screen.queryByText('Ava Mitchell')).toBeNull()
		expect(screen.getByText('Customer directory is on Pro')).toBeTruthy()
	})

	it('names the locked region by its title, so a screen reader says what is locked', () => {
		render(<LockedFeature locked title="Packages are on Pro" />)

		expect(screen.getByRole('region', { name: 'Packages are on Pro' })).toBeTruthy()
	})

	it('renders no action of its own when the caller gives none', () => {
		// The native case (App Store 3.1.3(f)): no price, no purchase button,
		// no link out. The component must not invent one to fill the space.
		const { container } = render(
			<LockedFeature locked title="Packages are on Pro" description="Manage your plan on the web." />,
		)

		expect(container.querySelectorAll('button').length).toBe(0)
		expect(container.querySelectorAll('a').length).toBe(0)
	})

	it('keeps the row variant to one line each for title and description', () => {
		render(
			<LockedFeature
				locked
				variant="inline"
				title="Earnings insights"
				description="Trends, busiest days and repeat-customer rates."
			/>,
		)

		expect(screen.getByText('Earnings insights').className).toContain('truncate')
	})
})
