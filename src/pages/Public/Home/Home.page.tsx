import { useNavigate } from 'react-router-dom';
import { AppBar } from '../components/AppBar.component';
import { Footer } from '../components/Footer.component';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import KitchenIcon from '@mui/icons-material/Kitchen';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import DevicesIcon from '@mui/icons-material/Devices';
import './home.css';

export const Home = () => {
  const navigate = useNavigate();

  return (
    <div className='point-landing'>
      <AppBar />

      <main className='point-landing-main'>
        {/* Hero Section */}
        <section className='point-hero'>
          <div className='point-hero-container'>
            {/* Left Column: Headlines & Call to Action */}
            <div className='point-hero-content'>
              <div className='point-hero-badge'>
                <span className='point-hero-badge-dot'></span>
                <span>Plataforma POS Profesional</span>
              </div>

              <h1 className='point-hero-title'>
                Gestiona tu restaurante de{' '}
                <span className='point-hero-title-accent'>forma simple</span>
              </h1>

              <p className='point-hero-subtitle'>
                Control integral en tiempo real: estado y rotación de mesas, toma ágil de pedidos,
                sincronización directa con cocina y cobros rápidos sin demoras ni errores.
              </p>

              <div className='point-hero-actions'>
                <button
                  type='button'
                  className='point-cta-primary'
                  onClick={() => navigate('/auth/login')}
                  id='hero-btn-login'
                >
                  <span>Iniciar sesión</span>
                  <ArrowForwardIcon sx={{ fontSize: '1.15rem' }} />
                </button>
              </div>

              <div className='point-hero-trust'>
                <div className='point-trust-item'>
                  <CheckCircleOutlineIcon />
                  <span>Sincronización en vivo</span>
                </div>
                <div className='point-trust-item'>
                  <DevicesIcon />
                  <span>Móvil, tablet y PC</span>
                </div>
                <div className='point-trust-item'>
                  <FlashOnIcon />
                  <span>Rápido e intuitivo</span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual POS Mockup Composition */}
            <div className='point-mockup-wrapper'>
              <div className='point-mockup-card'>
                <div className='point-mockup-header'>
                  <div className='point-mockup-dots'>
                    <span className='point-mockup-dot dot-red'></span>
                    <span className='point-mockup-dot dot-yellow'></span>
                    <span className='point-mockup-dot dot-green'></span>
                  </div>
                  <div className='point-mockup-title'>
                    <span>Point POS</span>
                  </div>
                  <div className='point-mockup-status'>
                    <span className='point-hero-badge-dot' style={{ width: 6, height: 6 }}></span>
                    <span>TURNO ACTIVO</span>
                  </div>
                </div>

                <div className='point-mockup-body'>
                  {/* Visual Tables Grid */}
                  <div>
                    <div className='mockup-mesas-title'>Mesas en vivo</div>
                    <div className='mockup-mesas-grid'>
                      <div className='mockup-mesa-card mesa-ocupada'>
                        <div className='mockup-mesa-num'>Mesa 04</div>
                        <div className='mockup-mesa-status'>OCUPADA</div>
                        <div className='mockup-mesa-amount'>S/ 148.50</div>
                      </div>
                      <div className='mockup-mesa-card mesa-cocina'>
                        <div className='mockup-mesa-num'>Mesa 07</div>
                        <div className='mockup-mesa-status'>EN COCINA</div>
                        <div className='mockup-mesa-amount'>S/ 82.00</div>
                      </div>
                      <div className='mockup-mesa-card mesa-libre'>
                        <div className='mockup-mesa-num'>Mesa 12</div>
                        <div className='mockup-mesa-status'>DISPONIBLE</div>
                        <div className='mockup-mesa-amount'>4 personas</div>
                      </div>
                    </div>
                  </div>

                  {/* Active Kitchen Ticket Preview */}
                  <div className='mockup-ticket'>
                    <div className='mockup-ticket-header'>
                      <div className='mockup-ticket-id'>Comanda #104 — Mesa 04</div>
                      <div className='mockup-ticket-tag'>Cocina</div>
                    </div>
                    <div className='mockup-ticket-items'>
                      <div className='mockup-ticket-item'>
                        <span>1x Ceviche Mixto Especial</span>
                        <strong>S/ 48.00</strong>
                      </div>
                      <div className='mockup-ticket-item'>
                        <span>2x Lomo Saltado Clásico</span>
                        <strong>S/ 84.00</strong>
                      </div>
                      <div className='mockup-ticket-item'>
                        <span>1x Jarra Chicha Morada 1L</span>
                        <strong>S/ 16.50</strong>
                      </div>
                    </div>
                    <div className='mockup-ticket-footer'>
                      <span>Estado: En preparación (6 min)</span>
                      <span>Total: S/ 148.50</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Pillars: Mesas, Pedidos, Cocina, Cobros */}
        <section className='point-features'>
          <div className='point-features-container'>
            <div className='point-section-header'>
              <div className='point-section-tag'>Funcionalidades Clave</div>
              <h2 className='point-section-title'>Todo lo que tu restaurante necesita</h2>
              <p className='point-section-subtitle'>
                Diseñado para operar a máxima velocidad en horas punta, sin caídas ni complicaciones.
              </p>
            </div>

            <div className='point-pillars-grid'>
              <div className='point-pillar-card'>
                <div className='point-pillar-icon'>
                  <TableRestaurantIcon />
                </div>
                <h3 className='point-pillar-title'>Gestión de Mesas</h3>
                <p className='point-pillar-desc'>
                  Mapa visual del salón en tiempo real. Visualiza mesas libres, ocupadas, cuentas
                  abiertas y asignación de mozos al instante.
                </p>
              </div>

              <div className='point-pillar-card'>
                <div className='point-pillar-icon'>
                  <RestaurantMenuIcon />
                </div>
                <h3 className='point-pillar-title'>Toma de Pedidos</h3>
                <p className='point-pillar-desc'>
                  Registro ultrarrápido desde smartphones, tablets o terminales fijas. Modificadores,
                  términos y notas de cocina sin errores.
                </p>
              </div>

              <div className='point-pillar-card'>
                <div className='point-pillar-icon'>
                  <KitchenIcon />
                </div>
                <h3 className='point-pillar-title'>Pantalla de Cocina (KDS)</h3>
                <p className='point-pillar-desc'>
                  Comandas digitales organizadas por orden de llegada con tiempos en vivo. Cero papel
                  perdido y coordinación perfecta.
                </p>
              </div>

              <div className='point-pillar-card'>
                <div className='point-pillar-icon'>
                  <PointOfSaleIcon />
                </div>
                <h3 className='point-pillar-title'>Cobros y Caja</h3>
                <p className='point-pillar-desc'>
                  Cierres de cuenta rápidos, división de pagos, soporte para múltiples medios de pago
                  y arqueo de caja con total precisión.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className='point-bottom-cta'>
          <div className='point-bottom-cta-container'>
            <h3>¿Listo para agilizar la operación de tu restaurante?</h3>
            <p>Accede con tus credenciales de equipo para empezar tu turno.</p>
            <button
              type='button'
              className='point-cta-primary'
              style={{ margin: '0 auto' }}
              onClick={() => navigate('/auth/login')}
              id='footer-btn-login'
            >
              <span>Acceder al Sistema</span>
              <ArrowForwardIcon sx={{ fontSize: '1.15rem' }} />
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
