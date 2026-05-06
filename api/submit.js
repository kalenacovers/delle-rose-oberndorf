// Vercel serverless function — handles reservation and catering form submissions
// Sends email via Resend API (https://resend.com — free tier: 3000/month)
// Required env vars in Vercel dashboard:
//   RESEND_API_KEY  — your Resend API key (re_...)
//   TO_EMAIL        — recipient address (default: info@delle-rose-oberndorf.de)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.TO_EMAIL || 'info@delle-rose-oberndorf.de';

  if (!apiKey) {
    console.error('RESEND_API_KEY is not set');
    return res.status(500).json({ error: 'Mail service not configured' });
  }

  const body = req.body;
  const formType = body._type || 'Anfrage';

  let subject, html;

  if (formType === 'reservation') {
    subject = `Tischreservierung: ${body.name || '—'} · ${body.date || '—'} ${body.time || ''}`;
    html = `
      <h2 style="font-family:sans-serif;color:#1a1614;">Neue Tischreservierung</h2>
      <table style="font-family:sans-serif;font-size:15px;border-collapse:collapse;width:100%;max-width:520px;">
        <tr><td style="padding:8px 12px;background:#f5f0e8;font-weight:600;width:140px;">Datum</td><td style="padding:8px 12px;">${esc(body.date)}</td></tr>
        <tr><td style="padding:8px 12px;background:#f5f0e8;font-weight:600;">Uhrzeit</td><td style="padding:8px 12px;">${esc(body.time)}</td></tr>
        <tr><td style="padding:8px 12px;background:#f5f0e8;font-weight:600;">Personen</td><td style="padding:8px 12px;">${esc(body.guests)}</td></tr>
        <tr><td style="padding:8px 12px;background:#f5f0e8;font-weight:600;">Anlass</td><td style="padding:8px 12px;">${esc(body.occasion) || '—'}</td></tr>
        <tr><td style="padding:8px 12px;background:#f5f0e8;font-weight:600;">Name</td><td style="padding:8px 12px;">${esc(body.name)}</td></tr>
        <tr><td style="padding:8px 12px;background:#f5f0e8;font-weight:600;">Telefon</td><td style="padding:8px 12px;">${esc(body.phone)}</td></tr>
        <tr><td style="padding:8px 12px;background:#f5f0e8;font-weight:600;">E-Mail</td><td style="padding:8px 12px;">${esc(body.email) || '—'}</td></tr>
        <tr><td style="padding:8px 12px;background:#f5f0e8;font-weight:600;">Hinweise</td><td style="padding:8px 12px;">${esc(body.note) || '—'}</td></tr>
      </table>
      <p style="font-family:sans-serif;font-size:13px;color:#888;margin-top:24px;">Gesendet über delle-rose-oberndorf.de/reservierung</p>
    `;
  } else if (formType === 'catering') {
    subject = `Catering-Anfrage: ${body.name || '—'} · ${body.guests || '—'} Personen`;
    html = `
      <h2 style="font-family:sans-serif;color:#1a1614;">Neue Catering-Anfrage</h2>
      <table style="font-family:sans-serif;font-size:15px;border-collapse:collapse;width:100%;max-width:520px;">
        <tr><td style="padding:8px 12px;background:#f5f0e8;font-weight:600;width:160px;">Name</td><td style="padding:8px 12px;">${esc(body.name)}</td></tr>
        <tr><td style="padding:8px 12px;background:#f5f0e8;font-weight:600;">Telefon</td><td style="padding:8px 12px;">${esc(body.phone)}</td></tr>
        <tr><td style="padding:8px 12px;background:#f5f0e8;font-weight:600;">E-Mail</td><td style="padding:8px 12px;">${esc(body.email) || '—'}</td></tr>
        <tr><td style="padding:8px 12px;background:#f5f0e8;font-weight:600;">Anlass</td><td style="padding:8px 12px;">${esc(body.occasion) || '—'}</td></tr>
        <tr><td style="padding:8px 12px;background:#f5f0e8;font-weight:600;">Ort</td><td style="padding:8px 12px;">${esc(body.type) || '—'}</td></tr>
        <tr><td style="padding:8px 12px;background:#f5f0e8;font-weight:600;">Wunschtermin</td><td style="padding:8px 12px;">${esc(body.date) || '—'}</td></tr>
        <tr><td style="padding:8px 12px;background:#f5f0e8;font-weight:600;">Gäste</td><td style="padding:8px 12px;">${esc(body.guests) || '—'}</td></tr>
        <tr><td style="padding:8px 12px;background:#f5f0e8;font-weight:600;">Nachricht</td><td style="padding:8px 12px;">${esc(body.note) || '—'}</td></tr>
      </table>
      <p style="font-family:sans-serif;font-size:13px;color:#888;margin-top:24px;">Gesendet über delle-rose-oberndorf.de/feiern</p>
    `;
  } else {
    return res.status(400).json({ error: 'Unknown form type' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Delle Rose Website <noreply@delle-rose-oberndorf.de>',
        to: [toEmail],
        reply_to: body.email || undefined,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Resend error:', err);
      return res.status(502).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Submit handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
