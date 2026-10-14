import { useEffect, useState } from 'react';
import { restauranteApi } from '@/api';
import { useRestaurantStore } from '@/pages/Private/Common/store/restaurantStore';
export function useRestaurantImage(path?: string) {
 const [url,setUrl]=useState<string>();
 const restaurantId=useRestaurantStore(state=>state.restaurant?.id);
 useEffect(()=>{
  let revoked=false; let objectUrl:string|undefined;
  setUrl(undefined);
  if (!path) return;
  const legacy = path.includes('/uploads/products/');
  if (!legacy && !path.startsWith('/api/restaurant/images/')) {setUrl(path);return;}
  const endpoint = legacy ? `/products/legacy-image/${encodeURIComponent(path.split('/').pop() || '')}` : path.replace(/^\/api/,'');
  restauranteApi.get<Blob>(endpoint,{responseType:'blob'}).then(({data})=>{
   if (!revoked) {objectUrl=URL.createObjectURL(data);setUrl(objectUrl);}
  }).catch(()=>setUrl(undefined));
  return ()=>{revoked=true;if(objectUrl)URL.revokeObjectURL(objectUrl);};
 },[path,restaurantId]);
 return url;
}
