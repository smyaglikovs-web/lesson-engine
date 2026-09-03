// Pure Web Crypto API (HMAC-SHA256) JWT Engine for Cloudflare Workers

function stringToBase64Url(str) {
  try {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch(e) {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}

function base64UrlToString(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  try {
    return decodeURIComponent(escape(atob(base64)));
  } catch(e) {
    return atob(base64);
  }
}

async function getCryptoKey(secret) {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    enc.encode(secret || 'default-lesson-engine-secret-key-32ch'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

// Timing-safe string comparison to prevent timing attacks
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  let mismatch = a.length === b.length ? 0 : 1;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function signJWT(payload, secret, expiresInSeconds = 86400 * 7) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const encodedHeader = stringToBase64Url(JSON.stringify(header));
  const encodedPayload = stringToBase64Url(JSON.stringify(fullPayload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await getCryptoKey(secret);
  const enc = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(dataToSign));
  
  const signatureBytes = new Uint8Array(signatureBuffer);
  let binary = '';
  for (let i = 0; i < signatureBytes.byteLength; i++) {
    binary += String.fromCharCode(signatureBytes[i]);
  }
  const encodedSignature = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${dataToSign}.${encodedSignature}`;
}

export async function verifyJWT(token, secret) {
  if (!token || typeof token !== 'string') return { valid: false, error: 'Token missing' };
  const parts = token.split('.');
  if (parts.length !== 3) return { valid: false, error: 'Invalid token structure' };

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  try {
    const key = await getCryptoKey(secret);
    const enc = new TextEncoder();
    
    let base64 = encodedSignature.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const signatureBinary = atob(base64);
    const signatureBytes = new Uint8Array(signatureBinary.length);
    for (let i = 0; i < signatureBinary.length; i++) {
      signatureBytes[i] = signatureBinary.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      enc.encode(dataToSign)
    );

    if (!isValid) return { valid: false, error: 'Invalid signature' };

    const payload = JSON.parse(base64UrlToString(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Token expired' };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: err.message || 'Verification failed' };
  }
}

// Server-Only Password Verification & JWT Token Issuance
export async function authenticateTeacher(env, passwordInput) {
  const cleanInput = (passwordInput || '').trim();
  const expectedPass = (env.TEACHER_PASSWORD || 'teacher123').trim();

  // Timing-safe password check
  if (timingSafeEqual(cleanInput, expectedPass)) {
    const secret = env.JWT_SECRET || env.TEACHER_PASSWORD || 'lesson-engine-super-secret-key';
    const token = await signJWT({ role: 'teacher', authenticated: true }, secret);
    return { success: true, token };
  }

  return { success: false, error: 'Invalid credentials' };
}

// Middleware Helper: Strictly checks Authorization Bearer Header
export async function isRequestAuthorized(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;

  if (!token) return false;

  const secret = env.JWT_SECRET || env.TEACHER_PASSWORD || 'lesson-engine-super-secret-key';
  const result = await verifyJWT(token, secret);
  
  return result.valid && result.payload?.role === 'teacher';
}

// Edge Sliding-Window Rate Limiter
const rateLimitMap = new Map();

export function checkRateLimit(ipAddress, limit = 25, windowMs = 60000) {
  const now = Date.now();
  const clientKey = ipAddress || 'anonymous_client';
  const record = rateLimitMap.get(clientKey) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count++;
  }

  rateLimitMap.set(clientKey, record);

  if (rateLimitMap.size > 500) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (now > v.resetTime) rateLimitMap.delete(k);
    }
  }

  return {
    allowed: record.count <= limit,
    remaining: Math.max(0, limit - record.count),
    resetInSeconds: Math.ceil((record.resetTime - now) / 1000)
  };
}
