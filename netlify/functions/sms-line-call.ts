import { Handler } from '@netlify/functions';
import twilio from 'twilio';

/**
 * Twilio Voice webhook for (475) 341-3699 — the number that only does SMS.
 *
 * The site shows that number under "Text us", and some people will press call
 * instead. Without a webhook Twilio plays its own demo greeting, which sounds
 * like a wrong number. This tells them, in one breath, to text this number or
 * call the office line, and hangs up.
 *
 * No signature check: the reply is fixed text and costs nothing to serve, so a
 * forged request gets a sentence and spends no money.
 */

const MESSAGE =
  "Hi, you've reached Dany Clean Pro's text line. This number takes text messages only. "
  + "Send us a text here and we'll answer right away, or call our office at "
  + '2 1 8, 3 5 7, 5 9 3 8. Thank you!';

export const handler: Handler = async () => {
  const response = new twilio.twiml.VoiceResponse();
  response.say({ voice: 'Polly.Joanna-Neural' as any, language: 'en-US' }, MESSAGE);
  response.hangup();
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/xml' },
    body: response.toString(),
  };
};
