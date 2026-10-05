import crypto from 'crypto';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export function validateTelegramInitData(
  initDataString: string,
  botToken: string
): { valid: boolean; user: TelegramUser | null; error?: string } {
  if (!botToken) {
    return { valid: false, user: null, error: 'BOT_TOKEN is not configured on server' };
  }

  if (!initDataString) {
    return { valid: false, user: null, error: 'Missing initData' };
  }

  try {
    const params = new URLSearchParams(initDataString);
    const hash = params.get('hash');
    
    if (!hash) {
      return { valid: false, user: null, error: 'Missing hash in initData' };
    }

    // Remove hash and sort items alphabetically
    params.delete('hash');
    const items: string[] = [];
    params.forEach((value, key) => {
      items.push(`${key}=${value}`);
    });
    items.sort();
    const dataCheckString = items.join('\n');

    // HMAC_SHA256("WebAppData", botToken)
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // HMAC_SHA256(secretKey, dataCheckString)
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      return { valid: false, user: null, error: 'Invalid HMAC signature' };
    }

    const userRaw = params.get('user');
    if (!userRaw) {
      return { valid: false, user: null, error: 'No user object in initData' };
    }

    const user = JSON.parse(userRaw) as TelegramUser;
    return { valid: true, user };
  } catch (err: any) {
    return { valid: false, user: null, error: err?.message || 'Failed to parse initData' };
  }
}
