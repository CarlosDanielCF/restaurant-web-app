import { Link } from 'react-router-dom';
import { SoftwareBrand } from '@/components/branding/SoftwareBrand';
export default function Logo() {
  return (
    <Link to='/overview' aria-label='Point Restaurant'>
      <SoftwareBrand compact />
    </Link>
  );
}
