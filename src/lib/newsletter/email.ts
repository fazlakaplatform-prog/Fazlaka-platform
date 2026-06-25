import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });
  }
  return transporter;
}

function baseTemplate(content: string, isRTL = true): string {
  const dir = isRTL ? 'rtl' : 'ltr';
  const align = isRTL ? 'right' : 'left';
  return `<!DOCTYPE html>
<html dir="${dir}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:'Segoe UI',Tahoma,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 10px">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
<tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;text-align:center">
<img src="https://fazlaka.com/logo.png" alt="فذلكة" style="width:60px;height:60px;border-radius:50%;margin-bottom:12px">
<h1 style="color:#fff;margin:0;font-size:24px;font-weight:700">فذلكة</h1>
<p style="color:rgba(255,255,255,.8);margin:4px 0 0;font-size:14px">${isRTL ? 'منصة تعليمية حديثة' : 'Modern Educational Platform'}</p>
</td></tr>
<tr><td style="padding:32px 24px;text-align:${align}">
${content}
</td></tr>
<tr><td style="background:#f8f8fc;padding:20px 24px;text-align:center;font-size:12px;color:#888">
<p style="margin:0 0 8px">© ${new Date().getFullYear()} فذلكة. ${isRTL ? 'جميع الحقوق محفوظة' : 'All rights reserved'}</p>
<p style="margin:0;font-size:11px;color:#aaa">
${isRTL ? 'إذا لم تكن ترغب في استلام هذه الرسائل، يمكنك' : 'If you no longer wish to receive these emails, you can'}
<a href="{{UNSUBSCRIBE_URL}}" style="color:#6366f1;text-decoration:underline">${isRTL ? 'إلغاء الاشتراك' : 'unsubscribe here'}</a>
</p>
</td></tr></table></td></tr></table></body></html>`;
}

export function welcomeEmail(name: string | null, preferencesUrl: string, isRTL = true): string {
  const content = isRTL
    ? `<h2 style="color:#1a1a2e;margin:0 0 16px;font-size:22px">مرحباً بك في نشرتنا البريدية!</h2>
<p style="color:#555;line-height:1.8;margin:0 0 12px;font-size:15px">
${name ? `أهلاً ${name}،` : 'أهلاً بك،'}
</p>
<p style="color:#555;line-height:1.8;margin:0 0 12px;font-size:15px">
شكراً لاشتراكك في النشرة البريدية لفذلكة. سنرسل لك أحدث المقالات، الحلقات، والموارد التعليمية مباشرة إلى بريدك الإلكتروني.
</p>
<p style="color:#555;line-height:1.8;margin:0 0 20px;font-size:15px">
يمكنك تخصيص تفضيلاتك في أي وقت من خلال الرابط أدناه.
</p>
<a href="${preferencesUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:15px;font-weight:600">تخصيص التفضيلات</a>`
    : `<h2 style="color:#1a1a2e;margin:0 0 16px;font-size:22px">Welcome to our Newsletter!</h2>
<p style="color:#555;line-height:1.8;margin:0 0 12px;font-size:15px">
${name ? `Hi ${name},` : 'Welcome,'}
</p>
<p style="color:#555;line-height:1.8;margin:0 0 12px;font-size:15px">
Thank you for subscribing to the Fazlaka newsletter. We'll send you the latest articles, episodes, and educational resources directly to your inbox.
</p>
<p style="color:#555;line-height:1.8;margin:0 0 20px;font-size:15px">
You can customize your preferences at any time through the link below.
</p>
<a href="${preferencesUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:15px;font-weight:600">Customize Preferences</a>`;
  return baseTemplate(content, isRTL).replace('{{UNSUBSCRIBE_URL}}', preferencesUrl.replace('/preferences', '/unsubscribe'));
}

export function campaignHtml(subject: string, htmlContent: string, unsubUrl: string, isRTL = true): string {
  return baseTemplate(htmlContent, isRTL).replace('{{UNSUBSCRIBE_URL}}', unsubUrl);
}

export async function sendEmail(to: string, subject: string, html: string) {
  const transport = getTransporter();
  await transport.sendMail({
    from: `"فذلكة" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  });
}

export async function sendBulkEmails(recipients: { email: string; html: string }[], subject: string) {
  const transport = getTransporter();
  const results: { email: string; success: boolean; error?: string }[] = [];
  for (const r of recipients) {
    try {
      await transport.sendMail({ from: `"فذلكة" <${process.env.EMAIL_FROM}>`, to: r.email, subject, html: r.html });
      results.push({ email: r.email, success: true });
    } catch {
      results.push({ email: r.email, success: false, error: 'Failed' });
    }
  }
  return results;
}
