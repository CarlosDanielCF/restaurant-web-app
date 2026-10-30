import { presentationLabel } from './presentationLabel';
import RestaurantOutlined from '@mui/icons-material/RestaurantOutlined';
import { WorkspaceEmpty } from '@/components/operational/WorkspaceEmpty';
import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useRestaurantStore } from '../Common/store/restaurantStore';
import { useRestaurantImage } from '@/hooks/useRestaurantImage';
import { Product } from './types';
import { serviceCatalogPrice } from './serviceCatalogPrice';
function ProductTile({
  product,
  onSelect,
  action,
  secondaryAction,
  resetToken = 0
}: {
  product: Product;
  onSelect: (
    id: string,
    quantity?: number,
    notes?: string
  ) => void | Promise<boolean | void>;
  action: string;
  secondaryAction?: (product: Product) => ReactNode;
  resetToken?: number;
}) {
  const [quantity, setQuantity] = useState(1),
    [notes, setNotes] = useState(''),
    [details, setDetails] = useState(false);
  const [adding, setAdding] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    if (!resetToken) return;
    setQuantity(1);
    setNotes('');
    setDetails(false);
  }, [resetToken]);
  const image = useRestaurantImage(product.images || undefined);
  const available =
    product.status === 'AVAILABLE' &&
    (!product.trackStock || product.quantity > 0);
  return (
    <Card variant='outlined' className='service-product'>
      {image ? (
        <img src={image} alt={product.name} loading='lazy' />
      ) : (
        <Box className='product-symbol'>
          <RestaurantOutlined sx={{ fontSize: 36 }} aria-hidden />
          <Typography variant='caption'>Sin imagen</Typography>
        </Box>
      )}
      <Box className='product-info'>
        <Typography fontWeight={700}>{product.name}</Typography>
        {product.category?.name && (
          <Typography variant='caption' color='text.secondary'>
            {product.category.name}
          </Typography>
        )}
        <Typography fontWeight={700}>
          {product.configuration?.courtesy
            ? 'Cortesía'
            : serviceCatalogPrice(product.price, product.options)}
        </Typography>
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
              .map((o, index) => presentationLabel(o.name, index))
              .join(' · ')}
          </Typography>
        )}
        {action === 'Agregar' && (
          <>
            <Stack
              direction='row'
              alignItems='center'
              justifyContent='space-between'
              className='product-quantity'
            >
              <Button
                aria-label={`Reducir cantidad de ${product.name}`}
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => q - 1)}
              >
                −
              </Button>
              <Typography fontWeight={800}>× {quantity}</Typography>
              <Button
                aria-label={`Aumentar cantidad de ${product.name}`}
                onClick={() => setQuantity((q) => q + 1)}
              >
                +
              </Button>
            </Stack>
            <Button size='small' onClick={() => setDetails((v) => !v)}>
              Observación{notes ? ' •' : ''}
            </Button>
            {details && (
              <TextField
                size='small'
                label={`Instrucción para ${product.name}`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
              />
            )}
          </>
        )}
        {secondaryAction?.(product)}
        <Button
          variant='outlined'
          fullWidth
          disabled={adding || (action === 'Agregar' && !available)}
          onClick={async () => {
            if (lock.current) return;
            lock.current = true;
            setAdding(true);
            try {
              await onSelect(product.id, quantity, notes);
            } finally {
              lock.current = false;
              setAdding(false);
            }
          }}
          aria-label={`${action} ${product.name}`}
        >
          {adding ? 'Agregando…' : action}
        </Button>
      </Box>
    </Card>
  );
}
export function ServiceCatalog({
  products,
  onSelect,
  action = 'Agregar',
  secondaryAction,
  captureResets = {}
}: {
  products: Product[];
  onSelect: (
    id: string,
    quantity?: number,
    notes?: string
  ) => void | Promise<boolean | void>;
  action?: string;
  secondaryAction?: (product: Product) => ReactNode;
  captureResets?: Record<string, number>;
}) {
  const restaurantName = useRestaurantStore((s) => s.restaurant?.name);
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
    <Stack spacing={1.5} className='point-catalog'>
      <Typography variant='h5' component='h3'>
        Carta{restaurantName ? ` · ${restaurantName}` : ''}
      </Typography>
      <TextField
        size='small'
        fullWidth
        className='point-catalog-search'
        label='Buscar producto'
        placeholder='Nombre del producto…'
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className='point-catalog-layout'>
        <Stack
          className='point-category-rail'
          direction='row'
          gap={0.75}
          flexWrap='wrap'
          role='group'
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
              secondaryAction={secondaryAction}
              resetToken={captureResets[p.id] || 0}
            />
          ))}
        </Box>
      </div>
      {!shown.length && (
        <WorkspaceEmpty
          title='Sin productos en esta selección'
          description='Prueba otra categoría o ajusta la búsqueda.'
        />
      )}
    </Stack>
  );
}
