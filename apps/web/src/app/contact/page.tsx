import type { Metadata } from 'next';
import { Header, Footer } from '../../components/Chrome';
import { ContactForm } from '../../components/ContactForm';

export const metadata: Metadata = { title: 'Contact - Mwinda Market' };

export default function ContactPage() {
  return (
    <>
      <Header active="contact" />
      <div className="contact-hero">
        <i className="fas fa-phone" />
        <span>+243 907 261 113 — Service client en ligne, RDC</span>
      </div>
      <div className="container contact-container">
        <div className="contact-form-section">
          <h1>Contactez-nous</h1>
          <p>
            Une question sur une commande ou un produit ? Remplissez le formulaire et notre équipe
            vous répondra sous 24 heures.
          </p>
          <ContactForm />
        </div>
        <div className="contact-info">
          <h2>Informations de contact</h2>
          {[
            ['fa-envelope', 'E-mail', 'contact@saotechmarket.com'],
            ['fa-phone', 'Appelez-nous', '+243 907 261 113'],
            ['fa-clock', "Horaires d'ouverture", 'Lun – Sam : 8h00 – 19h00'],
          ].map(([icon, label, v]) => (
            <div className="info-item" key={label}>
              <i className={`fas ${icon}`} />
              <div>
                <p className="info-label">{label}</p>
                <p>{v}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
