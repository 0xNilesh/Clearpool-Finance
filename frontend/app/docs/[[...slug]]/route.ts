import { existsSync } from 'fs'
import { join } from 'path'
import { readFile } from 'fs/promises'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

export async function GET(
  request: Request,
  context: { params: Promise<{ slug?: string[] }> }
) {
  const params = await context.params
  const url = new URL(request.url)
  const pathname = url.pathname
  
  console.log('🚀🚀🚀 [DOCS ROUTE] Handler CALLED! 🚀🚀🚀')
  console.log('URL:', request.url)
  console.log('Pathname:', pathname)
  console.log('Params:', params)
  
  try {
    const slug = params?.slug || []
    const path = slug.join('/')
    
    console.log('Processing path:', path)
    
    // For client-side routing, always serve index.html
    // Docusaurus will handle the routing
    const indexPath = join(process.cwd(), 'public', 'docs', 'index.html')
    
    console.log('Looking for index.html at:', indexPath)
    console.log('File exists:', existsSync(indexPath))
    
    // Check if it's an asset request (CSS, JS, images, etc.)
    if (path && path.includes('.') && !path.endsWith('.html')) {
      const assetPath = join(process.cwd(), 'public', 'docs', path)
      console.log('Checking asset:', assetPath, 'exists:', existsSync(assetPath))
      
      if (existsSync(assetPath)) {
        try {
          const content = await readFile(assetPath)
          const ext = path.split('.').pop()?.toLowerCase()
          const contentType = 
            ext === 'css' ? 'text/css' :
            ext === 'js' ? 'application/javascript' :
            ext === 'json' ? 'application/json' :
            ext === 'png' ? 'image/png' :
            ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
            ext === 'svg' ? 'image/svg+xml' :
            ext === 'ico' ? 'image/x-icon' :
            'application/octet-stream'
          
          console.log('✅ Serving asset:', path)
          return new NextResponse(content, {
            headers: { 'Content-Type': contentType },
          })
        } catch (err) {
          console.error('Error reading asset:', err)
          // Fall through to index.html
        }
      }
    }
    
    // Serve index.html for all routes (Docusaurus handles client-side routing)
    if (!existsSync(indexPath)) {
      console.error('❌ index.html not found at:', indexPath)
      return new NextResponse(
        'Documentation not found. Please run: npm run build:docs',
        { status: 404 }
      )
    }
    
    console.log('✅ Serving index.html')
    const content = await readFile(indexPath, 'utf-8')
    return new NextResponse(content, {
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (error) {
    console.error('❌ Error in docs route:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    return new NextResponse(`Error loading documentation: ${String(error)}`, { status: 500 })
  }
}
