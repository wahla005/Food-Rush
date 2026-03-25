/**
 * Centralized Email Templates for Food Rush
 * Provides professionally styled HTML templates for OTPs and other notifications.
 */

const getOTPTemplate = ({ title, name, otp, description }) => {
    return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #f97316; margin: 0; font-size: 28px; letter-spacing: -0.5px;">Food Rush</h1>
                <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">${title}</p>
            </div>
            
            <div style="background: #ffffff; padding: 10px 0;">
                <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Hi <strong>${name}</strong>,</p>
                <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
                    ${description || 'Your one-time password (OTP) for authentication is provided below. Please enter this code to proceed.'}
                </p>
                
                <div style="background: #fff7ed; border: 2px dashed #fdba74; padding: 24px; border-radius: 12px; font-size: 32px; font-weight: 800; text-align: center; color: #ea580c; letter-spacing: 8px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
                    ${otp}
                </div>
                
                <p style="font-size: 14px; line-height: 1.6; color: #64748b; text-align: center;">
                    This code will expire in <strong style="color: #1e293b;">10 minutes</strong>.
                </p>
                <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center; margin-top: 8px;">
                    If you did not request this, please ignore this email.
                </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 32px 0;">
            
            <div style="text-align: center;">
                <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                    &copy; ${new Date().getFullYear()} Food Rush Team. All rights reserved.
                </p>
                <p style="font-size: 11px; color: #cbd5e1; margin-top: 4px;">
                    This is an automated message, please do not reply.
                </p>
            </div>
        </div>
    `;
};

module.exports = {
    getOTPTemplate
};
