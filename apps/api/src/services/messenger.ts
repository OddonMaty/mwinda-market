/** Canaux de messagerie mobile : SMS (Twilio) et WhatsApp (API officielle Meta). */
export type Channel = 'sms' | 'whatsapp';
export type Template = 'code' | 'new_order' | 'withdrawal';

export interface Messenger {
  available(): Record<Channel, boolean>;
  /** Code à usage unique (vérification de compte, réinitialisation du mot de passe). */
  sendCode(channel: Channel, to: string, code: string, locale: string): Promise<void>;
  /** Notification WhatsApp basée sur un modèle approuvé par Meta (nom exact : mwinda_<modèle>). */
  notify(to: string, template: Exclude<Template, 'code'>, params: string[], locale: string): Promise<void>;
}

const TEMPLATE_NAME: Record<Template, string> = { code: 'mwinda_code', new_order: 'mwinda_nouvelle_commande', withdrawal: 'mwinda_retrait' };
/** Les modèles sont créés en français et en anglais. */
const waLang = (locale: string) => (locale === 'fr' ? 'fr' : 'en');

const CODE_TEXT: Record<string, (c: string) => string> = {
  fr: (c) => `Mwinda Market : votre code de vérification est ${c}. Il expire dans 10 minutes. Ne le partagez avec personne.`,
  en: (c) => `Mwinda Market: your verification code is ${c}. It expires in 10 minutes. Do not share it.`,
};

export class ChannelMessenger implements Messenger {
  constructor(private o: { whatsappToken?: string; whatsappPhoneId?: string; twilioSid?: string; twilioToken?: string; twilioFrom?: string }) {}

  available() {
    return { sms: !!(this.o.twilioSid && this.o.twilioToken && this.o.twilioFrom), whatsapp: !!(this.o.whatsappToken && this.o.whatsappPhoneId) };
  }

  private async whatsapp(to: string, template: Template, params: string[], locale: string) {
    const components: unknown[] = [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text })) }];
    if (template === 'code') components.push({ type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: params[0] }] });
    const res = await fetch(`https://graph.facebook.com/v21.0/${this.o.whatsappPhoneId}/messages`, {
      method: 'POST', signal: AbortSignal.timeout(10000),
      headers: { authorization: `Bearer ${this.o.whatsappToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: to.replace(/^\+/, ''), type: 'template', template: { name: TEMPLATE_NAME[template], language: { code: waLang(locale) }, components } }),
    });
    if (!res.ok) throw new Error(`whatsapp_${res.status}`);
  }

  private async sms(to: string, body: string) {
    const auth = Buffer.from(`${this.o.twilioSid}:${this.o.twilioToken}`).toString('base64');
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.o.twilioSid}/Messages.json`, {
      method: 'POST', signal: AbortSignal.timeout(10000),
      headers: { authorization: `Basic ${auth}`, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: to, From: this.o.twilioFrom!, Body: body }),
    });
    if (!res.ok) throw new Error(`sms_${res.status}`);
  }

  async sendCode(channel: Channel, to: string, code: string, locale: string) {
    if (!this.available()[channel]) throw new Error(`${channel}_unavailable`);
    if (channel === 'sms') return this.sms(to, (CODE_TEXT[locale] ?? CODE_TEXT.fr!)(code));
    return this.whatsapp(to, 'code', [code], locale);
  }

  async notify(to: string, template: Exclude<Template, 'code'>, params: string[], locale: string) {
    if (!this.available().whatsapp) throw new Error('whatsapp_unavailable');
    return this.whatsapp(to, template, params, locale);
  }
}

/** Messagerie de test : garde en mémoire ce qui aurait été envoyé. */
export class MemoryMessenger implements Messenger {
  sent: { channel: Channel | 'notify'; to: string; code?: string; template?: string; params?: string[] }[] = [];
  constructor(private avail: Record<Channel, boolean> = { sms: true, whatsapp: true }) {}
  available() { return this.avail; }
  async sendCode(channel: Channel, to: string, code: string) { this.sent.push({ channel, to, code }); }
  async notify(to: string, template: string, params: string[]) { this.sent.push({ channel: 'notify', to, template, params }); }
  lastCode(to: string) { return [...this.sent].reverse().find((m) => m.to === to && m.code)?.code; }
}
