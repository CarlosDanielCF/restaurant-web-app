import { MenuSection } from '../../interfaces';

import {
  MenuBookOutlined,
  StorefrontOutlined,
  TableRestaurantOutlined,
  TableBarOutlined,
  PeopleOutline,
  Groups3Outlined
} from '@mui/icons-material';

import { Roles } from '@/models/roles';

/**
 * Navegación de Ciclo A (F0-F3)
 * Módulos estrictamente requeridos para la fase A:
 * - Restaurante
 * - Gestión de Mesas
 * - Mapa de Mesas
 * - Menú y Carta
 * - Gestión de Usuarios
 * - Gestión de Clientes
 * Se cierran/ocultan temporalmente Dashboard, Finanzas, Pedidos y Cocina para Ciclo B.
 */
const cicloASection: MenuSection = {
  title: 'Gestión',
  items: [
    {
      title: 'Restaurante',
      icon: <StorefrontOutlined fontSize='small' />,
      to: '/restaurant',
      allowedRoles: [Roles.ADMIN]
    },
    {
      title: 'Gestión de mesas',
      icon: <TableRestaurantOutlined fontSize='small' />,
      to: '/tables',
      allowedRoles: [Roles.ADMIN]
    },
    {
      title: 'Mapa de mesas',
      icon: <TableBarOutlined fontSize='small' />,
      to: '/orders/tables',
      allowedRoles: [Roles.ADMIN, Roles.WAITER]
    },
    {
      title: 'Menú y carta',
      icon: <MenuBookOutlined fontSize='small' />,
      to: '/menu/sections',
      allowedRoles: [Roles.ADMIN]
    },
    {
      title: 'Gestión de usuarios',
      icon: <PeopleOutline fontSize='small' />,
      to: '/users',
      allowedRoles: [Roles.ADMIN]
    },
    {
      title: 'Gestión de clientes',
      icon: <Groups3Outlined fontSize='small' />,
      to: '/clients',
      allowedRoles: [Roles.ADMIN]
    }
  ]
};

export const menuSections: MenuSection[] = [cicloASection];
