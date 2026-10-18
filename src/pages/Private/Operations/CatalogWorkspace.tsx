import { MoreOptions } from '@/components/operational/MoreOptions';
import {
  CheckCircleOutline,
  RemoveCircleOutline,
  SaveOutlined
} from '@mui/icons-material';
import { ServiceCatalog } from './ServiceCatalog';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { Link } from 'react-router-dom';
import { Configuration, Portion, Product } from './types';
import { Run } from './Operations.page';
const emptyConfig = (): Configuration => ({
  modifiers: [],
  combo: [],
  courtesy: false
});
export function CatalogWorkspace({
  products,
  portions,
  manager,
  availability,
  run
}: {
  products: Product[];
  portions: Portion[];
  manager: boolean;
  availability: boolean;
  run: Run;
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [config, setConfig] = useState<Configuration>(emptyConfig());
  const [portion, setPortion] = useState<Partial<Portion>>({
    name: '',
    availabilityUnits: 0.5,
    isActive: true
  });
  function select(id: string) {
    const p = products.find((p) => p.id === id);
    setProduct(p ? structuredClone(p) : null);
    setConfig(structuredClone(p?.configuration ?? emptyConfig()));
  }
  async function save() {
    if (!product) return;
    const body = manager
      ? {
          name: product.name,
          price: Number(product.price),
          kind: product.kind,
          productionRouting: product.productionRouting,
          configuration: config,
          status: product.status,
          quantity: Number(product.quantity),
          trackStock: product.trackStock,
          expectedVersion: product.version
        }
      : {
          status: product.status,
          quantity: Number(product.quantity),
          trackStock: product.trackStock,
          expectedVersion: product.version
        };
    if (await run(`/products/${product.id}`, body, 'patch')) setProduct(null);
  }
  return (
    <Stack spacing={2}>
      <Typography variant='h5' component='h2'>
        Carta y disponibilidad
      </Typography>
      <Typography color='text.secondary'>
        Consulta la carta permanente y actualiza las porciones disponibles.
      </Typography>
      {manager && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            variant='contained'
            component={Link}
            to='/menu/products/create'
          >
            Crear producto
          </Button>
          <Button component={Link} to='/menu/products'>
            Categorías, productos y presentaciones
          </Button>
        </Stack>
      )}
      <ServiceCatalog
        products={products}
        action={manager || availability ? 'Gestionar' : 'Consultar'}
        onSelect={select}
        secondaryAction={
          availability
            ? (p) => (
                <Button
                  fullWidth
                  startIcon={
                    p.status === 'AVAILABLE' ? (
                      <RemoveCircleOutline />
                    ) : (
                      <CheckCircleOutline />
                    )
                  }
                  color={p.status === 'AVAILABLE' ? 'warning' : 'success'}
                  onClick={() => {
                    if (p.trackStock && p.quantity <= 0) select(p.id);
                    else
                      void run(
                        `/products/${p.id}`,
                        {
                          status:
                            p.status === 'AVAILABLE'
                              ? 'OUT_OF_STOCK'
                              : 'AVAILABLE',
                          expectedVersion: p.version
                        },
                        'patch'
                      );
                  }}
                >
                  {p.trackStock && p.quantity <= 0
                    ? 'Configurar porciones'
                    : p.status === 'AVAILABLE'
                      ? 'Marcar agotado'
                      : 'Marcar disponible'}
                </Button>
              )
            : undefined
        }
      />
      <details className='secondary-account-selector'>
        <summary>Seleccionar producto por nombre</summary>
        <TextField
          select
          label='Producto de carta'
          value={product?.id || ''}
          onChange={(e) => select(e.target.value)}
          fullWidth
        >
          {products
            .filter((p) => p.isActive)
            .map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name} · S/{p.price} ·{' '}
                {p.status === 'AVAILABLE' ? 'Disponible' : 'Agotado'}
                {p.trackStock ? ` · ${p.quantity} porciones` : ''}
              </MenuItem>
            ))}
        </TextField>
      </details>
      {product && (
        <Dialog open onClose={() => setProduct(null)} fullWidth maxWidth='sm'>
          <DialogTitle>Carta y disponibilidad · {product.name}</DialogTitle>
          <DialogContent>
            <Button onClick={() => setProduct(null)}>Volver al catálogo</Button>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <TextField
                    label='Nombre'
                    value={product.name}
                    disabled={!manager}
                    onChange={(e) =>
                      setProduct({ ...product, name: e.target.value })
                    }
                  />
                  <TextField
                    select
                    label='Preparación / entrega'
                    disabled={!manager}
                    value={product.productionRouting || 'PRODUCTION'}
                    onChange={(e) =>
                      setProduct({
                        ...product,
                        productionRouting: e.target
                          .value as Product['productionRouting']
                      })
                    }
                    helperText='Independiente de comida o bebida. Los combos y menús usan el ruteo de sus componentes.'
                  >
                    <MenuItem value='PRODUCTION'>
                      Requiere producción / cocina
                    </MenuItem>
                    <MenuItem value='DIRECT'>Entrega directa por mozo</MenuItem>
                  </TextField>
                  <TextField
                    select
                    label='Clasificación'
                    value={product.kind}
                    disabled={!manager}
                    onChange={(e) =>
                      setProduct({
                        ...product,
                        kind: e.target.value as Product['kind']
                      })
                    }
                  >
                    <MenuItem value='FOOD'>Comida</MenuItem>
                    <MenuItem value='DRINK'>Bebida</MenuItem>
                  </TextField>
                  <TextField
                    label='Precio permanente (S/)'
                    type='number'
                    inputProps={{ min: 0, step: 0.01 }}
                    value={product.price}
                    disabled={!manager}
                    onChange={(e) =>
                      setProduct({ ...product, price: Number(e.target.value) })
                    }
                  />
                  <TextField
                    select
                    label='Disponibilidad'
                    value={product.status}
                    disabled={!availability}
                    onChange={(e) =>
                      setProduct({ ...product, status: e.target.value })
                    }
                  >
                    <MenuItem value='AVAILABLE'>Disponible</MenuItem>
                    <MenuItem value='OUT_OF_STOCK'>Agotado</MenuItem>
                    <MenuItem value='OUT_OF_SEASON'>
                      Fuera de temporada
                    </MenuItem>
                  </TextField>
                  <FormControlLabel
                    label='Controlar cantidad de porciones'
                    control={
                      <Checkbox
                        checked={!!product.trackStock}
                        disabled={!availability}
                        onChange={(e) =>
                          setProduct({
                            ...product,
                            trackStock: e.target.checked
                          })
                        }
                      />
                    }
                  />
                  {product.trackStock && (
                    <TextField
                      label='Porciones disponibles'
                      type='number'
                      inputProps={{ min: 0, step: 0.001 }}
                      value={product.quantity}
                      disabled={!availability}
                      onChange={(e) =>
                        setProduct({
                          ...product,
                          quantity: Number(e.target.value)
                        })
                      }
                    />
                  )}
                  {manager && (
                    <MoreOptions title='Cortesías, acompañamientos, extras y combos'>
                      <FormControlLabel
                        label='Cortesía seleccionable (precio cero)'
                        control={
                          <Checkbox
                            checked={config.courtesy}
                            onChange={(e) => {
                              setConfig({
                                ...config,
                                courtesy: e.target.checked
                              });
                              if (e.target.checked)
                                setProduct({ ...product, price: 0 });
                            }}
                          />
                        }
                      />
                      <Typography variant='h6'>
                        Acompañamientos y extras
                      </Typography>
                      {config.modifiers.map((m, index) => (
                        <Stack
                          key={m.id}
                          spacing={1}
                          direction={{ xs: 'column', md: 'row' }}
                        >
                          <TextField
                            label='Nombre del acompañamiento o extra'
                            value={m.name}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                modifiers: config.modifiers.map((v, i) =>
                                  i === index
                                    ? { ...v, name: e.target.value }
                                    : v
                                )
                              })
                            }
                          />
                          <TextField
                            select
                            label='Tipo'
                            value={m.kind}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                modifiers: config.modifiers.map((v, i) =>
                                  i === index
                                    ? {
                                        ...v,
                                        kind: e.target.value as
                                          | 'EXTRA'
                                          | 'ACCOMPANIMENT'
                                      }
                                    : v
                                )
                              })
                            }
                          >
                            <MenuItem value='ACCOMPANIMENT'>
                              Acompañamiento
                            </MenuItem>
                            <MenuItem value='EXTRA'>Extra</MenuItem>
                          </TextField>
                          <TextField
                            label='Precio adicional'
                            type='number'
                            inputProps={{ min: 0, step: 0.01 }}
                            value={m.price}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                modifiers: config.modifiers.map((v, i) =>
                                  i === index
                                    ? { ...v, price: Number(e.target.value) }
                                    : v
                                )
                              })
                            }
                          />
                          <FormControlLabel
                            label='Disponible'
                            control={
                              <Checkbox
                                checked={m.isAvailable}
                                onChange={(e) =>
                                  setConfig({
                                    ...config,
                                    modifiers: config.modifiers.map((v, i) =>
                                      i === index
                                        ? {
                                            ...v,
                                            isAvailable: e.target.checked
                                          }
                                        : v
                                    )
                                  })
                                }
                              />
                            }
                          />
                          <Button
                            onClick={() =>
                              setConfig({
                                ...config,
                                modifiers: config.modifiers.filter(
                                  (_, i) => i !== index
                                )
                              })
                            }
                          >
                            Quitar
                          </Button>
                        </Stack>
                      ))}
                      <Button
                        onClick={() =>
                          setConfig({
                            ...config,
                            modifiers: [
                              ...config.modifiers,
                              {
                                id: crypto.randomUUID(),
                                name: '',
                                price: 0,
                                kind: 'EXTRA',
                                isAvailable: true
                              }
                            ]
                          })
                        }
                      >
                        Agregar acompañamiento o extra
                      </Button>
                      <Typography variant='h6'>
                        Componentes del combo
                      </Typography>
                      <Typography>
                        Se cobra el precio conjunto del producto, sin sumar el
                        precio individual de sus componentes.
                      </Typography>
                      {config.combo.map((item, index) => (
                        <Stack
                          key={index}
                          direction={{ xs: 'column', md: 'row' }}
                          spacing={1}
                        >
                          <TextField
                            select
                            fullWidth
                            label='Componente de combo'
                            value={item.productId}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                combo: config.combo.map((v, i) =>
                                  i === index
                                    ? { ...v, productId: e.target.value }
                                    : v
                                )
                              })
                            }
                          >
                            {products
                              .filter(
                                (p) =>
                                  p.id !== product.id &&
                                  p.isActive &&
                                  !p.configuration?.combo.length
                              )
                              .map((p) => (
                                <MenuItem key={p.id} value={p.id}>
                                  {p.name}
                                </MenuItem>
                              ))}
                          </TextField>
                          <TextField
                            label='Cantidad incluida'
                            type='number'
                            inputProps={{ min: 0.001, step: 0.001 }}
                            value={item.quantity}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                combo: config.combo.map((v, i) =>
                                  i === index
                                    ? { ...v, quantity: Number(e.target.value) }
                                    : v
                                )
                              })
                            }
                          />
                          <Button
                            onClick={() =>
                              setConfig({
                                ...config,
                                combo: config.combo.filter(
                                  (_, i) => i !== index
                                )
                              })
                            }
                          >
                            Quitar
                          </Button>
                        </Stack>
                      ))}
                      <Button
                        onClick={() =>
                          setConfig({
                            ...config,
                            combo: [
                              ...config.combo,
                              { productId: '', quantity: 1 }
                            ]
                          })
                        }
                      >
                        Agregar componente al combo
                      </Button>
                    </MoreOptions>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setProduct(null)}>Volver</Button>
            {(manager || availability) && (
              <Button
                variant='contained'
                startIcon={<SaveOutlined />}
                onClick={() => void save()}
              >
                Guardar carta/disponibilidad
              </Button>
            )}
          </DialogActions>
        </Dialog>
      )}
      <details className='service-details'>
        <summary>Porciones especiales configuradas</summary>
        <Typography variant='h6'>Porciones especiales</Typography>
        <Typography>
          Consumo de disponibilidad configurado explícitamente; no depende del
          precio aplicado.
        </Typography>
        {portions.map((p) => (
          <Stack direction='row' key={p.id} spacing={2}>
            <Typography>
              {p.name}: {p.availabilityUnits} unidades ·{' '}
              {p.isActive ? 'Activa' : 'Inactiva'}
            </Typography>
            {manager && (
              <Button onClick={() => setPortion({ ...p })}>
                Editar porción
              </Button>
            )}
          </Stack>
        ))}
        {manager && (
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <TextField
                  label='Nombre de porción'
                  value={portion.name}
                  onChange={(e) =>
                    setPortion({ ...portion, name: e.target.value })
                  }
                />
                <TextField
                  label='Unidades de disponibilidad'
                  type='number'
                  inputProps={{ min: 0.001, step: 0.001 }}
                  value={portion.availabilityUnits}
                  onChange={(e) =>
                    setPortion({
                      ...portion,
                      availabilityUnits: Number(e.target.value)
                    })
                  }
                />
                <FormControlLabel
                  label='Porción activa'
                  control={
                    <Checkbox
                      checked={!!portion.isActive}
                      onChange={(e) =>
                        setPortion({ ...portion, isActive: e.target.checked })
                      }
                    />
                  }
                />
                <Button
                  onClick={async () => {
                    if (
                      await run(
                        `/portion-policies${portion.id ? '/' + portion.id : ''}`,
                        {
                          name: portion.name,
                          availabilityUnits: Number(portion.availabilityUnits),
                          isActive: !!portion.isActive,
                          ...(portion.id
                            ? { expectedVersion: portion.version }
                            : {})
                        },
                        portion.id ? 'patch' : 'post'
                      )
                    )
                      setPortion({
                        name: '',
                        availabilityUnits: 0.5,
                        isActive: true
                      });
                  }}
                >
                  Guardar porción
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}
      </details>
    </Stack>
  );
}
