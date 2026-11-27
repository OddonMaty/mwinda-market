import type { Mail } from './mailer.js';

export type Locale = 'fr' | 'en' | 'sw' | 'zh' | 'es';
export const asLocale = (l: string | null | undefined): Locale => (l === 'en' || l === 'sw' || l === 'zh' || l === 'es' ? l : 'fr');

const SIGN: Record<Locale, string> = {
  fr: "\n\nL'équipe Mwinda Market", en: '\n\nThe Mwinda Market team', sw: '\n\nTimu ya Mwinda Market', zh: '\n\nMwinda Market 团队', es: '\n\nEl equipo de Mwinda Market',
};

/** Choisit le texte de la langue demandée (français par défaut) et ajoute la signature. */
type Tx = Record<Locale, { subject: string; text: string }>;
const pick = (locale: Locale, to: string, t: Tx): Mail => ({ to, subject: t[locale].subject, text: t[locale].text + SIGN[locale] });

export function verifyEmail(locale: Locale, to: string, link: string): Mail {
  return pick(locale, to, {
    fr: { subject: 'Confirmez votre adresse e-mail', text: `Bienvenue sur Mwinda Market.\nConfirmez votre adresse e-mail : ${link}\nCe lien est valable 24 heures.` },
    en: { subject: 'Confirm your email address', text: `Welcome to Mwinda Market.\nConfirm your email address: ${link}\nThis link is valid for 24 hours.` },
    sw: { subject: 'Thibitisha anwani yako ya barua pepe', text: `Karibu Mwinda Market.\nThibitisha anwani yako ya barua pepe: ${link}\nKiungo hiki ni halali kwa saa 24.` },
    zh: { subject: '请确认您的电子邮箱', text: `欢迎来到 Mwinda Market。\n请确认您的电子邮箱：${link}\n此链接 24 小时内有效。` },
    es: { subject: 'Confirma tu dirección de correo', text: `Bienvenido a Mwinda Market.\nConfirma tu dirección de correo: ${link}\nEste enlace es válido durante 24 horas.` },
  });
}
export function accountExists(locale: Locale, to: string, loginLink: string, resetLink: string): Mail {
  return pick(locale, to, {
    fr: { subject: 'Vous avez déjà un compte', text: `Quelqu'un a tenté de créer un compte avec cette adresse, mais un compte existe déjà.\nSe connecter : ${loginLink}\nMot de passe oublié ? ${resetLink}\nSi ce n'était pas vous, ignorez ce message.` },
    en: { subject: 'You already have an account', text: `Someone tried to create an account with this address, but one already exists.\nLog in: ${loginLink}\nForgot your password? ${resetLink}\nIf this wasn't you, ignore this message.` },
    sw: { subject: 'Tayari una akaunti', text: `Mtu alijaribu kufungua akaunti kwa anwani hii, lakini akaunti tayari ipo.\nIngia: ${loginLink}\nUmesahau nenosiri? ${resetLink}\nKama si wewe, puuza ujumbe huu.` },
    zh: { subject: '您已经有账户了', text: `有人尝试用此邮箱注册账户，但该账户已存在。\n登录：${loginLink}\n忘记密码？${resetLink}\n如果不是您本人操作，请忽略此邮件。` },
    es: { subject: 'Ya tienes una cuenta', text: `Alguien intentó crear una cuenta con esta dirección, pero ya existe una.\nIniciar sesión: ${loginLink}\n¿Olvidaste tu contraseña? ${resetLink}\nSi no fuiste tú, ignora este mensaje.` },
  });
}
export function resetPassword(locale: Locale, to: string, link: string): Mail {
  return pick(locale, to, {
    fr: { subject: 'Réinitialisation de votre mot de passe', text: `Réinitialisez votre mot de passe : ${link}\nCe lien est valable 1 heure et ne peut servir qu'une fois. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.` },
    en: { subject: 'Reset your password', text: `Reset your password: ${link}\nThis link is valid for 1 hour and can be used once. If you didn't ask for it, ignore this message.` },
    sw: { subject: 'Weka upya nenosiri lako', text: `Weka upya nenosiri lako: ${link}\nKiungo hiki ni halali kwa saa 1 na kinatumika mara moja tu. Kama hukuomba, puuza ujumbe huu.` },
    zh: { subject: '重置您的密码', text: `重置密码：${link}\n此链接 1 小时内有效，且只能使用一次。如果不是您本人申请，请忽略此邮件。` },
    es: { subject: 'Restablece tu contraseña', text: `Restablece tu contraseña: ${link}\nEste enlace es válido durante 1 hora y solo se puede usar una vez. Si no lo solicitaste, ignora este mensaje.` },
  });
}
export function passwordChanged(locale: Locale, to: string): Mail {
  return pick(locale, to, {
    fr: { subject: 'Votre mot de passe a été modifié', text: "Le mot de passe de votre compte Mwinda Market vient d'être modifié. Si ce n'était pas vous, réinitialisez-le immédiatement et contactez-nous." },
    en: { subject: 'Your password was changed', text: "Your Mwinda Market password was just changed. If this wasn't you, reset it immediately and contact us." },
    sw: { subject: 'Nenosiri lako limebadilishwa', text: 'Nenosiri la akaunti yako ya Mwinda Market limebadilishwa sasa hivi. Kama si wewe, liweke upya mara moja na uwasiliane nasi.' },
    zh: { subject: '您的密码已被修改', text: '您的 Mwinda Market 账户密码刚刚被修改。如果不是您本人操作，请立即重置密码并联系我们。' },
    es: { subject: 'Tu contraseña ha sido modificada', text: 'La contraseña de tu cuenta de Mwinda Market acaba de cambiar. Si no fuiste tú, restablécela de inmediato y contáctanos.' },
  });
}

