import { z } from 'zod';
import { redis } from '../../lib/redis.js';
import { config } from '../../config.js';
import { incCounter } from '../../health/collector.js';
import { messagesService } from '../messages/index.js';

// =============================================================================
// Types
// =============================================================================

export const RequestOtpSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export const VerifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export type RequestOtpInput = z.infer<typeof RequestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;

interface OtpData {
  code: string;
  attempts: number;
  createdAt: number;
}

// =============================================================================
// Keys
// =============================================================================

const OTP_KEY_PREFIX = 'otp:';
const RATE_LIMIT_KEY_PREFIX = 'otp:rate:';

function otpKey(email: string): string {
  return `${OTP_KEY_PREFIX}${email.toLowerCase()}`;
}

function rateLimitKey(email: string): string {
  return `${RATE_LIMIT_KEY_PREFIX}${email.toLowerCase()}`;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Gera código OTP numérico
 */
function generateOtpCode(length: number = 6): string {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return code;
}

// =============================================================================
// OTP Service
// =============================================================================

export const otpService = {
  /**
   * Solicita envio de OTP para email
   */
  async request(input: RequestOtpInput): Promise<{
    success: boolean;
    error?: string;
    retryAfter?: number;
  }> {
    const email = input.email.toLowerCase();

    // Verifica rate limit
    const rateLimitData = await redis.get(rateLimitKey(email));
    if (rateLimitData) {
      const ttl = await redis.ttl(rateLimitKey(email));
      incCounter('otp.rate_limited');
      return {
        success: false,
        error: 'Rate limit exceeded. Please wait before requesting a new code.',
        retryAfter: ttl > 0 ? ttl : config.OTP_RATE_LIMIT_SECONDS,
      };
    }

    // Gera novo código
    const code = generateOtpCode(config.OTP_LENGTH);
    const otpData: OtpData = {
      code,
      attempts: 0,
      createdAt: Date.now(),
    };

    // Salva no Redis com TTL
    const ttlSeconds = config.OTP_TTL_MINUTES * 60;
    await redis.setex(otpKey(email), ttlSeconds, JSON.stringify(otpData));

    // Define rate limit
    await redis.setex(rateLimitKey(email), config.OTP_RATE_LIMIT_SECONDS, '1');

    // Envia email
    const result = await messagesService.sendOtp(
      email,
      input.name || email.split('@')[0],
      code
    );

    if (!result.success) {
      incCounter('otp.send_failed');
      return {
        success: false,
        error: result.error || 'Failed to send OTP email',
      };
    }

    incCounter('otp.sent');
    return { success: true };
  },

  /**
   * Verifica código OTP
   */
  async verify(input: VerifyOtpInput): Promise<{
    valid: boolean;
    error?: string;
    attemptsRemaining?: number;
  }> {
    const email = input.email.toLowerCase();
    const key = otpKey(email);

    // Busca OTP
    const data = await redis.get(key);
    if (!data) {
      incCounter('otp.verify_not_found');
      return {
        valid: false,
        error: 'No active OTP for this email. Please request a new code.',
      };
    }

    const otpData: OtpData = JSON.parse(data);

    // Verifica tentativas
    if (otpData.attempts >= config.OTP_MAX_ATTEMPTS) {
      await redis.del(key);
      incCounter('otp.verify_max_attempts');
      return {
        valid: false,
        error: 'Maximum attempts exceeded. Please request a new code.',
      };
    }

    // Verifica código
    if (otpData.code !== input.code) {
      otpData.attempts++;
      const attemptsRemaining = config.OTP_MAX_ATTEMPTS - otpData.attempts;

      // Atualiza tentativas
      const ttl = await redis.ttl(key);
      if (ttl > 0) {
        await redis.setex(key, ttl, JSON.stringify(otpData));
      }

      incCounter('otp.verify_invalid');
      return {
        valid: false,
        error: 'Invalid code',
        attemptsRemaining,
      };
    }

    // Código válido - remove do Redis
    await redis.del(key);
    incCounter('otp.verified');

    return { valid: true };
  },

  /**
   * Invalida OTP existente (ex: após login bem-sucedido)
   */
  async invalidate(email: string): Promise<void> {
    await redis.del(otpKey(email.toLowerCase()));
  },

  /**
   * Verifica se existe OTP ativo para email
   */
  async hasActiveOtp(email: string): Promise<boolean> {
    const exists = await redis.exists(otpKey(email.toLowerCase()));
    return exists === 1;
  },
};
