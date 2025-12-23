import { NextApiRequest, NextApiResponse } from 'next'
import { faker } from '@faker-js/faker'
import { User } from '../../../types'

// In-memory storage for mock data (in production, this would be a database)
// All users in the same firm for demo purposes
const FIRM_ID = 'firm-001'

let mockUsers: User[] = []

// Initialize with some mock data on first load
if (mockUsers.length === 0) {
  mockUsers = Array.from({ length: 10 }, () => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    avatar: faker.image.avatar(),
    firmId: FIRM_ID
  }))
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { firmId } = req.query
    
    // Filter by firmId if provided, otherwise return all users
    let users = mockUsers
    if (firmId) {
      users = mockUsers.filter(user => user.firmId === firmId)
    }
    
    res.status(200).json(users)
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}