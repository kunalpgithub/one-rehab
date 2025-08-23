import { NextApiRequest, NextApiResponse } from 'next'
import { faker } from '@faker-js/faker'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const users = Array.from({ length: 10 }, () => ({
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      avatar: faker.image.avatar()
    }))
    
    res.status(200).json(users)
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}