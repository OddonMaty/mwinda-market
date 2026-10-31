import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/vendeur/dashboard', '/mon-compte/'],
    },
    sitemap: 'https://mwinda.market/sitemap.xml',
  }
}
