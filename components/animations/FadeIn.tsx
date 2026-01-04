import { motion } from 'framer-motion'
import { fadeIn } from '@/lib/animations'
import { ReactNode } from 'react'

interface FadeInProps {
  children: ReactNode
  delay?: number
}

export function FadeIn({ children, delay = 0 }: FadeInProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeIn}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  )
}

