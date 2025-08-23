import type { NextApiRequest, NextApiResponse } from 'next'
import { faker } from '@faker-js/faker'
import { addDays, subDays } from 'date-fns'

interface Visit {
  date: string
  attended: boolean
}

interface Patient {
  id: string
  name: string
  service: string
  lastInvoiceDate: string
  lastVisit: string
  visits: Visit[]
}

// Helper function to generate random visits
const generateVisits = (startDate: Date, numVisits: number): Visit[] => {
  const visits: Visit[] = []
  let currentDate = startDate

  for (let i = 0; i < numVisits; i++) {
    visits.push({
      date: currentDate.toISOString(),
      attended: Math.random() > 0.2 // 80% attendance rate
    })
    currentDate = addDays(currentDate, 1)
  }

  return visits
}

// Services available
const services = [
  'Physical Therapy',
  'Occupational Therapy',
  'Speech Therapy',
  'Rehabilitation'
]

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Patient[]>
) {
  if (req.method !== 'GET') {
    res.status(405).end()
    return
  }

  // Generate 10 active patients with mock data
  const patients: Patient[] = Array.from({ length: 10 }, () => {
    const lastInvoiceDate = subDays(new Date(), faker.number.int({ min: 20, max: 30 }))
    const lastVisit = subDays(new Date(), faker.number.int({ min: 0, max: 5 }))
    
    return {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      service: services[faker.number.int({ min: 0, max: services.length - 1 })],
      lastInvoiceDate: lastInvoiceDate.toISOString(),
      lastVisit: lastVisit.toISOString(),
      visits: generateVisits(lastInvoiceDate, faker.number.int({ min: 15, max: 25 }))
    }
  })

  res.status(200).json(patients)
}