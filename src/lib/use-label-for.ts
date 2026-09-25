import * as React from 'react'

/**
 * AUTM-1267 — makes a caller's `<label htmlFor={id}>` work on a composite
 * control that has no single labelable element.
 *
 * A `<label for>` only associates with, and only focuses, a labelable element
 * (an input, a button, a select). DatePicker and TimePicker are a `radiogroup`
 * of buttons with one roving tab stop, so there is nothing a `for` can point
 * at: putting the id on a day button would rename that day "Due date" and
 * make a click on the label SELECT it, and putting it on the group alone
 * leaves the label pointing at a `div` the browser will neither name it by
 * nor focus. Every caller still writes `<Label htmlFor>` above these pickers,
 * because that is what every other field on the same forms does, so the
 * component meets them where they are: it finds the label that names its
 * id, names the group by it (`aria-labelledby`), and makes a click on it
 * move focus to the day or slot that currently holds the tab stop, which is
 * what a label click does for every other field.
 *
 * Returns the label's element id to put in `aria-labelledby`, or undefined
 * when no label points at the control, in which case the caller falls back
 * to its own `aria-label`.
 */
export function useLabelFor(
    id: string | undefined,
    focusTarget: () => HTMLElement | null | undefined,
): string | undefined {
    const [labelledBy, setLabelledBy] = React.useState<string | undefined>(undefined)
    const targetRef = React.useRef(focusTarget)
    targetRef.current = focusTarget

    React.useEffect(() => {
        if (!id || typeof document === 'undefined') return
        const escaped = id.replace(/["\\]/g, '\\$&')
        const label = document.querySelector<HTMLLabelElement>(`label[for="${escaped}"]`)
        if (!label) {
            setLabelledBy(undefined)
            return
        }
        if (!label.id) label.id = `${id}-label`
        setLabelledBy(label.id)
        const onClick = (event: MouseEvent) => {
            // The label has no labelable control, so it has no activation
            // behaviour of its own; supply the one thing a label click is for.
            event.preventDefault()
            targetRef.current()?.focus()
        }
        label.addEventListener('click', onClick)
        return () => label.removeEventListener('click', onClick)
    }, [id])

    return labelledBy
}
