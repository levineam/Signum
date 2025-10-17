'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface LogoProps {
  className?: string
  size?: number
}

export function Logo({ className = '', size = 40 }: LogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Default to light theme during SSR/initial render
  const logoSrc = mounted && resolvedTheme === 'dark'
    ? '/logos/signum-logo-white.svg'
    : '/logos/signum-logo.svg'

  return (
    <Link
      href="/"
      className={`inline-flex items-center justify-center transition-opacity hover:opacity-80 ${className}`}
      aria-label="Signum Home"
    >
      <Image
        src={logoSrc}
        alt="Signum"
        width={size}
        height={size * 1.4} // S logo is taller than it is wide (280/200 ratio)
        priority
        className="object-contain"
      />
    </Link>
  )
}