export function shopApproved(locale: Locale, to: string, shopName: string, link: string): Mail {
  return pick(locale, to, {
    fr: { subject: `Votre boutique « ${shopName} » a été acceptée`, text: `Bonne nouvelle : votre boutique « ${shopName} » a été acceptée sur Mwinda Market.\nVous pouvez dès maintenant publier vos produits et répondre aux questions de vos clients.\nAccéder à votre boutique : ${link}` },
    en: { subject: `Your shop "${shopName}" has been accepted`, text: `Good news: your shop "${shopName}" has been accepted on Mwinda Market.\nYou can now publish your products and answer your customers' questions.\nAccess your shop: ${link}` },
    sw: { subject: `Duka lako "${shopName}" limekubaliwa`, text: `Habari njema: duka lako "${shopName}" limekubaliwa kwenye Mwinda Market.\nSasa unaweza kuchapisha bidhaa zako na kujibu maswali ya wateja wako.\nFungua duka lako: ${link}` },
    zh: { subject: `您的店铺“${shopName}”已通过审核`, text: `好消息：您的店铺“${shopName}”已在 Mwinda Market 通过审核。\n您现在可以发布商品并回复客户的问题。\n进入店铺：${link}` },
    es: { subject: `Tu tienda «${shopName}» ha sido aceptada`, text: `Buenas noticias: tu tienda «${shopName}» ha sido aceptada en Mwinda Market.\nYa puedes publicar tus productos y responder a las preguntas de tus clientes.\nAccede a tu tienda: ${link}` },
  });
}
export function shopRejected(locale: Locale, to: string, shopName: string, reason: string | null): Mail {
  const r = reason || null;
  return pick(locale, to, {
    fr: { subject: `Votre boutique « ${shopName} » n’a pas été acceptée`, text: `Nous avons examiné votre demande d’ouverture de « ${shopName} » sur Mwinda Market et n’avons pas pu l’accepter.\nMotif : ${r ?? 'non précisé'}\nVous pouvez nous écrire à contact@mwindamarket.com pour en discuter.` },
    en: { subject: `Your shop "${shopName}" was not accepted`, text: `We reviewed your request to open "${shopName}" on Mwinda Market and could not accept it.\nReason: ${r ?? 'not specified'}\nYou can write to us at contact@mwindamarket.com to discuss it.` },
    sw: { subject: `Duka lako "${shopName}" halijakubaliwa`, text: `Tumepitia ombi lako la kufungua "${shopName}" kwenye Mwinda Market na hatukuweza kulikubali.\nSababu: ${r ?? 'haijatajwa'}\nUnaweza kutuandikia contact@mwindamarket.com ili tulijadili.` },
    zh: { subject: `您的店铺“${shopName}”未通过审核`, text: `我们已审核您在 Mwinda Market 开设“${shopName}”的申请，但无法通过。\n原因：${r ?? '未说明'}\n您可以发邮件至 contact@mwindamarket.com 与我们沟通。` },
    es: { subject: `Tu tienda «${shopName}» no ha sido aceptada`, text: `Hemos revisado tu solicitud para abrir «${shopName}» en Mwinda Market y no hemos podido aceptarla.\nMotivo: ${r ?? 'no especificado'}\nPuedes escribirnos a contact@mwindamarket.com para comentarlo.` },
  });
}

