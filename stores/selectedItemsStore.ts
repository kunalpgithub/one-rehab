import { create } from 'zustand'

interface SelectedItemsState {
  selectedPatients: Set<string>
  selectedVisits: Set<string>
  selectedInvoices: Set<string>
  setSelectedPatients: (ids: Set<string>) => void
  setSelectedVisits: (ids: Set<string>) => void
  setSelectedInvoices: (ids: Set<string>) => void
  togglePatient: (id: string) => void
  toggleVisit: (id: string) => void
  toggleInvoice: (id: string) => void
  clearAll: () => void
}

export const useSelectedItemsStore = create<SelectedItemsState>((set) => ({
  selectedPatients: new Set(),
  selectedVisits: new Set(),
  selectedInvoices: new Set(),
  setSelectedPatients: (ids) => set({ selectedPatients: ids }),
  setSelectedVisits: (ids) => set({ selectedVisits: ids }),
  setSelectedInvoices: (ids) => set({ selectedInvoices: ids }),
  togglePatient: (id) =>
    set((state) => {
      const newSet = new Set(state.selectedPatients)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return { selectedPatients: newSet }
    }),
  toggleVisit: (id) =>
    set((state) => {
      const newSet = new Set(state.selectedVisits)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return { selectedVisits: newSet }
    }),
  toggleInvoice: (id) =>
    set((state) => {
      const newSet = new Set(state.selectedInvoices)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return { selectedInvoices: newSet }
    }),
  clearAll: () =>
    set({
      selectedPatients: new Set(),
      selectedVisits: new Set(),
      selectedInvoices: new Set(),
    }),
}))

