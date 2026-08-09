import "./Styles.scss";

type ToggleSize = "sm" | "md";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: ToggleSize;
  disabled?: boolean;
  label?: React.ReactNode;
  ariaLabel?: string;
}

const Toggle = (props: ToggleProps) => {
  const { checked, onChange, size = "md", disabled = false, label, ariaLabel } = props;

  const className = `toggle ${size}${checked ? " checked" : ""}`;

  const control = (
    <button
      type="button"
      role="switch"
      className={className}
      aria-checked={checked}
      aria-label={label ? undefined : ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span className="thumb" />
    </button>
  );

  return label ? (
    <label className={`toggleField${disabled ? " disabled" : ""}`}>
      {control}
      <span className="label">{label}</span>
    </label>
  ) : (
    control
  );
};

export default Toggle;
