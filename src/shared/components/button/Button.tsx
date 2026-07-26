import "./Styles.scss";

type ButtonType = "default" | "outline" | "tonal";
type ButtonPalette = "primary" | "secondary";
type ButtonSize = "xs" | "sm" | "md" | "lg";

interface ButtonProps {
  type?: ButtonType;
  palette?: ButtonPalette;
  size?: ButtonSize;
  iconOnly?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  ariaHasPopup?: boolean;
  ariaPressed?: boolean;
  title?: string;
}

const Button = (props: ButtonProps) => {
  const {
    type = "default",
    palette = "primary",
    size = "md",
    iconOnly = false,
    onClick,
    disabled = false,
    children,
    ariaLabel,
    ariaExpanded,
    ariaHasPopup,
    ariaPressed,
    title,
  } = props;

  const className = `button button--${type} button--${palette} button--${size}${iconOnly ? " button--icon-only" : ""}`;

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHasPopup}
      aria-pressed={ariaPressed}
      title={title}
    >
      {children}
    </button>
  );
};

export default Button;
