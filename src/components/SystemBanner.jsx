import './system-banner.css';
import { Icon, IconButton } from '@gtivr4/a1-design-system-react';

const STATUS_ICONS = {
  neutral: 'campaign',
  info:    'info',
  success: 'check_circle',
  warn:    'warning',
  error:   'error',
};

const STATUSES = ['neutral', 'info', 'success', 'warn', 'error'];

export function SystemBanner({ status = 'neutral', title, icon, action, onDismiss, children }) {
  const resolvedStatus = STATUSES.includes(status) ? status : 'neutral';
  const resolvedIcon = icon ?? STATUS_ICONS[resolvedStatus];

  return (
    <div className={`a1-system-banner a1-system-banner--${resolvedStatus}`} role="alert" aria-live="polite">
      <div className="a1-system-banner__inner">
        <span className="a1-system-banner__icon" aria-hidden="true">
          <Icon name={resolvedIcon} />
        </span>
        <div className="a1-system-banner__content">
          {title    && <span className="a1-system-banner__title">{title}</span>}
          {children && <span className="a1-system-banner__body">{children}</span>}
        </div>
        {action && <div className="a1-system-banner__action">{action}</div>}
        {onDismiss && (
          <IconButton icon="close" label="Dismiss" onClick={onDismiss} className="a1-system-banner__dismiss" />
        )}
      </div>
    </div>
  );
}
