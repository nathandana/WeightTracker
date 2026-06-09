import { useEffect, useRef } from "react";
import "./dialog.css";
import { Icon } from "../icon/Icon.jsx";
import { IconButton } from "../icon-button/IconButton.jsx";
import { ButtonContainer } from "../button-container/ButtonContainer.jsx";

const HERO_COLORS = {
  success: "var(--semantic-color-status-success-background)",
  error:   "var(--semantic-color-status-error-background)",
  warn:    "var(--semantic-color-status-warn-background)",
  info:    "var(--semantic-color-status-info-background)",
  neutral: "var(--semantic-color-surface-inverse)",
};

const STATUS_ICONS = {
  success: "check_circle",
  error:   "error",
  warn:    "warning",
  info:    "info",
  neutral: "info",
};

const FOCUSABLE_SELECTORS = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export function Dialog({
  open = false,
  onClose,
  title,
  footer,
  status,
  icon,
  children,
  className = "",
  ...props
}) {
  const ref = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      triggerRef.current = document.activeElement;
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
      triggerRef.current?.focus();
      triggerRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleCancel = (e) => {
      e.preventDefault();
      onClose?.();
    };
    el.addEventListener("cancel", handleCancel);
    return () => el.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  useEffect(() => {
    const el = ref.current;
    if (!open || !el) return;
    const handleKeyDown = (e) => {
      if (e.key !== "Tab") return;
      const focusable = [...el.querySelectorAll(FOCUSABLE_SELECTORS)];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const heroBg = status ? (HERO_COLORS[status] ?? HERO_COLORS.neutral) : null;
  const resolvedIcon = icon ?? (status ? STATUS_ICONS[status] : null);
  const hasHeader = title || onClose;

  const classes = [
    "a1-dialog",
    status && "a1-dialog--has-hero",
    className,
  ].filter(Boolean).join(" ");

  return (
    <dialog ref={ref} className={classes} {...props}>
      {status && (
        <div className="a1-dialog__hero" style={{ "--a1-dialog-hero-bg": heroBg }}>
          {resolvedIcon && <Icon name={resolvedIcon} aria-hidden="true" />}
        </div>
      )}
      {hasHeader && (
        <div className="a1-dialog__header">
          {title && <p className="a1-dialog__title">{title}</p>}
          {onClose && (
            <IconButton
              icon="close"
              label="Close dialog"
              onClick={onClose}
              className="a1-dialog__close"
            />
          )}
        </div>
      )}
      <div className="a1-dialog__body" tabIndex={0}>{children}</div>
      {footer && (
        <div className="a1-dialog__footer">
          <ButtonContainer align="end">{footer}</ButtonContainer>
        </div>
      )}
    </dialog>
  );
}
