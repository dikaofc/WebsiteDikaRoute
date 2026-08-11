/** Diagnostic — import nodemailer + server/mailer.ts. */
import nodemailer from "nodemailer";
import { isMailConfigured } from "../server/mailer.ts";

export default (req, res) => {
  res.status(200).json({ ok: true, nodemailer: !!nodemailer.createTransport, mailConfigured: isMailConfigured() });
};
