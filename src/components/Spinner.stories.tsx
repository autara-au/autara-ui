import type { Meta, StoryObj } from "@storybook/react-vite";
import { Spinner } from "./Spinner";

/**
 * Spinner — an indeterminate "still working" indicator (AUTM-1046).
 *
 * For work in progress on something already on screen: a photo uploading, a
 * save running. For content that has not arrived yet, use a shape-matched
 * `Skeleton`; when a real percentage exists, use `Progress`.
 *
 * Check every story in both themes with the Theme toolbar. `tone="accent"`
 * reads `--accent`, which lifts in dark so the ring never disappears.
 */
const meta = {
  title: "Atoms/Spinner",
  component: Spinner,
  parameters: { layout: "padded" },
  args: { size: "md", tone: "accent", label: "Loading" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    tone: { control: "inline-radio", options: ["accent", "current", "on-photo"] },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

const PHOTO =
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=70";

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-8">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <Spinner size={size} label={`Loading, ${size}`} />
          <span className="text-sm text-[var(--text-muted)]">{size}</span>
        </div>
      ))}
    </div>
  ),
};

/**
 * The AUTM-1046 context. The merchant-mobile uploaders dim the photo and, until
 * now, laid a static "Uploading…" caption across it. On a slow connection that
 * looked the same as a stuck upload.
 *
 * The cover (a wide frame) carries the spinner plus one line of text, which is
 * `decorative` because the visible text already says it. The 64px avatar
 * carries the spinner alone, with the words in its accessible label, so no
 * text runs over the logo. The scrim is what makes `on-photo` legible: white
 * over `bg-black/60` stays above 4.5:1 even on a white photo.
 */
export const OnAPhoto: Story = {
  name: "In context — photo uploading",
  render: () => (
    <div className="flex max-w-xl flex-col gap-6">
      <div className="relative h-40 w-full overflow-hidden rounded-2xl">
        <img src={PHOTO} alt="Workshop cover photo" className="h-full w-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60">
          <Spinner tone="on-photo" size="md" decorative />
          <p className="text-sm font-medium text-white">Uploading…</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-full">
          <img src={PHOTO} alt="Business logo" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Spinner tone="on-photo" size="md" label="Uploading profile picture" />
          </div>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          The avatar shows the spinner only. The button beside it carries the
          word once.
        </p>
      </div>
    </div>
  ),
};

/**
 * The themed alternative to a dark scrim: the uploaders' existing
 * `--surface`/70 wash. `tone="accent"` reads on it in both themes, so no
 * static colour is involved at all.
 */
export const OnASurfaceWash: Story = {
  name: "In context — photo under a surface wash",
  render: () => (
    <div className="relative h-40 w-full max-w-xl overflow-hidden rounded-2xl">
      <img src={PHOTO} alt="Service photo" className="h-full w-full object-cover" />
      <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface)]/70 backdrop-blur-[1px]">
        <Spinner size="lg" label="Uploading service photo" />
      </div>
    </div>
  ),
};

/**
 * Next to visible text that already says what is happening. `decorative`
 * makes the spinner `aria-hidden`, so a screen reader reads the words once.
 * `tone="current"` picks up the text colour of the row.
 */
export const Decorative: Story = {
  render: () => (
    <p className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-strong)]">
      <Spinner size="sm" tone="current" decorative />
      Saving your opening hours…
    </p>
  ),
};

/** Edge case: a long, specific label is announced in full and takes no space. */
export const LongLabel: Story = {
  name: "Edge — long accessible label",
  args: {
    label: "Uploading the cover photo for Northside Mobile Detailing, this can take a few seconds on a slow connection",
  },
};

/**
 * Storybook cannot emulate `prefers-reduced-motion`. To check it: DevTools →
 * Rendering → Emulate CSS media feature prefers-reduced-motion → reduce, then
 * reload this story.
 */
export const ReducedMotion: Story = {
  name: "A11y — prefers-reduced-motion",
  render: () => (
    <div className="max-w-2xl space-y-3 rounded-autara-lg bg-[var(--surface)] p-6">
      <div className="flex items-center gap-3">
        <Spinner size="lg" label="Uploading photo" />
        <h3 className="text-base font-medium text-[var(--text-strong)]">
          What a reduced-motion user gets
        </h3>
      </div>
      <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--text-muted)]">
        <li>The ring does not spin, and nothing pulses.</li>
        <li>
          The quarter arc is replaced by a still, dashed ring. A frozen arc
          would look like the stuck upload this component exists to rule out,
          so the still state is a different shape, not the same one stopped.
        </li>
        <li>The accessible label is unchanged, so a screen reader hears the same thing.</li>
      </ul>
      <p className="text-sm leading-relaxed text-[var(--text-muted)]">
        To check: DevTools, Rendering, Emulate CSS media feature
        prefers-reduced-motion: reduce, then reload.
      </p>
    </div>
  ),
};
