const nextConfig = (() => {
  const remotePatterns = [
    { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    { protocol: 'https', hostname: '**.supabase.co', pathname: '/**' },
  ]

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (typeof supabaseUrl === 'string' && supabaseUrl.length > 0) {
    try {
      const hostname = new URL(supabaseUrl).hostname
      if (hostname) remotePatterns.unshift({ protocol: 'https', hostname, pathname: '/**' })
    } catch {}
  }

  return {
    images: {
      remotePatterns,
    },
  }
})()

module.exports = nextConfig
