import { useState } from 'react';
import { Button, Stack, TextField, Typography } from '@mui/material';
import { restauranteApi } from '@/api';
import { useRestaurantStore } from '../../Common/store/restaurantStore';
import { useRestaurantImage } from '@/hooks/useRestaurantImage';
import { Restaurant } from '../../Common/models/restaurant.model';
export function SecuritySettings() {
 const {restaurant,setRestaurant}=useRestaurantStore();
 const [zone,setZone]=useState(restaurant?.timeZone || 'America/Lima');
 const [file,setFile]=useState<File>();
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 const image=useRestaurantImage(restaurant?.yapeQr);
 if(!restaurant)return null;
 async function saveZone(){
  setBusy(true);
  try {const {data}=await restauranteApi.patch<Restaurant>(`restaurant/${restaurant!.id}`,{timeZone:zone,expectedVersion:restaurant!.version});setRestaurant(data);setMessage('Zona horaria guardada');}
  catch {setMessage('No se pudo guardar. Compruebe la zona horaria o recargue si hubo cambios simultáneos.');}
  finally {setBusy(false);}
 }
 async function saveQr(){
  if(!file)return;
  setBusy(true);
  const form=new FormData();form.append('file',file);
  try {const {data}=await restauranteApi.patch<Restaurant>(`restaurant/yape-qr/${restaurant!.id}`,form,{headers:{'If-Match':String(restaurant!.version)}});setRestaurant(data);setMessage('QR guardado sin modificar la imagen');}
  catch {setMessage('No se pudo guardar. Use PNG, JPEG o WebP estático de hasta 5 MB y 4096×4096, y recargue si hubo cambios simultáneos.');}
  finally {setBusy(false);}
 }
 return <Stack gap={2} mt={3}>
  <Typography variant='h5'>Zona horaria y Yape</Typography>
  <TextField label='Zona horaria IANA' value={zone} onChange={e=>setZone(e.target.value)} helperText='Ejemplo: America/Lima. Moneda del restaurante: PEN (S/).'/>
  <Button disabled={busy} onClick={saveZone}>Guardar zona horaria</Button>
  {image?<img src={image} alt='QR de Yape configurado' style={{maxWidth:260,objectFit:'contain'}}/>:<Typography>No hay un QR de Yape configurado.</Typography>}
  <input aria-label='Imagen QR de Yape' type='file' accept='image/png,image/jpeg,image/webp' onChange={e=>setFile(e.target.files?.[0])}/>
  <Button disabled={busy||!file} onClick={saveQr}>Guardar QR de Yape</Button>
  <Typography>Esta configuración no registra ni confirma pagos.</Typography>
  <Typography role='status'>{message}</Typography>
 </Stack>;
}
