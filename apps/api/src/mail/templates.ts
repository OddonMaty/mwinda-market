import type { Mail } from './mailer.js';

type Locale = 'fr' | 'en';
const sign = { fr: '\n\nL\'équipe Mwinda Market', en: '\n\nThe Mwinda Market team' };

export function verifyEmail(locale: Locale, to: string, link: string): Mail {
  return locale === 'en'
    ? { to, subject: 'Confirm your email address', text: `Welcome to Mwinda Market.\nConfirm your email address: ${link}\nThis link is valid for 24 hours.${sign.en}` }
    : { to, subject: 'Confirmez votre adresse e-mail', text: `Bienvenue sur Mwinda Market.\nConfirmez votre adresse e-mail : ${link}\nCe lien est valable 24 heures.${sign.fr}` };
}
export function accountExists(locale: Locale, to: string, loginLink: string, resetLink: string): Mail {
  return locale === 'en'
    ? { to, subject: 'You already have an account', text: `Someone tried to create an account with this address, but one already exists.\nLog in: ${loginLink}\nForgot your password? ${resetLink}\nIf this wasn't you, ignore this message.${sign.en}` }
    : { to, subject: 'Vous avez déjà un compte', text: `Quelqu'un a tenté de créer un compte avec cette adresse, mais un compte existe déjà.\nSe connecter : ${loginLink}\nMot de passe oublié ? ${resetLink}\nSi ce n'était pas vous, ignorez ce message.${sign.fr}` };
}
export function resetPassword(locale: Locale, to: string, link: string): Mail {
  return locale === 'en'
    ? { to, subject: 'Reset your password', text: `Reset your password: ${link}\nThis link is valid for 1 hour and can be used once. If you didn't ask for it, ignore this message.${sign.en}` }
    : { to, subject: 'Réinitialisation de votre mot de passe', text: `Réinitialisez votre mot de passe : ${link}\nCe lien est valable 1 heure et ne peut servir qu'une fois. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.${sign.fr}` };
}
export function passwordChanged(locale: Locale, to: string): Mail {
  return locale === 'en'
    ? { to, subject: 'Your password was changed', text: `Your Mwinda Market password was just changed. If this wasn't you, reset it immediately and contact us.${sign.en}` }
    : { to, subject: 'Votre mot de passe a été modifié', text: `Le mot de passe de votre compte Mwinda Market vient d'être modifié. Si ce n'était pas vous, réinitialisez-le immédiatement et contactez-nous.${sign.fr}` };
}

export function shopApproved(locale: Locale, to: string, shopName: string, link: string): Mail {
  return locale === 'en'
    ? { to, subject: `Your shop "${shopName}" has been accepted`, text: `Good news: your shop "${shopName}" has been accepted on Mwinda Market.\nYou can now publish your products and answer your customers' questions.\nAccess your shop: ${link}${sign.en}` }
    : { to, subject: `Votre boutique « ${shopName} » a été acceptée`, text: `Bonne nouvelle : votre boutique « ${shopName} » a été acceptée sur Mwinda Market.\nVous pouvez dès maintenant publier vos produits et répondre aux questions de vos clients.\nAccéder à votre boutique : ${link}${sign.fr}` };
}
export function shopRejected(locale: Locale, to: string, shopName: string, reason: string | null): Mail {
  return locale === 'en'
    ? { to, subject: `Your shop "${shopName}" was not accepted`, text: `We reviewed your request to open "${shopName}" on Mwinda Market and could not accept it.\nReason: ${reason || 'not specified'}\nYou can write to us at contact@mwindamarket.com to discuss it.${sign.en}` }
    : { to, subject: `Votre boutique « ${shopName} » n’a pas été acceptée`, text: `Nous avons examiné votre demande d’ouverture de « ${shopName} » sur Mwinda Market et n’avons pas pu l’accepter.\nMotif : ${reason || 'non précisé'}\nVous pouvez nous écrire à contact@mwindamarket.com pour en discuter.${sign.fr}` };
}

