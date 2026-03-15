const nodemailer = require('nodemailer');

// Create transporter once and reuse it (Connection Pooling)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    // Add timeouts to prevent hanging the server
    connectionTimeout: 5000, 
    greetingTimeout: 5000,
    socketTimeout: 10000,
});

const sendEmail = async ({ email, subject, message }) => {
    // Define email options
    const mailOptions = {
        from: `"Food Rush" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        text: message,
    };

    // Send the email
    return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
