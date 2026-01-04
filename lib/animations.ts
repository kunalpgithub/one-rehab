import { Variants } from 'framer-motion'

// Page transition variants
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
}

// Fade in animation
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  },
}

// Slide up animation
export const slideUp: Variants = {
  initial: { 
    opacity: 0,
    y: 20
  },
  animate: { 
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  exit: { 
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 }
  },
}

// Scale animation (for modals)
export const scaleIn: Variants = {
  initial: { 
    opacity: 0,
    scale: 0.95
  },
  animate: { 
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  exit: { 
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 }
  },
}

// Stagger children animation
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
}

// Mobile-optimized animations (reduced motion)
export const mobileFadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.2 }
  },
}

export const mobileSlideUp: Variants = {
  initial: { 
    opacity: 0,
    y: 10
  },
  animate: { 
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' }
  },
}

