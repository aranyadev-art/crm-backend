// backend/services/emailService.js

const nodemailer = require("nodemailer");

// ========================================
// TRANSPORTER SETUP
// ========================================
// Ye function har call pe transporter banata hai using .env credentials.
// Agar credentials galat ya missing hain, transporter creation ya
// sendMail() call pe error throw hoga — jo controller mein catch hoga.

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // true for port 465, false for port 587 (TLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// ========================================
// SEND WELCOME EMAIL
// ========================================
// Controller isko call karega sirf jab user.emailId exist karta hai.
// Ye function error throw karega agar sending fail ho —
// controller isko try/catch mein wrap karke handle karega.

const sendWelcomeEmail = async (user) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: user.emailId,
    subject: "Welcome to MatriMatch CRM!",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome, ${user.fullName}!</h2>
        <p>Thank you for registering with MatriMatch CRM.</p>
        <p>Your profile has been successfully created. Our team will reach out to you soon regarding suitable matches.</p>
        <br/>
        <p>Regards,<br/>MatriMatch CRM Team</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};


// ========================================
// SEND CREDENTIALS EMAIL
// ========================================
// Controller isko call karega User creation ke baad, jab
// username + plain temporary password generate ho chuke hon.
// plainPassword sirf yahan tak hi plain-text mein zinda rehta hai —
// isko kahin store ya log nahi kiya jaata.

const sendCredentialsEmail = async (user, plainPassword) => {
  const transporter = createTransporter();

  const loginUrl = process.env.FRONTEND_LOGIN_URL || "http://localhost:5173/login";

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: user.emailId,
    subject: "Your MatriMatch CRM Login Credentials",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Welcome to MatriMatch CRM</h2>

        <p>Hello <strong>${user.fullName}</strong>,</p>

        <p>Your MatriMatch account has been created. Please find your login details below:</p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;">
            <strong>Username:</strong> ${user.username}
          </p>
          <p style="margin: 0;">
            <strong>Temporary Password:</strong> ${plainPassword}
          </p>
        </div>

        <p>
          <a href="${loginUrl}" style="background: #4f46e5; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; display: inline-block;">
            Login to MatriMatch CRM
          </a>
        </p>

        <p style="font-size: 13px; color: #64748b;">
          For security, please change your password after logging in.
        </p>

        <br/>
        <p>Regards,<br/>MatriMatch CRM Team</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

// ========================================
// SEND PASSWORD RESET CODE
// ========================================
// Forgot Password flow ke liye — 6-digit OTP bheja jata hai.
// plainCode sirf yahan tak plain-text mein hota hai — controller
// mein isko hash karke DB mein store kiya jaata hai, kabhi plain
// text mein save/log nahi hota.

const sendPasswordResetCode = async (user, plainCode) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: user.emailId,
    subject: "Your MatriMatch CRM Password Reset Code",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Password Reset Request</h2>

        <p>Hello <strong>${user.fullName}</strong>,</p>

        <p>We received a request to reset your MatriMatch CRM password. Use the code below to proceed:</p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #4f46e5;">
            ${plainCode}
          </p>
        </div>

        <p style="font-size: 13px; color: #64748b;">
          This code will expire in 10 minutes. If you did not request this, please ignore this email.
        </p>

        <br/>
        <p>Regards,<br/>MatriMatch CRM Team</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};


module.exports = {
  sendWelcomeEmail,
  sendCredentialsEmail,
  sendPasswordResetCode,
};
