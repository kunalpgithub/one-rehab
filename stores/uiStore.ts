import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface UIState {
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
  mobileMenuOpen: boolean
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setSidebarOpen: (open: boolean) => void
  setMobileMenuOpen: (open: boolean) => void
  toggleSidebar: () => void
  toggleMobileMenu: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarOpen: false,
      mobileMenuOpen: false,
      setTheme: (theme) => set({ theme }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
    }
  )
)

