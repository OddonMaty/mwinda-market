import type { Mail } from './mailer.js';

type Locale = 'fr' | 'en';
const sign = { fr: '\n\nL\'équipe Sao Tech Market', en: '\n\nThe Sao Tech Market team' };

export function verifyEmail(locale: Locale, to: string, link: string): Mail {
  return locale === 'en'
    ? { to, subject: 'Confirm your email address', text: `Welcome to Sao Tech Market.\nConfirm your email address: ${link}\nThis link is valid for 24 hours.${sign.en}` }
    : { to, subject: 'Confirmez votre adresse e-mail', text: `Bienvenue sur Sao Tech Market.\nConfirmez votre adresse e-mail : ${link}\nCe lien est valable 24 heures.${sign.fr}` };
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
    ? { to, subject: 'Your password was changed', text: `Your Sao Tech Market password was just changed. If this wasn't you, reset it immediately and contact us.${sign.en}` }
    : { to, subject: 'Votre mot de passe a été modifié', text: `Le mot de passe de votre compte Sao Tech Market vient d'être modifié. Si ce n'était pas vous, réinitialisez-le immédiatement et contactez-nous.${sign.fr}` };
}
