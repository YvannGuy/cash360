import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.cash360.finance'
  const currentDate = new Date()

  return [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: {
        languages: {
          fr: `${baseUrl}`,
          en: `${baseUrl}`,
          es: `${baseUrl}`,
          pt: `${baseUrl}`,
        },
      },
    },
    {
      url: `${baseUrl}/analyse-financiere`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: {
          fr: `${baseUrl}/analyse-financiere`,
          en: `${baseUrl}/analyse-financiere`,
          es: `${baseUrl}/analyse-financiere`,
          pt: `${baseUrl}/analyse-financiere`,
        },
      },
    },
    {
      url: `${baseUrl}/simulation`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: {
        languages: {
          fr: `${baseUrl}/simulation`,
          en: `${baseUrl}/simulation`,
          es: `${baseUrl}/simulation`,
          pt: `${baseUrl}/simulation`,
        },
      },
    },
    {
      url: `${baseUrl}/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]
}

