const nodemailer = require('nodemailer');

const sendEmail = async ({ email, subject, message }) => {
    // 1. Create a transporter
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    // 2. Define email options
    const mailOptions = {
        from: `Food Rush <${process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        text: message,
    };

    // 3. Actually send the email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
