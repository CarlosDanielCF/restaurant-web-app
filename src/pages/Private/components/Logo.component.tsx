import { Link } from 'react-router-dom';
import { SoftwareBrand } from '@/components/branding/SoftwareBrand';
export const Logo = () => (
  <Link to='/menu' style={{ textDecoration: 'none' }}>
    <SoftwareBrand />
  </Link>
);
