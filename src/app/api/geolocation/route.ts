import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwarded?.split(',')[0] || realIp || request.ip;

    const isLocalhost = !clientIp ||
      clientIp === '127.0.0.1' ||
      clientIp === '::1' ||
      clientIp === '::ffff:127.0.0.1' ||
      clientIp?.startsWith('192.168.') ||
      clientIp?.startsWith('10.') ||
      clientIp?.startsWith('172.') ||
      clientIp?.startsWith('::ffff:192.168.') ||
      clientIp?.startsWith('::ffff:10.') ||
      clientIp?.startsWith('::ffff:172.');

    if (isLocalhost) {
      return NextResponse.json({
        latitude: 48.8566,
        longitude: 2.3522,
        fallback: true,
        reason: 'localhost_or_private_ip'
      });
    }
console.log('ip', clientIp)
    const response = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,lat,lon,country,city`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Confessio/1.0)'
      }
    });

    if (!response.ok) {
      throw new Error('IP geolocation service unavailable');
    }

    const data = await response.json();
console.log('raw data', data)
    if (data.status === 'success' && data.lat && data.lon) {
      console.log('data', data)
      return NextResponse.json({
        latitude: data.lat,
        longitude: data.lon,
        country: data.country,
        city: data.city,
        fallback: false
      });
    }

    throw new Error('Invalid response from geolocation service');

  } catch (error) {
    console.error('Geolocation error:', error);

    return NextResponse.json({
      latitude: 48.8566,
      longitude: 2.3522,
      fallback: true,
      reason: 'api_error'
    });
  }
}