export interface MailLine { name: string; quantity: number; unitUsd: number }
const usd = (n: number) => `$${n.toFixed(2)}`;
const lineText = (l: MailLine) => `- ${l.name} × ${l.quantity} : ${usd(l.unitUsd * l.quantity)}`;

export function orderPlaced(locale: Locale, to: string, number: string, lines: MailLine[], totalUsd: number, link: string): Mail {
  const body = lines.map(lineText).join('\n'); const total = usd(totalUsd);
  return pick(locale, to, {
    fr: { subject: `Commande ${number} bien reçue`, text: `Merci pour votre commande ${number} sur Mwinda Market.\n\n${body}\nTotal : ${total}\n\nChaque vendeur va confirmer puis expédier sa partie de la commande. Suivez votre commande : ${link}` },
    en: { subject: `Order ${number} received`, text: `Thank you for your order ${number} on Mwinda Market.\n\n${body}\nTotal: ${total}\n\nEach seller will confirm and ship their part. Follow your order: ${link}` },
    sw: { subject: `Agizo ${number} limepokelewa`, text: `Asante kwa agizo lako ${number} kwenye Mwinda Market.\n\n${body}\nJumla: ${total}\n\nKila muuzaji atathibitisha na kutuma sehemu yake. Fuatilia agizo lako: ${link}` },
    zh: { subject: `订单 ${number} 已收到`, text: `感谢您在 Mwinda Market 下单 ${number}。\n\n${body}\n合计：${total}\n\n每位卖家将分别确认并发货。查看订单：${link}` },
    es: { subject: `Pedido ${number} recibido`, text: `Gracias por tu pedido ${number} en Mwinda Market.\n\n${body}\nTotal: ${total}\n\nCada vendedor confirmará y enviará su parte. Sigue tu pedido: ${link}` },
  });
}
export function newOrderSeller(locale: Locale, to: string, shopName: string, number: string, lines: MailLine[], link: string): Mail {
  const body = lines.map(lineText).join('\n');
  return pick(locale, to, {
    fr: { subject: `Nouvelle commande ${number} pour ${shopName}`, text: `Vous avez reçu une nouvelle commande (${number}) pour votre boutique « ${shopName} » :\n\n${body}\n\nConfirmez-la depuis votre espace vendeur : ${link}` },
    en: { subject: `New order ${number} for ${shopName}`, text: `You have a new order (${number}) for your shop "${shopName}":\n\n${body}\n\nConfirm it from your seller space: ${link}` },
    sw: { subject: `Agizo jipya ${number} la ${shopName}`, text: `Una agizo jipya (${number}) kwa duka lako "${shopName}":\n\n${body}\n\nLithibitishe kupitia eneo lako la muuzaji: ${link}` },
    zh: { subject: `店铺 ${shopName} 的新订单 ${number}`, text: `您的店铺“${shopName}”收到一笔新订单（${number}）：\n\n${body}\n\n请在卖家中心确认：${link}` },
    es: { subject: `Nuevo pedido ${number} para ${shopName}`, text: `Has recibido un nuevo pedido (${number}) para tu tienda «${shopName}»:\n\n${body}\n\nConfírmalo desde tu espacio de vendedor: ${link}` },
  });
}

