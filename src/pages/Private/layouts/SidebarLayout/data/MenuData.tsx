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
  PaymentsOutlined
} from '@mui/icons-material';
import { Roles } from '@/models/roles';

const managers = [Roles.OWNER, Roles.ADMIN];
const service = [...managers, Roles.WAITER];
const everyone = [...service, Roles.COOK];

// Canonical F0–F9 routes. Delivery, menu and reservations are tabs in Atención;
// reports use the F9 domain, never the obsolete dashboard/checkout APIs.
export const menuSections: MenuSection[] = [
  {
    title: 'Operación',
    items: [
      {
        title: 'Atención, mesas y delivery',
        icon: <TableRestaurantOutlined />,
        to: '/attention',
        allowedRoles: everyone
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
        allowedRoles: everyone
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
