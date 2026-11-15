'use client';
import { useRef } from 'react';

export function ContactForm() {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      className="contact-form"
      onSubmit={(e) => {
        e.preventDefault();
        // TODO : envoi réel (e-mail / base de données) ; comme l'ancien site, simple confirmation pour l'instant.
        alert('Merci pour votre message ! Nous vous répondrons sous 24 heures.');
        ref.current?.reset();
      }}
    >
      <div className="form-row">
        <input type="text" placeholder="Nom" required />
        <input type="email" placeholder="E-mail" required />
      </div>
      <input type="text" placeholder="Sujet" required />
      <textarea rows={5} placeholder="Message" required />
      <button type="submit" className="btn btn-primary">Envoyer maintenant <i className="fas fa-arrow-right" /></button>
    </form>
  );
}
