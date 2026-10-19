import { MenuSection } from '../../interfaces';
import {
  AssignmentOutlined,
  MenuBookOutlined,
  SoupKitchenOutlined,
  StorefrontOutlined,
  TableRestaurantOutlined,
  PeopleOutline,
  Groups3Outlined,
  ReceiptLongOutlined,
  AssessmentOutlined,
  Inventory2Outlined,
  PaymentsOutlined
} from '@mui/icons-material';
import { Roles } from '@/models/roles';

const managers = [Roles.OWNER, Roles.ADMIN];
const service = [...managers, Roles.WAITER];

// Canonical F0–F9 routes. Delivery, menu and reservations are tabs in Atención;
// reports use the F9 domain, never the obsolete dashboard/checkout APIs.
export const menuSections: MenuSection[] = [
  {
    title: 'Operación',
    items: [
      {
        title: 'Atención y pedidos',
        icon: <TableRestaurantOutlined />,
        to: '/attention',
        allowedRoles: service
      },
      {
        title: 'Menú y disponibilidad',
        icon: <MenuBookOutlined />,
        to: '/attention',
        allowedRoles: [Roles.COOK]
      },
      {
        title: 'Cocina',
        icon: <SoupKitchenOutlined />,
        to: '/kitchen',
        allowedRoles: [...managers, Roles.COOK]
      },
      {
        title: 'Cobros y rendición',
        icon: <PaymentsOutlined />,
        to: '/finance',
        allowedRoles: service
      },
      {
        title: 'Documentos internos',
        icon: <ReceiptLongOutlined />,
        to: '/internal-documents',
        allowedRoles: service
      },
      {
        title: 'Reportes operativos',
        icon: <AssessmentOutlined />,
        to: '/operational-reports',
        allowedRoles: service
      },
      {
        title: 'Tiempos de cocina',
        icon: <AssessmentOutlined />,
        to: '/operational-reports',
        allowedRoles: [Roles.COOK]
      },
      {
        title: 'Pedidos históricos',
        icon: <AssignmentOutlined />,
        to: '/orders/list',
        allowedRoles: service
      }
    ]
  },
  {
    title: 'Gestión',
    items: [
      {
        title: 'Resumen operativo',
        icon: <AssessmentOutlined />,
        to: '/operational-overview',
        allowedRoles: managers
      },
      {
        title: 'Compras y bebidas',
        icon: <Inventory2Outlined />,
        to: '/supplies',
        allowedRoles: managers
      },
      {
        title: 'Restaurante',
        icon: <StorefrontOutlined />,
        to: '/restaurant',
        allowedRoles: managers
      },
      {
        title: 'Carta permanente',
        icon: <MenuBookOutlined />,
        to: '/menu/sections',
        allowedRoles: managers
      },
      {
        title: 'Gestión de mesas',
        icon: <TableRestaurantOutlined />,
        to: '/tables',
        allowedRoles: managers
      },
      {
        title: 'Trabajadores',
        icon: <PeopleOutline />,
        to: '/users',
        allowedRoles: managers
      },
      {
        title: 'Clientes',
        icon: <Groups3Outlined />,
        to: '/clients',
        allowedRoles: service
      }
    ]
  }
];
