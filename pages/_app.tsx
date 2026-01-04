import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { queryClient } from '../lib/queryClient'
import { pageVariants } from '../lib/animations'
import { Toaster } from '../components/ui/toaster'

// List of public routes that don't require authentication
const publicRoutes = ['/login']

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user && !publicRoutes.includes(router.pathname)) {
        router.push('/login')
      } else if (user && router.pathname === '/login') {
        router.push('/dashboard')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading, router.pathname])

  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      import('../src/mocks/browser')
    }
  }, [])

  // Register service worker for PWA
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered:', registration.scope)
          })
          .catch((error) => {
            console.log('Service Worker registration failed:', error)
          })
      })
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user && !publicRoutes.includes(router.pathname)) {
    return null
  }

  return <>{children}</>
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGuard>
          <Head>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover"
            />
          </Head>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={router.asPath}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
            >
              <Component {...pageProps} />
            </motion.div>
          </AnimatePresence>
          <Toaster />
        </AuthGuard>
      </AuthProvider>
    </QueryClientProvider>
  )
}
