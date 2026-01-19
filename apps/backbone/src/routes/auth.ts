import type { FastifyPluginAsync } from 'fastify';
import {
  otpService,
  RequestOtpSchema,
  VerifyOtpSchema,
} from '../services/auth/index.js';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // ==========================================================================
  // OTP Endpoints
  // ==========================================================================

  /**
   * POST /auth/otp/request
   * Solicita envio de OTP para email
   */
  fastify.post<{ Body: unknown }>('/otp/request', async (request, reply) => {
    const result = RequestOtpSchema.safeParse(request.body);

    if (!result.success) {
      return reply.badRequest(result.error.message);
    }

    const response = await otpService.request(result.data);

    if (!response.success) {
      const statusCode = response.retryAfter ? 429 : 400;
      return reply.status(statusCode).send({
        error: response.error,
        retryAfter: response.retryAfter,
      });
    }

    return reply.send({
      data: {
        success: true,
        message: 'OTP sent successfully',
      },
    });
  });

  /**
   * POST /auth/otp/verify
   * Verifica código OTP
   */
  fastify.post<{ Body: unknown }>('/otp/verify', async (request, reply) => {
    const result = VerifyOtpSchema.safeParse(request.body);

    if (!result.success) {
      return reply.badRequest(result.error.message);
    }

    const response = await otpService.verify(result.data);

    if (!response.valid) {
      return reply.status(401).send({
        error: response.error,
        attemptsRemaining: response.attemptsRemaining,
      });
    }

    // OTP válido - aqui você geraria o JWT ou sessão
    // Por enquanto, apenas retorna sucesso
    return reply.send({
      data: {
        valid: true,
        message: 'OTP verified successfully',
        // TODO: retornar token JWT aqui
      },
    });
  });
};
