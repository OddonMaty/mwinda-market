'use client';
import { nowLocale, useI18n } from './I18n';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api, useAuth } from './AuthProvider';

export interface ChatTarget { productId: number; productName: string; shopName?: string }
interface Msg { id: number; mine: boolean; body: string; productName: string | null; createdAt: string }
export interface Conv { id: number; other: string; lastMessageAt: string; lastBody: string | null; unread: number }

interface Ctx {
  /** Ouvre la discussion avec le vendeur d'un produit (invite à se connecter si besoin). */
  ask: (t: ChatTarget) => void;
  /** Ouvre la boîte de réception de l'acheteur, ou une discussion précise. */
  openInbox: (id?: number, title?: string) => void;
}
const ChatContext = createContext<Ctx>({ ask: () => {}, openInbox: () => {} });
export const useChat = () => useContext(ChatContext);

const time = (d: string) => new Date(d).toLocaleString(nowLocale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Fil de discussion : messages, saisie, actualisation toutes les 5 s. Sert à l'acheteur (bulle) et au vendeur (onglet Messages). */
export function Thread({ conversationId, target, onCreated, className = '' }: { conversationId: number | null; target?: ChatTarget; onCreated?: (id: number) => void; className?: string }) {
  useI18n();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [id, setId] = useState<number | null>(conversationId);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => { setId(conversationId); setMsgs([]); setErr(''); }, [conversationId, target?.productId]);
  const load = useCallback(async () => {
    if (!id) return;
    const r = await api<{ messages: Msg[] }>(`/conversations/${id}/messages`);
    if (r.ok) setMsgs(r.data.messages);
  }, [id]);
  useEffect(() => {
    void load();
    if (!id) return;
    const t = setInterval(() => { if (!document.hidden) void load(); }, 5000);
    return () => clearInterval(t);
  }, [id, load]);
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }); }, [msgs.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const message = text.trim();
    if (!message || busy) return;
    setBusy(true); setErr('');
    const r = id
      ? await api(`/conversations/${id}/messages`, { method: 'POST', body: { message } })
      : await api<{ id: number }>('/conversations', { method: 'POST', body: { productId: target?.productId, message } });
    setBusy(false);
    if (!r.ok) { setErr(r.data.code === 'official_shop' ? 'Cet article est vendu par Mwinda Market. Écrivez-nous depuis la page Contact.' : (r.data.message ?? 'Message non envoyé.')); return; }
    setText('');
    if (!id) { const nid = (r.data as { id: number }).id; setId(nid); onCreated?.(nid); } else await load();
  }

  return (
    <div className={`chat-thread ${className}`}>
      <div className="chat-messages" aria-live="polite">
        {msgs.length === 0 && (
          <p className="chat-empty">{target ? <>Posez votre question au vendeur{target.shopName ? <> <b>{target.shopName}</b></> : null} au sujet de « {target.productName} » : disponibilité, livraison, couleurs…</> : 'Aucun message pour le moment.'}</p>
        )}
        {msgs.map((m) => (
          <div key={m.id} className={`chat-msg ${m.mine ? 'mine' : 'theirs'}`}>
            {m.productName && <small className="chat-ref"><i className="fas fa-tag" /> {m.productName}</small>}
            <span>{m.body}</span>
            <time>{time(m.createdAt)}</time>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      {err && <p className="chat-error" role="alert">{err}</p>}
      <form className="chat-form" onSubmit={send}>
        <textarea name="chatMessage" rows={2} maxLength={1000} placeholder="Écrivez votre message…" value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); (e.currentTarget.form as HTMLFormElement).requestSubmit(); } }} />
        <button type="submit" className="chat-send" disabled={busy || !text.trim()} aria-label="Envoyer"><i className="fas fa-paper-plane" /></button>
      </form>
    </div>
  );
}

