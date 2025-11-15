import transporter from "../configuration/mailerConfig";

interface MailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    fromName?: string;
}

export async function sendMail(
    { fromName, to, subject, text, html }: MailOptions): Promise<void> {    
    try {
        const info = await transporter.sendMail({
            from: `"${fromName || "Hiki Team"}" <${process.env.MAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });
    } catch (err) {
        
    }
}
