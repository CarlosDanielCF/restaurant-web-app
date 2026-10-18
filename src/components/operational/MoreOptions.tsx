import { ReactNode } from 'react';
import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined';
/** Native disclosure keeps children mounted so form values survive closing and live refresh. */
export function MoreOptions({
  title = 'Más opciones',
  children,
  defaultOpen = false,
  onToggle
}: {
  title?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  onToggle?: (open: boolean) => void;
}) {
  return (
    <details
      className='operational-disclosure'
      open={defaultOpen || undefined}
      onToggle={(e) => onToggle?.(e.currentTarget.open)}
    >
      <summary>
        <ExpandMoreOutlined aria-hidden />
        {title}
      </summary>
      <div className='operational-disclosure-content'>{children}</div>
    </details>
  );
}
