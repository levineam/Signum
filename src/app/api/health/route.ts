import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0-greenfield',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      platform: 'signum-greenfield'
    }

    return NextResponse.json(healthCheck)
  } catch {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}