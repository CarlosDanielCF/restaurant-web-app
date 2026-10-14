import { useState } from 'react';
import { Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { selectMenu } from '@/redux';
import { restauranteApi } from '@/api';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
export function KitchenAvailability() {
 const {products}=useSelector(selectMenu);
 const [id,setId]=useState('');
 const [status,setStatus]=useState('AVAILABLE');
 const [quantity,setQuantity]=useState('');
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 const queryClient=useQueryClient();
 async function save(){
  setBusy(true);
  try {
   await restauranteApi.patch(`products/${id}`,{status,...(quantity!==''?{quantity:Number(quantity)}:{})});
   await queryClient.invalidateQueries({queryKey:queryKeys.menu.all});setMessage('Disponibilidad guardada');
  } catch {setMessage('No se pudo guardar la disponibilidad');}
  finally {setBusy(false);}
 }
 return <Stack gap={2} my={2}>
  <Typography variant='h5'>Disponibilidad de la carta</Typography>
  <TextField select label='Producto' value={id} onChange={e=>{const p=products.find(p=>p.id===e.target.value);setId(e.target.value);setStatus(p?.status||'AVAILABLE');setQuantity('');}}>
   {products.map(p=><MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
  </TextField>
  <TextField select label='Disponibilidad' value={status} onChange={e=>setStatus(e.target.value)}>
   <MenuItem value='AVAILABLE'>Disponible</MenuItem><MenuItem value='OUT_OF_STOCK'>Agotado</MenuItem>
  </TextField>
  <TextField label='Cantidad registrada (opcional)' type='number' inputProps={{min:0,step:0.001}} value={quantity} onChange={e=>setQuantity(e.target.value)}/>
  <Button disabled={!id||busy} onClick={save}>Guardar disponibilidad</Button>
  <Typography role='status'>{message}</Typography>
 </Stack>;
}