/** Liste des discussions (côté acheteur dans la bulle, côté vendeur dans le tableau de bord). */
export function ConversationList({ as, onOpen, activeId }: { as: 'buyer' | 'seller'; onOpen: (c: Conv) => void; activeId?: number | null }) {
  useI18n();
  const [rows, setRows] = useState<Conv[] | null>(null);
  useEffect(() => {
    let live = true;
    const load = async () => { const r = await api<{ conversations: Conv[] }>(`/conversations?as=${as}`); if (live && r.ok) setRows(r.data.conversations); };
    void load();
    const t = setInterval(() => { if (!document.hidden) void load(); }, 10000);
    return () => { live = false; clearInterval(t); };
  }, [as]);
  if (rows === null) return <p className="chat-empty">Chargement…</p>;
  if (rows.length === 0) return <p className="chat-empty">{as === 'buyer' ? 'Vous n’avez pas encore écrit à un vendeur. Utilisez « Poser une question » sur une fiche produit.' : 'Aucune question de client pour le moment.'}</p>;
  return (
    <ul className="chat-list">
      {rows.map((c) => (
        <li key={c.id}>
          <button type="button" className={activeId === c.id ? 'active' : ''} onClick={() => onOpen(c)}>
            <span className="chat-list-top"><b>{c.other}</b><time>{time(c.lastMessageAt)}</time></span>
            <span className="chat-list-last">{c.lastBody ?? ''}</span>
            {c.unread > 0 && <span className="chat-unread">{c.unread}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

type View = { kind: 'closed' } | { kind: 'list' } | { kind: 'thread'; id: number | null; title: string; target?: ChatTarget };

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, openLogin, notify } = useAuth();
  const [view, setView] = useState<View>({ kind: 'closed' });
  const pending = useRef<View | null>(null);

  const guard = useCallback((v: View) => {
    if (!user) { pending.current = v; notify('Connectez-vous pour écrire au vendeur.'); openLogin('signin'); return; }
    setView(v);
  }, [user, notify, openLogin]);
  useEffect(() => { if (user && pending.current) { setView(pending.current); pending.current = null; } }, [user]);

  const ask = useCallback((t: ChatTarget) => {
    const title = t.shopName ?? 'Vendeur';
    if (!user) { guard({ kind: 'thread', id: null, title, target: t }); return; }
    // Reprend la discussion déjà ouverte avec cette boutique, s'il y en a une.
    void api<{ id: number | null }>(`/conversations/lookup?productId=${t.productId}`).then((r) => setView({ kind: 'thread', id: r.ok ? r.data.id : null, title, target: t }));
  }, [guard, user]);
  const openInbox = useCallback((id?: number, title?: string) => guard(id ? { kind: 'thread', id, title: title ?? 'Discussion' } : { kind: 'list' }), [guard]);

  return (
    <ChatContext.Provider value={{ ask, openInbox }}>
      {children}
      {view.kind !== 'closed' && (
        <div className="chat-panel" role="dialog" aria-label="Discussion avec le vendeur">
          <div className="chat-head">
            {view.kind === 'thread' && <button type="button" className="chat-back" onClick={() => setView({ kind: 'list' })} aria-label="Mes discussions"><i className="fas fa-chevron-left" /></button>}
            <span className="chat-title"><i className="fas fa-comments" /> {view.kind === 'thread' ? view.title : 'Mes discussions'}</span>
            <button type="button" className="chat-close" onClick={() => setView({ kind: 'closed' })} aria-label="Fermer"><i className="fas fa-times" /></button>
          </div>
          {view.kind === 'list'
            ? <ConversationList as="buyer" onOpen={(c) => setView({ kind: 'thread', id: c.id, title: c.other })} />
            : <Thread conversationId={view.id} target={view.target} onCreated={(id) => setView({ ...view, id })} />}
          {view.kind === 'thread' && view.target && !view.id && <p className="chat-foot">Besoin d’aide ? <Link href="/contact">Contactez-nous</Link></p>}
        </div>
      )}
    </ChatContext.Provider>
  );
}
