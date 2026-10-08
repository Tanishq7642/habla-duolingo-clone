/**
 * Design sizes are written in px at a 16px base (readable: `size={104}`), but
 * rendered in rem so *everything* scales with the root font size, which is set
 * to 90% in globals.css to match Duolingo's denser proportions.
 */
export const rem = (px: number) => `${px / 16}rem`;
