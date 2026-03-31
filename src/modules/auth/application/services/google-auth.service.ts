import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { envConfig } from '@/config/env.config';

interface GoogleTokenInfoResponse {
  aud?: string;
  email?: string;
  email_verified?: string;
  error_description?: string;
  iss?: string;
  name?: string;
  picture?: string;
  sub?: string;
}

export interface GoogleIdentity {
  avatarUrl: string | null;
  email: string;
  googleId: string;
  name: string;
}

@Injectable()
export class GoogleAuthService {
  async verifyIdToken(idToken: string): Promise<GoogleIdentity> {
    if (!envConfig.auth.google.enabled || !envConfig.auth.google.clientId) {
      throw new ServiceUnavailableException('Google authentication is not configured');
    }

    let response: Response;

    try {
      const url = new URL('https://oauth2.googleapis.com/tokeninfo');
      url.searchParams.set('id_token', idToken);

      response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });
    } catch {
      throw new ServiceUnavailableException('Google token verification is unavailable');
    }

    const payload = (await response.json()) as GoogleTokenInfoResponse;

    if (!response.ok) {
      throw new UnauthorizedException(
        payload.error_description || 'Invalid Google token',
      );
    }

    if (payload.aud !== envConfig.auth.google.clientId) {
      throw new UnauthorizedException('Invalid Google token audience');
    }

    if (
      payload.iss !== 'accounts.google.com' &&
      payload.iss !== 'https://accounts.google.com'
    ) {
      throw new UnauthorizedException('Invalid Google token issuer');
    }

    if (payload.email_verified !== 'true') {
      throw new UnauthorizedException('Google account email is not verified');
    }

    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Google token is missing user information');
    }

    const normalizedEmail = payload.email.toLowerCase().trim();
    const fallbackName = normalizedEmail.split('@')[0] || 'Google User';

    return {
      googleId: payload.sub,
      email: normalizedEmail,
      name: payload.name?.trim() || fallbackName,
      avatarUrl: payload.picture?.trim() || null,
    };
  }
}
