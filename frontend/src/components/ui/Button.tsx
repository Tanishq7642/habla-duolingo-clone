import clsx from "clsx";
import Link, { type LinkProps } from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "sun" | "ghost" | "plain";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-leaf-500 text-white border-leaf-700 hover:bg-leaf-400",
  secondary: "bg-ocean-500 text-white border-ocean-700 hover:bg-ocean-400",
  danger: "bg-coral-500 text-white border-coral-700 hover:bg-coral-400",
  sun: "bg-sun-500 text-white border-sun-600 hover:bg-sun-400",
  ghost: "bg-white text-ink-700 border-ink-200 hover:bg-ink-50",
  plain: "bg-transparent text-ocean-600 border-transparent hover:bg-ocean-50 !border-b-0",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-base",
  lg: "h-14 px-8 text-lg",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
}

const BASE = clsx(
  "relative inline-flex select-none items-center justify-center gap-2 rounded-2xl border-2 border-b-[5px]",
  "font-extrabold uppercase tracking-wide transition-[transform,background-color,border-width] duration-75",
  "active:translate-y-[3px] active:border-b-2",
);

export function buttonClasses(variant: Variant = "primary", size: Size = "md", block?: boolean, className?: string) {
  return clsx(BASE, variants[variant], sizes[size], block && "w-full", className);
}

/** Chunky "3D" button: thick bottom border that collapses on press. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", block, loading, disabled, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses(
        variant,
        size,
        block,
        clsx(
          "disabled:cursor-not-allowed disabled:border-ink-200 disabled:bg-ink-200 disabled:text-ink-400 disabled:active:translate-y-0 disabled:active:border-b-[5px]",
          className,
        ),
      )}
      {...rest}
    >
      {loading ? <span className="h-5 w-5 animate-spin rounded-full border-[3px] border-current border-t-transparent" /> : children}
    </button>
  );
});

/** Navigation that looks like a button (a real link: middle-click, prefetch, a11y). */
export function ButtonLink({
  href,
  variant,
  size,
  block,
  className,
  children,
  ...rest
}: LinkProps & { variant?: Variant; size?: Size; block?: boolean; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={buttonClasses(variant, size, block, className)} {...rest}>
      {children}
    </Link>
  );
}
