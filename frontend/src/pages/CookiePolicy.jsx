import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import './CookiePolicy.css';

function CookiePolicy() {
  const { theme } = useTheme();

  return (
    <div className={`legal-page ${theme === 'dark' ? '' : 'legal-page-light'}`}>
      <div className="legal-page-container">
        <div className="legal-page-header">
          <Link to="/login" className="legal-back-link">
            ← Volver a la aplicación
          </Link>
          <h1 className="legal-page-title">Política de Cookies</h1>
          <p className="legal-page-subtitle">The Voice Within The Pages</p>
          <p className="legal-page-date">Última actualización: 27 de febrero de 2026</p>
        </div>

        <div className="legal-content">
          <section>
            <h2>1. Responsable del tratamiento</h2>
            <p>
              El responsable del tratamiento de los datos obtenidos a través de las cookies es:
            </p>
            <div className="legal-placeholder">
              <p><strong>Denominación o razón social:</strong> Daniel Rufes Belenguer</p>
              <p><strong>NIF/CIF:</strong> 54290413V</p>
              <p><strong>Domicilio:</strong> C/ La Pau 47, 46550 Albuixech, Valencia</p>
              <p><strong>Correo electrónico de contacto:</strong> daniel.rufes@gmail.com</p>
            </div>
          </section>

          <section>
            <h2>2. ¿Qué son las cookies?</h2>
            <p>
              Las cookies son pequeños archivos de texto que los sitios web almacenan en su dispositivo (ordenador, tablet, móvil) cuando los visita. Permiten que el sitio web recuerde sus acciones y preferencias durante un período de tiempo, de modo que no tenga que volver a configurarlas cada vez que regrese.
            </p>
          </section>

          <section>
            <h2>3. Cookies utilizadas en esta aplicación</h2>
            <p>
              Esta aplicación utiliza <strong>únicamente cookies técnicas estrictamente necesarias</strong> para el funcionamiento del servicio. No utilizamos cookies de análisis, publicidad, seguimiento ni de redes sociales.
            </p>

            <h3>3.1. Cookie de sesión (connect.sid)</h3>
            <table className="legal-table">
              <tbody>
                <tr>
                  <th>Nombre</th>
                  <td>connect.sid</td>
                </tr>
                <tr>
                  <th>Finalidad</th>
                  <td>Mantener la sesión de usuario autenticado. Esencial para que la aplicación funcione correctamente tras el inicio de sesión.</td>
                </tr>
                <tr>
                  <th>Tipo</th>
                  <td>Cookie técnica estrictamente necesaria</td>
                </tr>
                <tr>
                  <th>Duración</th>
                  <td>7 días (máximo)</td>
                </tr>
                <tr>
                  <th>httpOnly</th>
                  <td>Sí (no accesible desde JavaScript, mayor seguridad)</td>
                </tr>
                <tr>
                  <th>secure</th>
                  <td>Sí en producción (solo se transmite por HTTPS)</td>
                </tr>
                <tr>
                  <th>sameSite</th>
                  <td>none en producción (permite peticiones cross-site con credenciales)</td>
                </tr>
                <tr>
                  <th>Dominio</th>
                  <td>.thevoicewithinthepages.es (en producción)</td>
                </tr>
                <tr>
                  <th>Base jurídica</th>
                  <td>Ejecución del contrato (art. 6.1.b RGPD) e interés legítimo (art. 6.1.f RGPD)</td>
                </tr>
              </tbody>
            </table>
            <p>
              Esta cookie almacena únicamente un identificador de sesión cifrado. Los datos de la sesión (identidad del usuario, etc.) se almacenan de forma segura en el servidor, no en la cookie.
            </p>
          </section>

          <section>
            <h2>4. Ausencia de cookies que requieran consentimiento</h2>
            <p>
              Dado que esta aplicación utiliza <strong>exclusivamente cookies técnicas estrictamente necesarias</strong> para la prestación del servicio solicitado por el usuario, conforme al artículo 22.2 de la Ley 34/2002, de 11 de julio, de servicios de la sociedad de la información y de comercio electrónico (LSSI-CE), y al considerando 48 del Reglamento (UE) 2016/679 (RGPD), <strong>no es necesario obtener el consentimiento previo del usuario</strong> para su instalación y uso.
            </p>
            <p>
              Por tanto, <strong>esta aplicación no muestra banner ni ventana de consentimiento de cookies</strong>, al no utilizar cookies que requieran consentimiento.
            </p>
          </section>

          <section>
            <h2>5. Cookies que no utilizamos</h2>
            <p>
              Esta aplicación <strong>no utiliza</strong>:
            </p>
            <ul>
              <li>Cookies de análisis o estadísticas</li>
              <li>Cookies de publicidad o marketing</li>
              <li>Cookies de seguimiento o de terceros con fines comerciales</li>
              <li>Cookies de redes sociales</li>
            </ul>
          </section>

          <section>
            <h2>6. Gestión de cookies en su navegador</h2>
            <p>
              Puede configurar su navegador para bloquear o eliminar cookies. Tenga en cuenta que, si bloquea la cookie de sesión (connect.sid), <strong>no podrá iniciar sesión ni utilizar la aplicación</strong>, ya que es imprescindible para su funcionamiento.
            </p>
            <p>
              Puede consultar las instrucciones de su navegador en los siguientes enlaces:
            </p>
            <ul>
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
              <li><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
            </ul>
          </section>

          <section>
            <h2>7. Derechos del interesado</h2>
            <p>
              En relación con los datos tratados a través de cookies, puede ejercer los derechos de acceso, rectificación, supresión, limitación, portabilidad y oposición ante el responsable, así como presentar reclamación ante la Agencia Española de Protección de Datos. Para más información, consulte nuestra <Link to="/privacy">Política de Privacidad</Link>.
            </p>
          </section>

          <section>
            <h2>8. Modificaciones</h2>
            <p>
              El responsable se reserva el derecho a modificar la presente política de cookies para adaptarla a novedades legislativas o cambios en las cookies utilizadas. Las modificaciones serán publicadas en esta página con indicación de la fecha de última actualización.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default CookiePolicy;
