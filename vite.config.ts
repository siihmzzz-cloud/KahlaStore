import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const siteUrl = (env.VITE_SITE_URL || 'https://kahlastore.vercel.app').replace(/\/$/, '')

  return {
    plugins: [
      react(),
      {
        name: 'absolute-social-preview-image',
        transformIndexHtml(html: string) {
          return html.replaceAll('%SITE_URL%', siteUrl)
        },
      },
    ],
  }
})
