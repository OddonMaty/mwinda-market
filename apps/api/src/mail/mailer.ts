import nodemailer from 'nodemailer';

export interface Mail { to: string; subject: string; text: string }
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

export class SmtpMailer implements Mailer {
  private transport;
  constructor(url: string, private from: string) {
    this.transport = nodemailer.createTransport(url);
  }
  async send(mail: Mail): Promise<void> {
    await this.transport.sendMail({ from: this.from, to: mail.to, subject: mail.subject, text: mail.text });
  }
}
