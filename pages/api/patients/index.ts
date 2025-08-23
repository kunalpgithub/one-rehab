import { NextApiRequest, NextApiResponse } from 'next'
import { faker } from '@faker-js/faker'

// This is a mock API endpoint. In a real application, 
// you would fetch this data from your database
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // Generate mock patient data
  const patients = Array.from({ length: 8 }, () => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    service: faker.helpers.arrayElement(['Physical Therapy', 'Occupational Therapy', 'Speech Therapy', 'Rehabilitation']),
    lastVisit: faker.date.recent({ days: 30 }).toISOString(),
    status: faker.helpers.arrayElement(['pending', 'completed']) as 'pending' | 'completed'
  }))

  res.status(200).json(patients)
}