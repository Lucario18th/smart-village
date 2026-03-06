import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendVerificationEmail(to: string, verificationUrl: string) {
    const transportUrl = process.env.SMTP_URL;

    if (!transportUrl) {
      // No mail transport configured – skip silently to avoid leaking tokens in logs.
      return;
    }

    const transporter = nodemailer.createTransport(transportUrl);

    await transporter.sendMail({
      to,
      from: process.env.MAIL_FROM || "no-reply@smart-village.local",
      subject: "Bitte bestätige deine E-Mail",
      text: `Hallo,\n\nbitte bestätige deine E-Mail-Adresse, indem du auf folgenden Link klickst:\n${verificationUrl}\n\nDer Link ist 5 Minuten gültig.`,
      html: `<p>Hallo,</p><p>bitte bestätige deine E-Mail-Adresse, indem du auf folgenden Link klickst:</p><p><a href="${verificationUrl}">E-Mail bestätigen</a></p><p>Der Link ist 5 Minuten gültig.</p>`,
    });

    this.logger.log(`Verification email queued for ${to}`);
  }
}
