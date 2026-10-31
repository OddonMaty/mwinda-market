import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://mwinda.market'
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/produits`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/boutiques`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/devenir-vendeur`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/assistance`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/conditions`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/confidentialite`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]
}
