import type { Metadata } from 'next';
import { Header, Footer } from '../../components/Chrome';
import { FaqList } from '../../components/FaqList';
import { NavButton } from '../../components/NavButton';
import { faqs } from '../../data/catalogue';

export const metadata: Metadata = { title: 'FAQ - Sao Tech Market' };

export default function FaqPage() {
  return (
    <>
      <Header active="faq" />
      <div className="container faq-container">
        <div className="faq-header">
          <h1>Questions fréquentes</h1>
          <p>
            Retrouvez les réponses aux questions les plus courantes. Vous avez encore besoin
            d&apos;aide ? Notre équipe support est disponible 7j/7.
          </p>
        </div>
        <FaqList faqs={faqs} />
        <div className="faq-contact">
          <h2>Vous ne trouvez pas la réponse ?</h2>
          <p>Nous sommes là pour vous aider. Contactez-nous et nous répondrons sous 24 heures.</p>
          <NavButton to="/contact" className="btn btn-primary">
            Contactez-nous maintenant
          </NavButton>
        </div>
      </div>
      <Footer />
    </>
  );
}
