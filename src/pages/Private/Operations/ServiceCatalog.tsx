import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import RestaurantMenuOutlined from '@mui/icons-material/RestaurantMenuOutlined';
import { useRestaurantImage } from '@/hooks/useRestaurantImage';
import { Product } from './types';
function ProductTile({
  product,
  onSelect,
  action
}: {
  product: Product;
  onSelect: (id: string) => void;
  action: string;
}) {
  const image = useRestaurantImage(product.images || undefined);
  const available = product.status === 'AVAILABLE';
  return (
    <Card variant='outlined' className='service-product'>
      {image ? (
        <img src={image} alt={product.name} loading='lazy' />
      ) : (
        <Box className='product-symbol'>
          <RestaurantMenuOutlined />
        </Box>
      )}
      <Box className='product-info'>
        <Typography fontWeight={700}>{product.name}</Typography>
        {product.category?.name && (
          <Typography variant='caption' color='text.secondary'>
            {product.category.name}
          </Typography>
        )}
        <Typography fontWeight={700}>S/ {product.price}</Typography>
        <Chip
          size='small'
          color={available ? 'success' : 'warning'}
          variant='outlined'
          label={available ? 'Disponible' : 'Agotado'}
        />
        {product.trackStock && (
          <Typography variant='caption' display='block'>
            {product.quantity} porciones
          </Typography>
        )}
        {!!product.options?.filter((o) => o.isActive).length && (
          <Typography variant='caption' display='block'>
            {product.options
              .filter((o) => o.isActive)
              .map((o) => o.name)
              .join(' · ')}
          </Typography>
        )}
        <Button
          variant='outlined'
          fullWidth
          disabled={action === 'Agregar' && !available}
          onClick={() => onSelect(product.id)}
          aria-label={`${action} ${product.name}`}
        >
          {action}
        </Button>
      </Box>
    </Card>
  );
}
export function ServiceCatalog({
  products,
  onSelect,
  action = 'Agregar'
}: {
  products: Product[];
  onSelect: (id: string) => void;
  action?: string;
}) {
  const [search, setSearch] = useState(''),
    [category, setCategory] = useState('');
  const active = products.filter((p) => p.isActive);
  const categories = Array.from(
    new Map(
      active
        .filter((p) => p.category)
        .map((p) => [p.category!.id, p.category!.name])
    ).entries()
  );
  const shown = active.filter(
    (p) =>
      (!category || p.category?.id === category) &&
      p.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
  );
  return (
    <Stack spacing={1.5}>
      <TextField
        size='small'
        fullWidth
        label='Buscar producto'
        placeholder='Nombre del producto…'
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Stack
        direction='row'
        gap={0.75}
        flexWrap='wrap'
        aria-label='Categorías de carta'
      >
        <Chip
          label='Todos'
          clickable
          color={!category ? 'primary' : 'default'}
          onClick={() => setCategory('')}
        />
        {categories.map(([id, name]) => (
          <Chip
            key={id}
            label={name}
            clickable
            color={category === id ? 'primary' : 'default'}
            onClick={() => setCategory(id)}
          />
        ))}
      </Stack>
      <Box className='service-product-grid'>
        {shown.map((p) => (
          <ProductTile
            key={p.id}
            product={p}
            onSelect={onSelect}
            action={action}
          />
        ))}
      </Box>
      {!shown.length && (
        <Typography className='operation-empty'>
          No hay productos que coincidan con esta selección.
        </Typography>
      )}
    </Stack>
  );
}
