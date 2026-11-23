import nodemailer from 'nodemailer';

export interface Mail { to: string; subject: string; text: string; html?: string }
export interface Mailer { send(mail: Mail): Promise<void> }

/** Garde les messages en mémoire (tests). */
export class MemoryMailer implements Mailer {
  sent: Mail[] = [];
  async send(mail: Mail): Promise<void> {
    this.sent.push(mail);
  }
  last(to?: string): Mail | undefined {
    return [...this.sent].reverse().find((m) => !to || m.to === to);
  }
}

/** Sans configuration SMTP : n'envoie rien et ne journalise aucun contenu (les liens contiennent des jetons). */
export class NoopMailer implements Mailer {
  async send(): Promise<void> {}
}

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Met en forme le message texte : logo, paragraphes, liens cliquables, premier lien en bouton. */
export function renderHtml(text: string, baseUrl: string): string {
  let first = true;
  const linkify = (line: string) => esc(line).replace(/https?:\/\/[^\s<]+/g, (u) => {
    if (first && line.trim().startsWith('http') === false && /[:：]\s*https?:\/\//.test(line)) { first = false; return `<a href="${u}" style="display:inline-block;margin-top:6px;padding:10px 18px;background:#E68723;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">Ouvrir</a>`; }
    return `<a href="${u}" style="color:#E68723">${u}</a>`;
  });
  const body = text.split(/\n{2,}/).map((p) => `<p style="margin:0 0 14px;line-height:1.55">${p.split('\n').map(linkify).join('<br>')}</p>`).join('');
  const logo = baseUrl ? `<img src="${baseUrl}/images/brand/mwinda-h-light.png" alt="Mwinda Market" height="48" style="display:block;height:48px;width:auto">` : '<strong style="font-size:20px">Mwinda Market</strong>';
  return `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#1f2937"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:10px;overflow:hidden"><tr><td style="padding:20px 28px;border-bottom:3px solid #E68723">${logo}</td></tr><tr><td style="padding:28px;font-size:15px">${body}</td></tr><tr><td style="padding:16px 28px;background:#fafafa;font-size:12px;color:#6b7280">Mwinda Market · La place de marché africaine<br>contact@mwindamarket.com</td></tr></table></td></tr></table></body></html>`;
}

export class SmtpMailer implements Mailer {
  private transport;
  constructor(url: string, private from: string, private baseUrl = '') {
    this.transport = nodemailer.createTransport({ url, connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 12000 } as unknown as Parameters<typeof nodemailer.createTransport>[0]);
  }
  async send(mail: Mail): Promise<void> {
    await this.transport.sendMail({ from: this.from, to: mail.to, subject: mail.subject, text: mail.text, html: mail.html ?? renderHtml(mail.text, this.baseUrl) });
  }
}
