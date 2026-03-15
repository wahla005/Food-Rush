const nodemailer = require('nodemailer');

// Create transporter once and reuse it (Connection Pooling)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    pool: true, // Use connection pooling
    maxConnections: 3,
    maxMessages: 100,
    connectionTimeout: 15000, 
    greetingTimeout: 15000,
    socketTimeout: 20000,
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
