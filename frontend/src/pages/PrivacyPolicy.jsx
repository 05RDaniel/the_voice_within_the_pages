import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import './PrivacyPolicy.css';

function PrivacyPolicy() {
  const { theme } = useTheme();

  return (
    <div className={`legal-page ${theme === 'dark' ? '' : 'legal-page-light'}`}>
      <div className="legal-page-container">
        <div className="legal-page-header">
          <Link to="/login" className="legal-back-link">
            ← Volver a la aplicación
          </Link>
          <h1 className="legal-page-title">Política de Privacidad</h1>
          <p className="legal-page-subtitle">The Voice Within The Pages</p>
          <p className="legal-page-date">Última actualización: 27 de febrero de 2026</p>
        </div>

        <div className="legal-content">
          <section>
            <h2>1. Responsable del tratamiento</h2>
            <p>
              El responsable del tratamiento de los datos personales es:
            </p>
            <div className="legal-placeholder">
              <p><strong>Denominación o razón social:</strong> Daniel Rufes Belenguer</p>
              <p><strong>NIF/CIF:</strong> 54290413V</p>
              <p><strong>Domicilio:</strong> C/ La Pau 47, 46550 Albuixech, Valencia</p>
              <p><strong>Correo electrónico de contacto:</strong> daniel.rufes@gmail.com</p>
            </div>
          </section>

          <section>
            <h2>2. Finalidad del tratamiento</h2>
            <p>
              Los datos personales que usted facilita se tratarán con las siguientes finalidades:
            </p>
            <ul>
              <li><strong>Gestión de la cuenta de usuario:</strong> creación, mantenimiento y administración de su cuenta en la plataforma.</li>
              <li><strong>Prestación del servicio:</strong> almacenamiento y gestión del contenido narrativo que usted cree (historias, personajes, líneas temporales, tramas, notas y citas).</li>
              <li><strong>Comunicaciones transaccionales:</strong> envío de correos electrónicos de verificación de cuenta, recuperación de contraseña y notificaciones esenciales del servicio.</li>
              <li><strong>Cumplimiento de obligaciones legales:</strong> cuando sea exigido por la normativa aplicable.</li>
            </ul>
          </section>

          <section>
            <h2>3. Base jurídica del tratamiento</h2>
            <p>
              El tratamiento de sus datos personales se fundamenta en:
            </p>
            <ul>
              <li><strong>Ejecución del contrato (art. 6.1.b RGPD):</strong> el tratamiento es necesario para la prestación del servicio de la plataforma y la gestión de su cuenta de usuario.</li>
              <li><strong>Interés legítimo (art. 6.1.f RGPD):</strong> para la mejora del servicio, la seguridad técnica y la prevención del fraude, en la medida en que no prevalezcan sus derechos e intereses.</li>
              <li><strong>Cumplimiento de obligación legal (art. 6.1.c RGPD):</strong> cuando el tratamiento sea exigido por la normativa aplicable.</li>
            </ul>
          </section>

          <section>
            <h2>4. Categorías de datos tratados</h2>
            <p>
              Tratamos las siguientes categorías de datos personales:
            </p>
            <ul>
              <li><strong>Datos de identificación:</strong> nombre de usuario, dirección de correo electrónico.</li>
              <li><strong>Datos de autenticación:</strong> contraseña almacenada de forma cifrada (hash).</li>
              <li><strong>Contenido de usuario:</strong> historias, personajes, líneas temporales, tramas, notas y citas que usted cree en la plataforma.</li>
              <li><strong>Datos técnicos:</strong> identificador de sesión (almacenado en cookie técnica) para mantener su sesión activa.</li>
              <li><strong>Imagen de perfil (opcional):</strong> si decide subir una imagen de perfil.</li>
            </ul>
          </section>

          <section>
            <h2>5. Destinatarios y transferencias internacionales</h2>
            <p>
              Sus datos pueden ser tratados por los siguientes encargados del tratamiento, que actúan conforme a instrucciones del responsable y con las garantías contractuales exigidas por el RGPD:
            </p>
            <ul>
              <li><strong>Render, Inc.</strong> (Estados Unidos): alojamiento del backend de la aplicación. Transferencia amparada por mecanismos de adecuación o cláusulas contractuales tipo.</li>
              <li><strong>Vercel Inc.</strong> (Estados Unidos): alojamiento del frontend. Transferencia amparada por mecanismos de adecuación o cláusulas contractuales tipo.</li>
              <li><strong>Resend, Inc.</strong> (Estados Unidos): envío de correos electrónicos transaccionales. Transferencia amparada por mecanismos de adecuación o cláusulas contractuales tipo.</li>
            </ul>
            <p>
              No realizamos venta ni cesión de datos a terceros con fines comerciales o publicitarios.
            </p>
          </section>

          <section>
            <h2>6. Conservación de los datos</h2>
            <p>
              Los datos personales se conservarán durante el tiempo necesario para cumplir las finalidades descritas y, en su caso, durante los plazos de prescripción legal aplicables. En concreto:
            </p>
            <ul>
              <li><strong>Datos de la cuenta:</strong> mientras mantenga una cuenta activa. Tras la baja, se conservarán durante el plazo legal aplicable.</li>
              <li><strong>Contenido creado:</strong> hasta que usted lo elimine o solicite la supresión de su cuenta.</li>
              <li><strong>Datos de sesión:</strong> la cookie de sesión tiene una duración máxima de 7 días.</li>
              <li><strong>Datos para obligaciones legales:</strong> durante los plazos que exija la normativa aplicable.</li>
            </ul>
          </section>

          <section>
            <h2>7. Derechos del interesado</h2>
            <p>
              Puede ejercer los siguientes derechos ante el responsable del tratamiento:
            </p>
            <ul>
              <li><strong>Acceso (art. 15 RGPD):</strong> obtener información sobre si tratamos sus datos y, en su caso, acceder a los mismos.</li>
              <li><strong>Rectificación (art. 16 RGPD):</strong> solicitar la corrección de datos inexactos o incompletos.</li>
              <li><strong>Supresión (art. 17 RGPD):</strong> solicitar la eliminación de sus datos cuando ya no sean necesarios o retire su consentimiento.</li>
              <li><strong>Limitación del tratamiento (art. 18 RGPD):</strong> solicitar la limitación del tratamiento en los supuestos legalmente previstos.</li>
              <li><strong>Portabilidad (art. 20 RGPD):</strong> recibir sus datos en formato estructurado y de uso común, y transmitirlos a otro responsable.</li>
              <li><strong>Oposición (art. 21 RGPD):</strong> oponerse al tratamiento basado en interés legítimo.</li>
            </ul>
            <p>
              Para ejercer estos derechos, diríjase a: <span className="legal-placeholder-inline">[EMAIL DE CONTACTO]</span>. Deberá acreditar su identidad.
            </p>
            <p>
              Tiene derecho a presentar una reclamación ante la autoridad de control competente. En España: Agencia Española de Protección de Datos (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>). Si reside en otro Estado miembro de la Unión Europea, puede consultar el listado de autoridades en <a href="https://edpb.europa.eu/about-edpb/about-edpb/members_es" target="_blank" rel="noopener noreferrer">edpb.europa.eu</a>.
            </p>
          </section>

          <section>
            <h2>8. Decisiones automatizadas</h2>
            <p>
              No se adoptan decisiones individualizadas automatizadas ni se elaboran perfiles que produzcan efectos jurídicos o le afecten significativamente.
            </p>
          </section>

          <section>
            <h2>9. Seguridad</h2>
            <p>
              Se han implantado medidas técnicas y organizativas apropiadas para garantizar un nivel de seguridad adecuado al riesgo, incluyendo el cifrado de contraseñas, el uso de conexiones seguras (HTTPS) y el almacenamiento de sesiones en base de datos con controles de acceso.
            </p>
          </section>

          <section>
            <h2>10. Modificaciones</h2>
            <p>
              El responsable se reserva el derecho a modificar la presente política para adaptarla a novedades legislativas o cambios en el servicio. Las modificaciones serán publicadas en esta página con indicación de la fecha de última actualización.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
