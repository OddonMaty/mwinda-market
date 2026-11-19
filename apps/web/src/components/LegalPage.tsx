import { Header, Footer } from './Chrome';
import type { LegalPageData } from '../data/source';

/** Texte simple : lignes vides = paragraphes, « ## » = titre de section, « - » = liste. */
function Body({ text }: { text: string }) {
  const blocks = text.replace(/\r/g, '').split(/\n{2,}/);
  return (
    <>
      {blocks.map((b, i) => {
        const lines = b.split('\n');
        if (lines[0]!.startsWith('## ')) return <section key={i}><h2>{lines[0]!.slice(3)}</h2>{lines.length > 1 && <p>{lines.slice(1).join('\n')}</p>}</section>;
        if (lines.every((l) => l.startsWith('- '))) return <ul key={i}>{lines.map((l, k) => <li key={k}>{l.slice(2)}</li>)}</ul>;
        return <p key={i} style={{ whiteSpace: 'pre-line' }}>{b}</p>;
      })}
    </>
  );
}

export function LegalPage({ page }: { page: LegalPageData | null }) {
  return (
    <>
      <Header active="" />
      <div className="page-header">
        <h1>{page?.title ?? 'Page en préparation'}</h1>
        {page && <p>Dernière mise à jour : {new Date(page.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
      </div>
      <div className="container">
        <div className="info-page">{page ? <Body text={page.body} /> : <p>Ce texte sera bientôt disponible.</p>}</div>
      </div>
      <Footer />
    </>
  );
}
