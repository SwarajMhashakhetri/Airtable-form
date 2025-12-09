import express, { Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import { AirtableService } from '../services/airtableService';

const router = express.Router();

const pkceStorage = new Map<string, { codeVerifier: string; timestamp: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [state, data] of pkceStorage.entries()) {
    if (now - data.timestamp > 600000) {
      pkceStorage.delete(state);
    }
  }
}, 600000);

function generateCodeVerifier(): string {
  return crypto.randomBytes(96).toString('base64url');
}

function generateCodeChallenge(verifier: string): string {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

router.get('/airtable/url', (req: Request, res: Response) => {
  try {
    const clientId = process.env.AIRTABLE_CLIENT_ID;
    const redirectUri = process.env.AIRTABLE_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      res.status(500).json({ error: 'OAuth not configured' });
      return;
    }

    const state = crypto.randomBytes(32).toString('base64url');
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    pkceStorage.set(state, {
      codeVerifier,
      timestamp: Date.now(),
    });

    const scope = 'data.records:read data.records:write schema.bases:read webhook:manage user.email:read';

    const authUrl = new URL('https://airtable.com/oauth2/v1/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    res.json({ url: authUrl.toString(), state });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate OAuth URL' });
  }
});

router.post('/airtable/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.body;

    if (!code || !state) {
      res.status(400).json({ error: 'Authorization code and state are required' });
      return;
    }

    const pkceData = pkceStorage.get(state);
    if (!pkceData) {
      res.status(400).json({ error: 'Invalid state or expired session' });
      return;
    }

    const { codeVerifier } = pkceData;
    pkceStorage.delete(state);

    const tokenUrl = 'https://airtable.com/oauth2/v1/token';
    const clientId = process.env.AIRTABLE_CLIENT_ID!;
    const clientSecret = process.env.AIRTABLE_CLIENT_SECRET!;
    const redirectUri = process.env.AIRTABLE_REDIRECT_URI!;

    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      code: code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    const tokenResponse = await axios.post(tokenUrl, tokenParams.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
    });

    const { access_token, refresh_token } = tokenResponse.data;
    const airtableService = new AirtableService(access_token);
    const userInfo = await airtableService.getUserInfo();

    let user = await User.findOne({ airtableUserId: userInfo.id });

    if (user) {
      user.accessToken = access_token;
      user.refreshToken = refresh_token || user.refreshToken;
      user.lastLogin = new Date();
      await user.save();
    } else {
      user = new User({
        airtableUserId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        accessToken: access_token,
        refreshToken: refresh_token,
        lastLogin: new Date(),
      });
      await user.save();
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      {
        userId: user._id,
        airtableUserId: user.airtableUserId,
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Authentication failed',
      details: error.response?.data || error.message
    });
  }
});

router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };

    const user = await User.findById(decoded.userId).select('-accessToken -refreshToken');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
