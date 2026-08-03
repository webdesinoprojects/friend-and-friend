const crypto = require("crypto");

const RESEND_TEST_RECIPIENT = process.env.RESEND_TEST_RECIPIENT || "webdesino.com@gmail.com";

const isResendTestMode = () => String(process.env.RESEND_TEST_MODE || "false").toLowerCase() === "true";

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);

async function sendTransactionalEmail({ to, subject, html, text, tag = "account", replyTo }) {
  if (!to) throw new Error("Recipient email is missing.");
  const apiKey = process.env.RESEND_TRANSACTIONAL_API_KEY;
  if (!apiKey) throw new Error("RESEND_TRANSACTIONAL_API_KEY is not configured.");
  // Resend's onboarding sender can only deliver to the account owner. Keep every
  // application email testable until a custom sending domain is verified.
  const recipient = isResendTestMode() ? RESEND_TEST_RECIPIENT : to;
  const configuredFrom = process.env.RESEND_FROM_EMAIL || process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";
  const senderName = String(process.env.RESEND_FROM_NAME || "PPlusOne").trim();
  const from = configuredFrom.includes("<") ? configuredFrom : `${senderName} <${configuredFrom}>`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "idempotency-key": `PPlusOne-${tag}-${crypto.randomUUID()}`,
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject,
      html,
      text,
      reply_to: replyTo || undefined,
      tags: [{ name: "category", value: tag }],
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result?.message || `Resend failed with status ${response.status}`);
  return { ...result, recipient, intendedRecipient: to, testMode: isResendTestMode() };
}

function template({ name, eyebrow, title, intro, status, statusColor, reason, ctaLabel, ctaUrl, approved }) {
  const safeName = escapeHtml(name || "there");
  const safeReason = escapeHtml(reason || "No additional reason was provided.");
  return `<!doctype html><html><body style="margin:0;background:#fffaf3;color:#10203e;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#fffaf3;background-image:linear-gradient(#f4e8dc 1px,transparent 1px),linear-gradient(90deg,#f4e8dc 1px,transparent 1px);background-size:42px 42px"><tr><td align="center" style="padding:38px 16px">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:650px;background:#ffffff;border:1px solid #edd8c7;border-radius:30px;overflow:hidden;box-shadow:0 18px 55px rgba(52,35,23,.10)">
    <tr><td style="padding:32px 38px 20px;background:linear-gradient(135deg,#fffdf9,#fff3e7)"><div style="font-size:25px;font-weight:900;color:#10203e">PPlusOne</div><div style="margin-top:8px;color:#718096;font-size:12px;font-weight:700">Safe Meetups. Real Connections.</div></td></tr>
    <tr><td style="padding:18px 38px 38px">
      <div style="display:inline-block;border:1px solid ${statusColor}55;border-radius:999px;padding:9px 15px;color:${statusColor};font-size:12px;font-weight:800">✓ ${escapeHtml(eyebrow)}</div>
      <h1 style="font-size:39px;line-height:1.08;margin:24px 0 16px;color:#10203e">${escapeHtml(title)}</h1>
      <p style="font-size:16px;line-height:1.7;margin:0 0 10px">Hi <strong>${safeName}</strong>,</p>
      <p style="font-size:16px;line-height:1.7;color:#465168;margin:0 0 26px">${escapeHtml(intro)}</p>
      <div style="border:1px solid ${statusColor}44;background:${approved ? "#f0fbf5" : "#fff5f5"};border-radius:22px;padding:22px">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:1.2px;font-weight:900;color:${statusColor}">${escapeHtml(status)}</div>
        ${reason ? `<div style="margin-top:14px;font-size:14px;font-weight:800;color:#10203e">Admin decision reason</div><div style="margin-top:7px;font-size:15px;line-height:1.65;color:#465168">${safeReason}</div>` : ""}
      </div>
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:27px"><tr><td bgcolor="#101010" style="border-radius:999px"><a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:14px 25px;color:#fff;text-decoration:none;font-size:14px;font-weight:900">${escapeHtml(ctaLabel)} →</a></td></tr></table>
      <div style="height:1px;background:#eee3d9;margin:30px 0 20px"></div>
      <p style="font-size:13px;line-height:1.6;color:#718096;margin:0">For your safety, PPlusOne will never ask you to share an OTP or password by email. If you did not submit this application, contact support.</p>
    </td></tr>
  </table><p style="font-size:11px;color:#9aa2af;margin:18px 0">© ${new Date().getFullYear()} PPlusOne · Automated verification notification</p>
  </td></tr></table></body></html>`;
}

function sendApplicationReceived(application) {
  const url = `${process.env.FRONTEND_URL || "http://localhost:5173"}/application-review`;
  return sendTransactionalEmail({
    to: application.email, subject: "We received your PPlusOne application",
    html: template({ name: application.fullName, eyebrow: "Verification in progress", title: "Your application is being reviewed", intro: "Our admin team is checking your profile and identity evidence. Your account will be created only after approval, and we will email you as soon as a decision is recorded.", status: "Documents under review · Admin approval pending", statusColor: "#df7a31", ctaLabel: "View application status", ctaUrl: url }),
    text: `Hi ${application.fullName}, your PPlusOne application is under admin review. Your account will be created only after approval.`, tag: "application_received",
  });
}

function sendApplicationDecision(application, status, reason) {
  const approved = status === "VERIFIED";
  const base = process.env.FRONTEND_URL || "http://localhost:5173";
  return sendTransactionalEmail({
    to: application.email,
    subject: approved ? "Your PPlusOne profile has been approved" : "Your PPlusOne application was not approved",
    html: template({
      name: application.fullName,
      eyebrow: approved ? "Verification complete" : "Application decision",
      title: approved ? "Welcome to PPlusOne" : "Your application needs attention",
      intro: approved ? "Your identity and profile were approved by our admin team. Your PPlusOne account has now been created and you can log in using the same email/phone and password." : "Our admin team could not approve the submitted profile. No PPlusOne account has been created, so these credentials cannot be used to log in.",
      status: approved ? "Approved · Account created" : "Rejected · Account not created",
      statusColor: approved ? "#198754" : "#dc3545", reason,
      ctaLabel: approved ? "Log in to PPlusOne" : "Review and update application",
      ctaUrl: approved ? `${base}/login` : `${base}/application-review`, approved,
    }),
    text: approved ? `Hi ${application.fullName}, your PPlusOne application was approved. Reason: ${reason || "Verification completed successfully"}. You can now log in.` : `Hi ${application.fullName}, your PPlusOne application was rejected. Reason: ${reason}. No account was created.`,
    tag: approved ? "application_approved" : "application_rejected",
  });
}

module.exports = { sendApplicationReceived, sendApplicationDecision, sendTransactionalEmail };
