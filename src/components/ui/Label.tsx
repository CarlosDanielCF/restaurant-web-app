import { FC, ReactNode } from 'react';
import { styled } from '@mui/material/styles';

interface LabelProps {
  className?: string;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'info';
  children?: ReactNode;
  sx?: any;
}

const LabelWrapper = styled('span')(
  ({ theme }) => `
      background-color: ${theme.colors.alpha.black[5]};
      padding: 3px 10px;
      font-size: 0.725rem;
      font-weight: 650;
      line-height: 1.25;
      letter-spacing: 0.02em;
      border-radius: 9999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid transparent;
      white-space: nowrap;
      transition: all 0.15s ease;
      
      &.MuiLabel {
        &-primary {
          background-color: #f0fdfa;
          color: #0d9488;
          border-color: rgba(13, 148, 136, 0.25);
        }
        
        &-secondary {
          background-color: #f8fafc;
          color: #475569;
          border-color: rgba(148, 163, 184, 0.25);
        }
        
        &-success {
          background-color: #ecfdf5;
          color: #059669;
          border-color: rgba(16, 185, 129, 0.25);
        }
        
        &-warning {
          background-color: #fffbeb;
          color: #d97706;
          border-color: rgba(245, 158, 11, 0.25);
        }
              
        &-error {
          background-color: #fef2f2;
          color: #dc2626;
          border-color: rgba(239, 68, 68, 0.25);
        }
        
        &-info {
          background-color: #f0f9ff;
          color: #0284c7;
          border-color: rgba(14, 165, 233, 0.25);
        }
      }
`
);

export const Label: FC<LabelProps> = ({
  className = '',
  color = 'secondary',
  children,
  sx,
  ...rest
}) => {
  return (
    <LabelWrapper className={'MuiLabel-' + color} {...rest} sx={sx}>
      {children}
    </LabelWrapper>
  );
};
