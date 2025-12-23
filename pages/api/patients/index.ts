import { NextApiRequest, NextApiResponse } from 'next'
import { faker } from '@faker-js/faker'
import { Patient, CreatePatientRequest } from '../../../types'
import { patientsStorage } from '../../../utils/storage'

// Note: Data is stored in localStorage on the client side
// This API route acts as a proxy to maintain compatibility
// In production, this would connect to a real database

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // For client-side storage, we need to handle this differently
  // Since API routes run on the server, we'll return instructions
  // The actual storage happens in the client-side code
  
  if (req.method === 'GET') {
    // Return empty array - client will read from localStorage directly
    res.status(200).json([])
  } else if (req.method === 'POST') {
    const body = req.body as CreatePatientRequest
    
    // Validate required fields
    if (!body.name || !body.service) {
      return res.status(400).json({ message: 'Name and service are required' })
    }

    // Generate patient ID and return it
    // Client will store it in localStorage
    const newPatient: Patient = {
      id: faker.string.uuid(),
      name: body.name,
      service: body.service,
      status: 'pending'
    }

    res.status(201).json(newPatient)
  } else if (req.method === 'PATCH') {
    const body = req.body as { id: string; lastVisit?: string; status?: 'pending' | 'completed' }
    
    if (!body.id) {
      return res.status(400).json({ message: 'Patient ID is required' })
    }

    // Return success - client will update localStorage
    res.status(200).json({ 
      id: body.id,
      ...(body.lastVisit && { lastVisit: body.lastVisit }),
      ...(body.status && { status: body.status })
    })
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}
