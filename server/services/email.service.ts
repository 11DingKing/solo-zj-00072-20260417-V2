import sgMail from "@sendgrid/mail";
const host = process.env.HOST;
const sendingEmail = process.env.SENDING_EMAIL;

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export const createResetPasswordEmail = (
  receiverEmail: string,
  resetTokenValue: string,
): sgMail.MailDataRequired => {
  const email: sgMail.MailDataRequired = {
    to: receiverEmail,
    from: `${sendingEmail}`,
    subject: "Reset password link",
    text: "Some useless text",
    html: `<p>You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n Please click on the following link, or paste this into your browser to complete the process:\n\n
  <a href="http://${host}/login/reset/${resetTokenValue}">http://${host}/login/reset/${resetTokenValue}</a> \n\n If you did not request this, please ignore this email and your password will remain unchanged.\n </p>`,
  };

  return email;
};

export const createResetConfirmationEmail = (
  receiverEmail: string,
): sgMail.MailDataRequired => {
  const email: sgMail.MailDataRequired = {
    to: receiverEmail,
    from: `${sendingEmail}`,
    subject: "Your password has been changed",
    text: "Some useless text",
    html: `<p>This is a confirmation that the password for your account ${receiverEmail} has just been changed. </p>`,
  };

  return email;
};

export const createVerificationEmail = (
  receiverEmail: string,
  verificationTokenValue: string,
): sgMail.MailDataRequired => {
  const email = {
    to: receiverEmail,
    from: `${sendingEmail}`,
    subject: "Email Verification",
    text: "Some uselss text",
    html: `<p>Please verify your account by clicking the link: 
  <a href="http://${host}/account/confirm/${verificationTokenValue}">http://${host}/account/confirm/${verificationTokenValue}</a> </p>`,
  };

  return email;
};

export const createAccountLockedEmail = (
  receiverEmail: string,
  unlockTokenValue: string,
  lockDurationSeconds: number,
): sgMail.MailDataRequired => {
  const lockDurationMinutes = Math.ceil(lockDurationSeconds / 60);
  const email = {
    to: receiverEmail,
    from: `${sendingEmail}`,
    subject: "Account Locked - Security Alert",
    text: "Your account has been locked due to multiple failed login attempts.",
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d32f2f;">Security Alert: Account Locked</h2>
      <p>Dear User,</p>
      <p>Your account has been temporarily locked due to <strong>5 consecutive failed login attempts</strong>.</p>
      <p><strong>Important Information:</strong></p>
      <ul>
        <li>Your account will automatically unlock after <strong>${lockDurationMinutes} minutes</strong></li>
        <li>If you did not attempt to log in, please change your password immediately</li>
      </ul>
      <p><strong>To unlock your account now:</strong></p>
      <p>Click the link below to unlock your account immediately (valid for 1 hour):</p>
      <p style="text-align: center; margin: 20px 0;">
        <a href="http://${host}/account/unlock/${unlockTokenValue}" 
           style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Unlock My Account
        </a>
      </p>
      <p style="font-size: 12px; color: #666;">
        If the button above doesn't work, copy and paste this URL into your browser:<br/>
        http://${host}/account/unlock/${unlockTokenValue}
      </p>
      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>`,
  };

  return email as sgMail.MailDataRequired;
};

export const sendEmail = async (email: sgMail.MailDataRequired) =>
  sgMail.send(email);

export default {
  createResetPasswordEmail,
  createResetConfirmationEmail,
  createVerificationEmail,
  createAccountLockedEmail,
  sendEmail,
};
