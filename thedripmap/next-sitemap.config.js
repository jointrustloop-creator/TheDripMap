/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://thedripmap.com',
  generateRobotsTxt: true,
  exclude: ['/dashboard*', '/search*', '/onboarding*', '/quiz-result*'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/search', '/onboarding', '/quiz-result'],
      },
    ],
  },
};