const STATUS: Record<Locale, Record<string, string>> = {
  fr: { confirmed: 'a été confirmée par le vendeur', shipped: 'a été expédiée', delivered: 'a été livrée', cancelled: 'a été annulée' },
  en: { confirmed: 'was confirmed by the seller', shipped: 'has been shipped', delivered: 'was delivered', cancelled: 'was cancelled' },
  sw: { confirmed: 'imethibitishwa na muuzaji', shipped: 'imetumwa', delivered: 'imewasilishwa', cancelled: 'imeghairiwa' },
  zh: { confirmed: '已被卖家确认', shipped: '已发货', delivered: '已送达', cancelled: '已取消' },
  es: { confirmed: 'ha sido confirmado por el vendedor', shipped: 'ha sido enviado', delivered: 'ha sido entregado', cancelled: 'ha sido cancelado' },
};
export function orderStatus(locale: Locale, to: string, number: string, status: string, link: string): Mail {
  const s = (l: Locale) => STATUS[l][status] ?? status;
  return pick(locale, to, {
    fr: { subject: `Commande ${number} : ${s('fr')}`, text: `Votre commande ${number} ${STATUS.fr[status] ?? `est maintenant « ${status} »`}.\nSuivez-la ici : ${link}` },
    en: { subject: `Order ${number}: ${s('en')}`, text: `Your order ${number} ${STATUS.en[status] ?? `is now "${status}"`}.\nFollow it here: ${link}` },
    sw: { subject: `Agizo ${number}: ${s('sw')}`, text: `Agizo lako ${number} ${STATUS.sw[status] ?? `sasa ni "${status}"`}.\nLifuatilie hapa: ${link}` },
    zh: { subject: `订单 ${number}：${s('zh')}`, text: `您的订单 ${number} ${STATUS.zh[status] ?? `当前状态为“${status}”`}。\n在此查看：${link}` },
    es: { subject: `Pedido ${number}: ${s('es')}`, text: `Tu pedido ${number} ${STATUS.es[status] ?? `está ahora «${status}»`}.\nSíguelo aquí: ${link}` },
  });
}
export function planDecision(locale: Locale, to: string, shopName: string, planName: string, approved: boolean, link: string): Mail {
  return pick(locale, to, {
    fr: approved ? { subject: `Votre abonnement ${planName} est actif`, text: `Votre abonnement ${planName} est maintenant actif pour « ${shopName} » (3 mois).\nGérez votre boutique : ${link}` }
      : { subject: 'Votre demande d’abonnement n’a pas été acceptée', text: `Votre demande d’abonnement ${planName} pour « ${shopName} » n’a pas pu être acceptée. Contactez-nous à contact@mwindamarket.com pour en savoir plus.` },
    en: approved ? { subject: `Your ${planName} plan is active`, text: `Your ${planName} plan is now active for "${shopName}" (3 months).\nManage your shop: ${link}` }
      : { subject: 'Your plan request was declined', text: `Your request for the ${planName} plan for "${shopName}" could not be accepted. Contact us at contact@mwindamarket.com for details.` },
    sw: approved ? { subject: `Mpango wako wa ${planName} umeanza`, text: `Mpango wako wa ${planName} sasa unatumika kwa "${shopName}" (miezi 3).\nSimamia duka lako: ${link}` }
      : { subject: 'Ombi lako la mpango halijakubaliwa', text: `Ombi lako la mpango wa ${planName} kwa "${shopName}" halikuweza kukubaliwa. Wasiliana nasi kupitia contact@mwindamarket.com kwa maelezo.` },
    zh: approved ? { subject: `您的 ${planName} 套餐已生效`, text: `您的 ${planName} 套餐已为“${shopName}”生效（3 个月）。\n管理店铺：${link}` }
      : { subject: '您的套餐申请未通过', text: `您为“${shopName}”申请的 ${planName} 套餐未能通过。详情请联系 contact@mwindamarket.com。` },
    es: approved ? { subject: `Tu plan ${planName} está activo`, text: `Tu plan ${planName} ya está activo para «${shopName}» (3 meses).\nGestiona tu tienda: ${link}` }
      : { subject: 'Tu solicitud de plan no ha sido aceptada', text: `Tu solicitud del plan ${planName} para «${shopName}» no ha podido aceptarse. Escríbenos a contact@mwindamarket.com para más información.` },
  });
}

