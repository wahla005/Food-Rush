const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ email, subject, message }) => {
    console.log(`Resend: Sending email to: ${email}`);
    
    try {
        const { data, error } = await resend.emails.send({
            from: 'Food Rush <no-reply@softwares.software>',
            to: email,
            subject: subject,
            text: message.replace(/<[^>]*>?/gm, ''), // Stripped version for text fallback
            html: message, // Use message as HTML
        });

        if (error) {
            console.error(`Resend Error: ${error.message}`);
            throw new Error(error.message);
        }

        console.log(`Email sent via Resend! ID: ${data.id}`);
        return data;
    } catch (error) {
        console.error(`Resend Exception: ${error.message}`);
        throw error;
    }
};

module.exports = sendEmail;
