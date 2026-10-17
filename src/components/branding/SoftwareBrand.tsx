import './software-brand.css';
export const SOFTWARE_NAME = 'Point Restaurant';
export const SOFTWARE_LOGO = '/branding/point-restaurant-logo.png';
export function SoftwareBrand({
  compact = false,
  login = false
}: {
  compact?: boolean;
  login?: boolean;
}) {
  return (
    <div
      className={`software-brand${compact ? ' software-brand--compact' : ''}${login ? ' software-brand--login' : ''}`}
      title={SOFTWARE_NAME}
    >
      <img
        src={SOFTWARE_LOGO}
        alt='Logo de Point Restaurant'
        width={1300}
        height={1200}
      />
      {!compact && <span>{SOFTWARE_NAME}</span>}
    </div>
  );
}
