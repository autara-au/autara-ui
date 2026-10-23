'use client'

import * as React from 'react'
import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react'
import { cn } from '../lib/cn'
import { motionDurations, motionEasings } from '../lib/motion-tokens'

/*
 * AUTM-2025: these ran on their own numbers (500 to 600ms, 20 to 30px) and
 * ignored a reader who asked for less motion, because the stylesheet's
 * reduced-motion clamp cannot reach an animation driven from JS. They now
 * use the `--motion-reveal` rise (16px over 480ms on the house ease-out) and
 * `--motion-stagger`, and with reduced motion they render in place: no rise,
 * no scale, no fade.
 */

/** The `--motion-reveal` rise, in px. Kept equal to `@keyframes autara-reveal`. */
const RISE = 16

// Plain lookups, not `motionTransition()`: a call at import time breaks the
// tree-shaking contract (side-effects.test.ts, AUTM-1688).
const reveal = { duration: motionDurations.reveal / 1000, ease: motionEasings.out }

/** Fade in from bottom */
export function FadeIn({
    className,
    children,
    delay = 0,
    duration = reveal.duration,
    ...props
}: HTMLMotionProps<'div'> & { delay?: number; duration?: number }) {
    const reduce = useReducedMotion()
    return (
        <motion.div
            initial={reduce ? false : { opacity: 0, y: RISE }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration, delay, ease: reveal.ease }}
            className={cn(className)}
            {...props}
        >
            {children}
        </motion.div>
    )
}

/** Fade in when scrolled into viewport */
export function FadeInView({
    className,
    children,
    delay = 0,
    duration = reveal.duration,
    ...props
}: HTMLMotionProps<'div'> & { delay?: number; duration?: number }) {
    const reduce = useReducedMotion()
    return (
        <motion.div
            initial={reduce ? false : { opacity: 0, y: RISE }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration, delay, ease: reveal.ease }}
            className={cn(className)}
            {...props}
        >
            {children}
        </motion.div>
    )
}

/** Scale in animation */
export function ScaleIn({
    className,
    children,
    delay = 0,
    duration = reveal.duration,
    ...props
}: HTMLMotionProps<'div'> & { delay?: number; duration?: number }) {
    const reduce = useReducedMotion()
    return (
        <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration, delay, ease: reveal.ease }}
            className={cn(className)}
            {...props}
        >
            {children}
        </motion.div>
    )
}

/** Stagger children animations */
export function StaggerContainer({
    className,
    children,
    staggerDelay = motionDurations.stagger / 1000,
    ...props
}: HTMLMotionProps<'div'> & { staggerDelay?: number }) {
    const reduce = useReducedMotion()
    return (
        <motion.div
            initial={reduce ? false : 'hidden'}
            animate="visible"
            variants={{
                hidden: {},
                visible: { transition: { staggerChildren: staggerDelay } },
            }}
            className={cn(className)}
            {...props}
        >
            {children}
        </motion.div>
    )
}

/** Item for use inside StaggerContainer */
export function StaggerItem({
    className,
    children,
    ...props
}: HTMLMotionProps<'div'>) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: RISE },
                visible: { opacity: 1, y: 0, transition: reveal },
            }}
            className={cn(className)}
            {...props}
        >
            {children}
        </motion.div>
    )
}
