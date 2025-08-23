import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'

function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      import('../src/mocks/browser')
    }
  }, [])

  return <Component {...pageProps} />
}

export default App
