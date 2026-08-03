const { sendTransactionalEmail } = require("../utils/email");
const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL || "webdesino.com@gmail.com";

function clean(value) {
  return String(value || "").trim();
}

function escapeHtml(value) {
  return clean(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildContactEmail({ name, email, phone, service, message }) {
  const rows = [
    ["Name", name],
    ["Email", email],
    ["Phone", phone],
    ["Service", service],
    ["Submitted", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })],
  ];

  return `
    <div style="margin:0;background:#fffaf3;padding:32px;font-family:Inter,Arial,sans-serif;color:#17120f">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #ead7c7;border-radius:22px;overflow:hidden;box-shadow:0 22px 70px rgba(80,45,30,.10)">
        <div style="background:#17120f;color:#fffaf3;padding:28px 30px">
          <div style="font-size:13px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#f5cac3">PPlusOne Contact</div>
          <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2">New message from ${escapeHtml(name)}</h1>
          <p style="margin:8px 0 0;color:rgba(255,250,243,.72);font-size:14px">A visitor submitted the contact form on PPlusOne.</p>
        </div>

        <div style="padding:26px 30px">
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            ${rows
              .map(
                ([label, value]) => `
                  <tr>
                    <td style="width:135px;padding:12px 0;border-bottom:1px solid #f0dfcf;color:#75665b;font-size:13px;font-weight:800">${label}</td>
                    <td style="padding:12px 0;border-bottom:1px solid #f0dfcf;color:#17120f;font-size:14px;font-weight:700">${escapeHtml(value)}</td>
                  </tr>
                `
              )
              .join("")}
          </table>

          <div style="background:#fff7ef;border:1px solid #ead7c7;border-radius:18px;padding:20px">
            <div style="font-size:13px;font-weight:900;color:#75665b;text-transform:uppercase;letter-spacing:.12em">Message</div>
            <p style="white-space:pre-wrap;margin:12px 0 0;font-size:15px;line-height:1.7;color:#17120f;font-weight:650">${escapeHtml(message)}</p>
          </div>

          <div style="margin-top:22px;font-size:12px;line-height:1.6;color:#75665b">
            Reply directly to this email or contact the user at ${escapeHtml(email)}.
          </div>
        </div>
      </div>
    </div>
  `;
}

const sendContactMessage = async (req, res) => {
  try {
    const payload = {
      name: clean(req.body?.name),
      email: clean(req.body?.email).toLowerCase(),
      phone: clean(req.body?.phone),
      service: clean(req.body?.service),
      message: clean(req.body?.message),
    };

    if (!payload.name || !payload.email || !payload.phone || !payload.service || !payload.message) {
      return res.status(400).json({
        success: false,
        message: "Please complete all contact form fields.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    const result = await sendTransactionalEmail({
      to: CONTACT_TO_EMAIL,
      replyTo: payload.email,
      subject: `PPlusOne contact · ${payload.service} · ${payload.name}`,
      html: buildContactEmail(payload),
      text: `New PPlusOne contact\nName: ${payload.name}\nEmail: ${payload.email}\nPhone: ${payload.phone}\nService: ${payload.service}\n\n${payload.message}`,
      tag: "contact_form",
    });

    return res.json({
      success: true,
      message: "Your message has been sent to PPlusOne support.",
      id: result?.id,
    });
  } catch (error) {
    console.error("sendContactMessage error", error);
    return res.status(500).json({
      success: false,
      message: "Unable to send your message right now.",
    });
  }
};

module.exports = {
  sendContactMessage,
};