export function withdrawalDecision(locale: Locale, to: string, shopName: string, amount: string, paid: boolean, detail: string | null, link: string): Mail {
  const d = (label: string) => (detail ? `\n${label} ${detail}` : '');
  return pick(locale, to, {
    fr: paid ? { subject: `Retrait de ${amount} payé`, text: `Votre retrait de ${amount} pour « ${shopName} » a été payé.${d('Référence :')}\nConsultez votre portefeuille : ${link}` }
      : { subject: `Retrait de ${amount} refusé`, text: `Votre demande de retrait de ${amount} pour « ${shopName} » a été refusée.${d('Motif :')}\nLe montant est de nouveau dans votre solde disponible : ${link}` },
    en: paid ? { subject: `Withdrawal of ${amount} paid`, text: `Your withdrawal of ${amount} for "${shopName}" has been paid.${d('Reference:')}\nSee your wallet: ${link}` }
      : { subject: `Withdrawal of ${amount} declined`, text: `Your withdrawal request of ${amount} for "${shopName}" was declined.${d('Reason:')}\nThe amount is back in your available balance: ${link}` },
    sw: paid ? { subject: `Uondoaji wa ${amount} umelipwa`, text: `Uondoaji wako wa ${amount} kwa "${shopName}" umelipwa.${d('Kumbukumbu:')}\nAngalia pochi yako: ${link}` }
      : { subject: `Uondoaji wa ${amount} umekataliwa`, text: `Ombi lako la kuondoa ${amount} kwa "${shopName}" limekataliwa.${d('Sababu:')}\nKiasi kimerudi kwenye salio lako linalopatikana: ${link}` },
    zh: paid ? { subject: `提现 ${amount} 已支付`, text: `您为“${shopName}”申请的 ${amount} 提现已支付。${d('凭证：')}\n查看钱包：${link}` }
      : { subject: `提现 ${amount} 被拒绝`, text: `您为“${shopName}”申请的 ${amount} 提现已被拒绝。${d('原因：')}\n该金额已退回您的可用余额：${link}` },
    es: paid ? { subject: `Retiro de ${amount} pagado`, text: `Tu retiro de ${amount} para «${shopName}» ha sido pagado.${d('Referencia:')}\nConsulta tu monedero: ${link}` }
      : { subject: `Retiro de ${amount} rechazado`, text: `Tu solicitud de retiro de ${amount} para «${shopName}» ha sido rechazada.${d('Motivo:')}\nEl importe ha vuelto a tu saldo disponible: ${link}` },
  });
}

export function newsletterWelcome(locale: Locale, to: string, unsubscribeLink: string): Mail {
  return pick(locale, to, {
    fr: { subject: 'Bienvenue dans la newsletter Mwinda Market', text: `Merci de vous être abonné(e) à la newsletter Mwinda Market : nouveautés, offres du jour et boutiques à découvrir.\nPour vous désabonner à tout moment : ${unsubscribeLink}` },
    en: { subject: 'Welcome to the Mwinda Market newsletter', text: `Thanks for subscribing to the Mwinda Market newsletter: new arrivals, daily deals and shops to discover.\nUnsubscribe at any time: ${unsubscribeLink}` },
    sw: { subject: 'Karibu kwenye jarida la Mwinda Market', text: `Asante kwa kujiunga na jarida la Mwinda Market: bidhaa mpya, ofa za siku na maduka ya kugundua.\nJiondoe wakati wowote: ${unsubscribeLink}` },
    zh: { subject: '欢迎订阅 Mwinda Market 通讯', text: `感谢订阅 Mwinda Market 通讯：新品、每日特惠和值得发现的店铺。\n您可随时退订：${unsubscribeLink}` },
    es: { subject: 'Bienvenido al boletín de Mwinda Market', text: `Gracias por suscribirte al boletín de Mwinda Market: novedades, ofertas del día y tiendas por descubrir.\nPuedes darte de baja en cualquier momento: ${unsubscribeLink}` },
  });
}
