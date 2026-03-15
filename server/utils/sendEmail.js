const nodemailer = require('nodemailer');

// Create transporter once and reuse it (Connection Pooling)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS (standard for Render/Vercel)
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    // Add timeouts to prevent hanging the server
    connectionTimeout: 10000, 
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
        rejectUnauthorized: false // Helps with some cloud network restrictions
    }
});

const sendEmail = async ({ email, subject, message }) => {
    console.log(`📧 Attempting to send email to: ${email}`);
    
    // Define email options
    const mailOptions = {
        from: `"Food Rush" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        text: message,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully! MessageID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`❌ Email Send Error: ${error.message}`);
        throw error;
    }
};

module.exports = sendEmail;
