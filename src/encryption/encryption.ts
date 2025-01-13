import * as crypto from 'crypto';

export function encrypt(text: string): string {
  try {
    const key = Buffer.from(process.env.ENCRYPTION_KEY).slice(0, 32);
    const ivLength = Number(process.env.IV_LENGTH)
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const encryptedText = `${iv.toString('hex')}:${encrypted}`;
    decrypt(encryptedText);
    return encryptedText;
  } catch (error) {
    console.log(error);
  }
}

export function decrypt(text: string): string {
  try {
    const key = Buffer.from(process.env.ENCRYPTION_KEY).slice(0, 32);
    const [iv, encrypted] = text.split(':');
    if (!iv || !encrypted) {
      throw new Error('Invalid encrypted data format');
    }

    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      key,
      Buffer.from(iv, 'hex'),
    );

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.log(error);
  }
}
