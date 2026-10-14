import React from "react";

type Variant = "ghost" | "quiet" | "solid";
type Size = "sm" | "md";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** ghost: text button with a tinted hover. quiet: icon-only. solid: the one accent action. */
  variant?: Variant;
  size?: Size;
  /** Icon-only buttons are square. */
  icon?: boolean;
  /** Opt out of the press scale where it would distract. */
  isStatic?: boolean;
}

/**
 * The one button. Every clickable chrome element in Trilist renders through
 * this so hover, press, focus and disabled behave identically.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "ghost", size = "md", icon = false, isStatic = false, className, type = "button", ...rest },
  ref,
) {
  const cls = ["btn", `btn-${variant}`, size === "sm" && "btn-sm", icon && "btn-icon", isStatic && "btn-static", className]
    .filter(Boolean)
    .join(" ");
  return <button ref={ref} type={type} className={cls} {...rest} />;
});