export interface MailLine { name: string; quantity: number; unitUsd: number }
const usd = (n: number) => `$${n.toFixed(2)}`;
const lineText = (l: MailLine) => `- ${l.name} × ${l.quantity} : ${usd(l.unitUsd * l.quantity)}`;

export function orderPlaced(locale: Locale, to: string, number: string, lines: MailLine[], totalUsd: number, link: string): Mail {
  const body = lines.map(lineText).join('\n');
  return locale === 'en'
    ? { to, subject: `Order ${number} received`, text: `Thank you for your order ${number} on Mwinda Market.\n\n${body}\nTotal: ${usd(totalUsd)}\n\nEach seller will confirm and ship their part. Follow your order: ${link}${sign.en}` }
    : { to, subject: `Commande ${number} bien reçue`, text: `Merci pour votre commande ${number} sur Mwinda Market.\n\n${body}\nTotal : ${usd(totalUsd)}\n\nChaque vendeur va confirmer puis expédier sa partie de la commande. Suivez votre commande : ${link}${sign.fr}` };
}
export function newOrderSeller(locale: Locale, to: string, shopName: string, number: string, lines: MailLine[], link: string): Mail {
  const body = lines.map(lineText).join('\n');
  return locale === 'en'
    ? { to, subject: `New order ${number} for ${shopName}`, text: `You have a new order (${number}) for your shop "${shopName}":\n\n${body}\n\nConfirm it from your seller space: ${link}${sign.en}` }
    : { to, subject: `Nouvelle commande ${number} pour ${shopName}`, text: `Vous avez reçu une nouvelle commande (${number}) pour votre boutique « ${shopName} » :\n\n${body}\n\nConfirmez-la depuis votre espace vendeur : ${link}${sign.fr}` };
}
const STATUS_FR: Record<string, string> = { confirmed: 'a été confirmée par le vendeur', shipped: 'a été expédiée', delivered: 'a été livrée', cancelled: 'a été annulée' };
const STATUS_EN: Record<string, string> = { confirmed: 'was confirmed by the seller', shipped: 'has been shipped', delivered: 'was delivered', cancelled: 'was cancelled' };
export function orderStatus(locale: Locale, to: string, number: string, status: string, link: string): Mail {
  return locale === 'en'
    ? { to, subject: `Order ${number}: ${STATUS_EN[status] ?? status}`, text: `Your order ${number} ${STATUS_EN[status] ?? `is now "${status}"`}.\nFollow it here: ${link}${sign.en}` }
    : { to, subject: `Commande ${number} : ${STATUS_FR[status] ?? status}`, text: `Votre commande ${number} ${STATUS_FR[status] ?? `est maintenant « ${status} »`}.\nSuivez-la ici : ${link}${sign.fr}` };
}
export function planDecision(locale: Locale, to: string, shopName: string, planName: string, approved: boolean, link: string): Mail {
  return locale === 'en'
    ? { to, subject: approved ? `Your ${planName} plan is active` : 'Your plan request was declined', text: approved ? `Your ${planName} plan is now active for "${shopName}" (3 months).\nManage your shop: ${link}${sign.en}` : `Your request for the ${planName} plan for "${shopName}" could not be accepted. Contact us at contact@mwindamarket.com for details.${sign.en}` }
    : { to, subject: approved ? `Votre abonnement ${planName} est actif` : 'Votre demande d’abonnement n’a pas été acceptée', text: approved ? `Votre abonnement ${planName} est maintenant actif pour « ${shopName} » (3 mois).\nGérez votre boutique : ${link}${sign.fr}` : `Votre demande d’abonnement ${planName} pour « ${shopName} » n’a pas pu être acceptée. Contactez-nous à contact@mwindamarket.com pour en savoir plus.${sign.fr}` };
}
