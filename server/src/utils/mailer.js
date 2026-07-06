import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const sendApprovalEmail = async (to, tenantName) => {
  await transporter.sendMail({
    from: `"Kreditfy" <${process.env.GMAIL_USER}>`,
    to,
    subject: `¡Tu empresa está activa en Kreditfy! 🎉`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Kreditfy</h2>
        <p>Hola, te informamos que la solicitud de registro de <strong>${tenantName}</strong> ha sido <strong>aprobada</strong>.</p>
        <p>Ya puedes iniciar sesión con tus credenciales en la plataforma:</p>
        <a href="${process.env.FRONTEND_URL}/login"
           style="display:inline-block;margin:16px 0;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
          Ingresar a Kreditfy
        </a>
        <p style="color:#6b7280;font-size:0.85rem;">
          Si tienes alguna duda, responde a este correo y te ayudaremos.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
        <p style="color:#9ca3af;font-size:0.75rem;">Kreditfy — Sistema de ventas a crédito</p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (to, resetUrl) => {
  await transporter.sendMail({
    from: `"Kreditfy" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Recuperación de contraseña — Kreditfy',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Kreditfy</h2>
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
        <p>Haz clic en el botón para crear una nueva contraseña. El enlace expira en <strong>1 hora</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block;margin:16px 0;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
          Restablecer contraseña
        </a>
        <p style="color:#6b7280;font-size:0.85rem;">
          Si no solicitaste este cambio, ignora este correo. Tu contraseña no será modificada.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
        <p style="color:#9ca3af;font-size:0.75rem;">
          O copia este enlace en tu navegador:<br>
          <span style="color:#4f46e5;">${resetUrl}</span>
        </p>
      </div>
    `,
  });
};
