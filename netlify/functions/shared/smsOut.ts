/**
 * Um SMS para o cliente, enviado pelo número do site.
 *
 * Existe por causa do que acontece depois de desligar: a pessoa prometeu
 * esperar meia hora por um retorno e fica sem nada escrito — nem o nome da
 * empresa, nem um número onde responder. Uma linha de texto fecha essa lacuna,
 * e dá-lhe um fio de conversa que ela própria pode puxar.
 */
import twilio from 'twilio';

export async function sendSms(to: string, body: string): Promise<{ sent: boolean; error?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) return { sent: false, error: 'twilio not configured' };

  const digits = String(to || '').replace(/\D/g, '');
  if (digits.length < 10) return { sent: false, error: 'no usable number' };
  // A Twilio quer E.164; um número dos EUA chega aqui com 10 ou 11 dígitos.
  const e164 = digits.length === 10 ? `+1${digits}` : `+${digits}`;

  try {
    const message = await twilio(sid, token).messages.create({ to: e164, from, body: body.slice(0, 480) });
    console.log('[smsOut] sent', message.sid, 'to', e164);
    return { sent: true };
  } catch (err: any) {
    console.error('[smsOut] failed:', err?.message || err);
    return { sent: false, error: err?.message || 'send failed' };
  }
}

/** O texto que segue uma chamada atendida pela assistente. */
export function afterCallText(name?: string | null): string {
  const greeting = name && String(name).trim() ? `Hi ${String(name).trim().split(/\s+/)[0]}, ` : 'Hi, ';
  return `${greeting}thanks for calling Dany Clean Pro. Dany will get back to you within 30 minutes `
    + `to confirm the day and the price. You can reply to this message any time.`;
}
