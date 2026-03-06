import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private resolveTransportOptions() {
    const smtpUrl = process.env.SMTP_URL;
    if (smtpUrl) {
      return nodemailer.createTransport(smtpUrl);
    }

    const host = process.env.SMTP_HOST || "smartvillage-mailhog";
    const port = Number(process.env.SMTP_PORT ?? 1025);
    const secure =
      (process.env.SMTP_SECURE || "false").toString().toLowerCase() === "true";
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || Number.isNaN(port)) {
      return null;
    }

    const transportConfig: SMTPTransport.Options = {
      host,
      port,
      secure,
    };

    if (user || pass) {
      transportConfig.auth = {
        user: user || "",
        pass: pass || "",
      };
    }

    return nodemailer.createTransport(transportConfig);
  }

  async sendVerificationCodeEmail(to: string, code: string) {
    const transporter = this.resolveTransportOptions();

    if (!transporter) {
      // No mail transport configured – skip silently to avoid leaking tokens in logs.
      return;
    }

    await transporter.sendMail({
      to,
      from:
        process.env.MAIL_FROM || 'Smart Village <no-reply@smart-village.local>',
      subject: "Dein Smart Village Bestätigungscode",
      text: `Hallo,\n\ndein Bestätigungscode lautet: ${code}\nEr ist 5 Minuten gültig.\n\nGib den Code im Smart Village Admin ein, um deine E-Mail zu bestätigen.`,
      html: `<p>Hallo,</p><p>dein Bestätigungscode lautet:</p><p style="font-size: 24px; letter-spacing: 4px; font-weight: bold;">${code}</p><p>Er ist 5 Minuten gültig.</p><p>Gib den Code im Smart Village Admin ein, um deine E-Mail zu bestätigen.</p>`,
    });

    this.logger.log(`Verification email queued for ${to}`);
  }
}
