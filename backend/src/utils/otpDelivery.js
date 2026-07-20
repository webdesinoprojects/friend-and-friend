const { sendTransactionalEmail } = require("./email");

async function sendMobileOtp(phone, otp) {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_OTP_TEMPLATE_ID;
  if (!authKey || !templateId) {
    if (process.env.NODE_ENV === "production") throw new Error("MSG91 is not configured.");
    console.info(`DEV_MOBILE_OTP: ${phone} -> ${otp}`);
    return { development: true };
  }
  const digits = String(phone).replace(/\D/g, "");
  const mobile = digits.length === 10 ? `91${digits}` : digits;
  const url = new URL("https://control.msg91.com/api/v5/otp");
  url.searchParams.set("template_id", templateId);
  url.searchParams.set("mobile", mobile);
  url.searchParams.set("authkey", authKey);
  const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ otp }) });
  if (!response.ok) throw new Error(`MSG91 OTP failed with status ${response.status}`);
  return response.json();
}

function sendEmailOtp(email, otp) {
  const subject = `${otp} is your BuddyBOOK verification code`;
  const htmlContent = `<!doctype html><html><body style="margin:0;background:#fffaf3;font-family:Arial,Helvetica,sans-serif;color:#10203e"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#fffaf3;background-image:linear-gradient(#f4e8dc 1px,transparent 1px),linear-gradient(90deg,#f4e8dc 1px,transparent 1px);background-size:42px 42px"><tr><td align="center" style="padding:38px 16px"><table role="presentation" width="100%" style="max-width:590px;background:#fff;border:1px solid #edd8c7;border-radius:28px;overflow:hidden;box-shadow:0 18px 55px rgba(52,35,23,.10)"><tr><td style="padding:30px 36px;background:linear-gradient(135deg,#fffdf9,#fff1e4)"><div style="font-size:25px;font-weight:900">Buddy<span style="color:#f5b800">BOOK</span></div><div style="margin-top:7px;color:#718096;font-size:12px;font-weight:700">Safe Meetups. Real Connections.</div></td></tr><tr><td style="padding:34px 36px"><div style="display:inline-block;border:1px solid #e8a46f;border-radius:999px;padding:8px 14px;color:#df7a31;font-size:12px;font-weight:900">Email verification</div><h1 style="font-size:32px;margin:23px 0 10px">Verify your email address</h1><p style="font-size:15px;line-height:1.7;color:#526078">Enter this code in BuddyBOOK to continue your secure registration.</p><div style="margin:27px 0;padding:22px;text-align:center;border:1px solid #efc5a4;border-radius:20px;background:#fff8f1;font-size:38px;font-weight:900;letter-spacing:12px;color:#10203e">${otp}</div><p style="font-size:13px;line-height:1.65;color:#718096">This code expires in 10 minutes. Never share your OTP or password with anyone, including BuddyBOOK support.</p></td></tr></table></td></tr></table></body></html>`;
  const textContent = `Your BuddyBOOK email verification code is ${otp}. It expires in 10 minutes. Do not share it.`;

  return sendTransactionalEmail({
    to: email,
    subject,
    html: htmlContent,
    text: textContent,
    tag: "email_otp",
  });
}

module.exports = { sendMobileOtp, sendEmailOtp };
