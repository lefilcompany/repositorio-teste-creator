import { NextResponse } from 'next/server';

// Interface para o payload do JWT
interface JWTPayload {
  userId: string;
  email: string;
  teamId: string | null;
  role: string;
  status: string;
  iat?: number;
  exp?: number;
}

// Obter chave secreta do JWT
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is required in environment variables');
  }
  return secret;
}

// Função para converter string para ArrayBuffer
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
}

// Função para converter ArrayBuffer para string
function arrayBufferToString(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}

// Função para converter para Base64URL
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Função para converter de Base64URL
function base64UrlToArrayBuffer(base64Url: string): ArrayBuffer {
  try {
    // Pad the string to make it a valid base64
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if necessary
    const padLength = (4 - (base64.length % 4)) % 4;
    base64 += '='.repeat(padLength);
    
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (error) {
    throw new Error('Invalid base64URL encoding');
  }
}

// Criar chave HMAC
async function createHMACKey(secret: string): Promise<CryptoKey> {
  const keyBuffer = stringToArrayBuffer(secret);
  return await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

// Criar JWT Token usando Web Crypto API
export async function createJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>, rememberMe: boolean = false): Promise<string> {
  try {
    // Validar payload obrigatórios
    if (!payload.userId || !payload.email) {
      throw new Error('userId and email are required in JWT payload');
    }

    const now = Math.floor(Date.now() / 1000);
    // Se rememberMe for true: 4 horas, senão: 2 horas
    const expirationTime = rememberMe ? (4 * 60 * 60) : (2 * 60 * 60);
    
    const fullPayload: JWTPayload = {
      ...payload,
      iat: now,
      exp: now + expirationTime
    };

    // Header JWT
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    // Converter para Base64URL
    const headerB64 = arrayBufferToBase64Url(stringToArrayBuffer(JSON.stringify(header)));
    const payloadB64 = arrayBufferToBase64Url(stringToArrayBuffer(JSON.stringify(fullPayload)));

    // Dados para assinar
    const dataToSign = `${headerB64}.${payloadB64}`;

    // Criar chave HMAC
    const secret = getJWTSecret();
    const key = await createHMACKey(secret);

    // Assinar
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      stringToArrayBuffer(dataToSign)
    );

    // Converter assinatura para Base64URL
    const signatureB64 = arrayBufferToBase64Url(signatureBuffer);

    const token = `${dataToSign}.${signatureB64}`;
    
    return token;
  } catch (error) {
    throw new Error('Failed to create JWT token');
  }
}

// Verificar JWT Token usando Web Crypto API
export async function verifyJWT(token: string): Promise<JWTPayload> {
  try {
    // Verificar se o token foi fornecido
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid JWT format');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // Verificar se as partes não estão vazias
    if (!headerB64 || !payloadB64 || !signatureB64) {
      throw new Error('Invalid JWT format');
    }

    // Verificar assinatura
    const dataToVerify = `${headerB64}.${payloadB64}`;
    const secret = getJWTSecret();
    const key = await createHMACKey(secret);

    const signatureBuffer = base64UrlToArrayBuffer(signatureB64);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBuffer,
      stringToArrayBuffer(dataToVerify)
    );

    if (!isValid) {
      throw new Error('Invalid JWT signature');
    }

    // Decodificar payload
    const payloadBuffer = base64UrlToArrayBuffer(payloadB64);
    const payloadString = arrayBufferToString(payloadBuffer);
    const payload: JWTPayload = JSON.parse(payloadString);

    // Verificar expiração
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('JWT token expired');
    }

    return payload;
  } catch (error) {
    if (error instanceof Error) {
      throw error; // Re-throw the original error with its specific message
    }
    throw new Error('Invalid JWT token');
  }
}

// Verificar se o token está expirado (versão simplificada)
export function isTokenExpired(token: string): boolean {
  try {
    if (!token || typeof token !== 'string') {
      return true;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return true;
    }

    const payloadB64 = parts[1];
    const payloadBuffer = base64UrlToArrayBuffer(payloadB64);
    const payloadString = arrayBufferToString(payloadBuffer);
    const payload: JWTPayload = JSON.parse(payloadString);

    const now = Math.floor(Date.now() / 1000);
    
    if (!payload.exp) {
      return true;
    }

    return payload.exp < now;
  } catch (error) {
    return true;
  }
}

// Verificar se o token deve ser renovado (se expira em menos de 10 minutos)
export function shouldRenewToken(token: string): boolean {
  try {
    if (!token || typeof token !== 'string') return false;

    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const payloadB64 = parts[1];
    const payloadBuffer = base64UrlToArrayBuffer(payloadB64);
    const payloadString = arrayBufferToString(payloadBuffer);
    const payload: JWTPayload = JSON.parse(payloadString);

    const now = Math.floor(Date.now() / 1000);
    
    if (!payload.exp) return false;

    // Renovar se expira em menos de 10 minutos (600 segundos)
    const renewThreshold = 10 * 60; // 10 minutos
    const expiresIn = payload.exp - now;
    
    return expiresIn < renewThreshold && expiresIn > 0;
  } catch (error) {
    return false;
  }
}

// Extrair payload do token sem verificar assinatura (para informações básicas)
export function getTokenPayload(token: string): JWTPayload | null {
  try {
    if (!token || typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payloadB64 = parts[1];
    const payloadBuffer = base64UrlToArrayBuffer(payloadB64);
    const payloadString = arrayBufferToString(payloadBuffer);
    
    return JSON.parse(payloadString) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Middleware para verificar autenticação
export async function verifyAuth(request: Request): Promise<{ user: JWTPayload } | NextResponse> {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }
    
    if (!authHeader.toLowerCase().startsWith('bearer ')) {
      return NextResponse.json({ error: 'Invalid authorization header format' }, { status: 401 });
    }

    const token = authHeader.substring(7).trim(); // Remove 'Bearer ' prefix and trim
    
    if (!token) {
      return NextResponse.json({ error: 'Empty token' }, { status: 401 });
    }

    const payload = await verifyJWT(token);

    return { user: payload };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return NextResponse.json({ error: 'Token expired' }, { status: 401 });
      }
      if (error.message.includes('Invalid JWT format')) {
        return NextResponse.json({ error: 'Invalid token format' }, { status: 401 });
      }
      if (error.message.includes('Invalid JWT signature')) {
        return NextResponse.json({ error: 'Invalid token signature' }, { status: 401 });
      }
    }
    
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}

