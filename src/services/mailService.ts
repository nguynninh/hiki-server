import transporter from "../configuration/mailerConfig";

interface MailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

export async function sendMail(
    { to, subject, text, html }: MailOptions): Promise<void> {
    const timestamp = new Date().toISOString();
    
    try {
        const info = await transporter.sendMail({
            from: `"Shop" <${process.env.MAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });
        console.log("Sent:", to, info.messageId);
    } catch (err) {
        if (err instanceof Error) {
            console.error("Failed:", to, err.message);
        } else {
            console.error("Failed:", to, err);
        }
    }
}
