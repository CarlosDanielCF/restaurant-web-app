import { useState } from 'react';
import {
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
import { Component, DailyMenu, Product } from './types';
import { Run } from './Operations.page';
const blank = (): DailyMenu => ({
  id: '',
  name: '',
  price: 0,
  serviceDate: null,
  isAvailable: true,
  components: [],
  version: 1
});
export function DailyMenuWorkspace({
  menus,
  products,
  editable,
  run
}: {
  menus: DailyMenu[];
  products: Product[];
  editable: boolean;
  run: Run;
}) {
  const [draft, setDraft] = useState<DailyMenu>(blank());
  function component(index: number, change: Partial<Component>) {
    setDraft({
      ...draft,
      components: draft.components.map((c, i) =>
        i === index ? { ...c, ...change } : c
      )
    });
  }
  return (
    <Stack spacing={2}>
      <Typography>
        Menú compuesto con precio propio. La carta permanece disponible. Cada
        componente permite elegir una opción incluida.
      </Typography>
      {menus.map((menu) => (
        <Card key={menu.id}>
          <CardContent>
            <Stack direction='row' justifyContent='space-between'>
              <Typography>
                {menu.name} · S/{menu.price} ·{' '}
                {menu.serviceDate || 'Sin fecha específica'} ·{' '}
                {menu.isAvailable ? 'Disponible' : 'No disponible'}
              </Typography>
              {editable && (
                <Button onClick={() => setDraft(structuredClone(menu))}>
                  Editar menú
                </Button>
              )}
            </Stack>
            {menu.components.map((c) => (
              <Typography key={c.id}>
                {c.name}:{' '}
                {c.options
                  .map(
                    (o) =>
                      `${products.find((p) => p.id === o.productId)?.name || 'Producto'}${o.isAvailable ? '' : ' (agotado)'}`
                  )
                  .join(', ')}
              </Typography>
            ))}
          </CardContent>
        </Card>
      ))}
      {editable && (
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant='h6'>
                {draft.id ? 'Editar menú compuesto' : 'Crear menú compuesto'}
              </Typography>
              <TextField
                label='Nombre del menú'
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
              <TextField
                label='Precio conjunto (S/)'
                type='number'
                inputProps={{ min: 0, step: 0.01 }}
                value={draft.price}
                onChange={(e) =>
                  setDraft({ ...draft, price: Number(e.target.value) })
                }
              />
              <TextField
                label='Fecha de servicio (opcional)'
                type='date'
                InputLabelProps={{ shrink: true }}
                value={draft.serviceDate || ''}
                onChange={(e) =>
                  setDraft({ ...draft, serviceDate: e.target.value || null })
                }
              />
              <FormControlLabel
                label='Menú disponible'
                control={
                  <Checkbox
                    checked={!!draft.isAvailable}
                    onChange={(e) =>
                      setDraft({ ...draft, isAvailable: e.target.checked })
                    }
                  />
                }
              />
              {draft.components.map((c, ci) => (
                <Card variant='outlined' key={c.id}>
                  <CardContent>
                    <Stack spacing={2}>
                      <TextField
                        label='Componente (entrada, segundo, bebida...)'
                        value={c.name}
                        onChange={(e) =>
                          component(ci, { name: e.target.value })
                        }
                      />
                      {c.options.map((o, oi) => (
                        <Stack
                          direction={{ xs: 'column', md: 'row' }}
                          spacing={1}
                          key={o.id}
                        >
                          <TextField
                            select
                            fullWidth
                            label='Opción incluida'
                            value={o.productId}
                            onChange={(e) =>
                              component(ci, {
                                options: c.options.map((x, i) =>
                                  i === oi
                                    ? { ...x, productId: e.target.value }
                                    : x
                                )
                              })
                            }
                          >
                            {products
                              .filter((p) => p.isActive)
                              .map((p) => (
                                <MenuItem key={p.id} value={p.id}>
                                  {p.name}
                                </MenuItem>
                              ))}
                          </TextField>
                          <TextField
                            label='Porciones (vacío: sin límite)'
                            type='number'
                            inputProps={{ min: 0, step: 0.001 }}
                            value={o.portions ?? ''}
                            onChange={(e) =>
                              component(ci, {
                                options: c.options.map((x, i) =>
                                  i === oi
                                    ? {
                                        ...x,
                                        portions:
                                          e.target.value === ''
                                            ? null
                                            : Number(e.target.value)
                                      }
                                    : x
                                )
                              })
                            }
                          />
                          <FormControlLabel
                            label='Disponible'
                            control={
                              <Checkbox
                                checked={!!o.isAvailable}
                                onChange={(e) =>
                                  component(ci, {
                                    options: c.options.map((x, i) =>
                                      i === oi
                                        ? {
                                            ...x,
                                            isAvailable: e.target.checked
                                          }
                                        : x
                                    )
                                  })
                                }
                              />
                            }
                          />
                          <Button
                            onClick={() =>
                              component(ci, {
                                options: c.options.filter((_, i) => i !== oi)
                              })
                            }
                          >
                            Quitar opción
                          </Button>
                        </Stack>
                      ))}
                      <Button
                        onClick={() =>
                          component(ci, {
                            options: [
                              ...c.options,
                              {
                                id: crypto.randomUUID(),
                                productId: '',
                                isAvailable: true,
                                portions: null
                              }
                            ]
                          })
                        }
                      >
                        Agregar opción incluida
                      </Button>
                      <Button
                        color='error'
                        onClick={() =>
                          setDraft({
                            ...draft,
                            components: draft.components.filter(
                              (_, i) => i !== ci
                            )
                          })
                        }
                      >
                        Quitar componente
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
              <Button
                onClick={() =>
                  setDraft({
                    ...draft,
                    components: [
                      ...draft.components,
                      { id: crypto.randomUUID(), name: '', options: [] }
                    ]
                  })
                }
              >
                Agregar componente
              </Button>
              <Stack direction='row' spacing={2}>
                <Button
                  variant='contained'
                  onClick={async () => {
                    const { id, version, ...data } = draft;
                    if (
                      await run(
                        `/daily-menus${id ? '/' + id : ''}`,
                        {
                          ...data,
                          price: Number(data.price),
                          isAvailable: !!data.isAvailable,
                          ...(id ? { expectedVersion: version } : {})
                        },
                        id ? 'patch' : 'post'
                      )
                    )
                      setDraft(blank());
                  }}
                >
                  Guardar menú compuesto
                </Button>
                <Button onClick={() => setDraft(blank())}>
                  Nuevo / descartar edición
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
