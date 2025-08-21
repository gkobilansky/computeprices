import { NextRequest, NextResponse } from 'next/server'
import { parseProviderSlugs, generateCanonicalComparisonURL } from '@/lib/providers'

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const startTime = Date.now()
  
  // Only handle /compare routes
  if (!pathname.startsWith('/compare/')) {
    return NextResponse.next()
  }

  // Extract provider segments from path
  const segments = pathname.replace('/compare/', '').split('/')
  
  // Skip if no segments or empty
  if (!segments.length || segments[0] === '') {
    console.debug('[Middleware] Empty segments, skipping:', { pathname })
    return NextResponse.next()
  }

  try {
    // Parse provider slugs from URL
    const parsed = parseProviderSlugs(segments)
    
    // If parsing failed, let the page handle the error
    if (!parsed.isValid) {
      console.debug('[Middleware] Invalid parse, letting page handle:', { 
        pathname, 
        segments,
        error: parsed.error 
      })
      return NextResponse.next()
    }

    // Generate canonical URL (alphabetically sorted)
    const canonicalPath = generateCanonicalComparisonURL(
      parsed.provider1, 
      parsed.provider2
    )
    
    // Check if current path matches canonical path
    const currentPath = `/compare/${segments.join('/')}`
    
    // If paths don't match, redirect to canonical URL
    if (canonicalPath !== currentPath) {
      const redirectUrl = new URL(canonicalPath, request.url)
      
      // Preserve query parameters
      if (search) {
        redirectUrl.search = search
      }
      
      const duration = Date.now() - startTime
      console.info('[Middleware] Canonical redirect:', {
        from: currentPath,
        to: canonicalPath,
        queryParams: search || 'none',
        provider1: parsed.provider1,
        provider2: parsed.provider2,
        duration: `${duration}ms`
      })
      
      // Return permanent redirect for SEO
      return NextResponse.redirect(redirectUrl, 301)
    }

    const duration = Date.now() - startTime
    console.debug('[Middleware] Path already canonical, continuing:', {
      pathname: canonicalPath,
      duration: `${duration}ms`
    })

    return NextResponse.next()
    
  } catch (error) {
    const duration = Date.now() - startTime
    // Log error but don't break the request
    console.error('[Middleware] Error processing comparison redirect:', {
      pathname,
      segments,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`
    })
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt, sitemap.xml (SEO files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}