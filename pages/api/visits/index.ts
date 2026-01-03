import { NextApiRequest, NextApiResponse } from 'next'
import { faker } from '@faker-js/faker'
import { ScheduledVisit, CreateVisitRequest } from '../../../types'
import { generateVisitDates } from '../../../utils/visitScheduler'

// Note: Data is stored in localStorage on the client side
// This API route acts as a proxy to maintain compatibility
// In production, this would connect to a real database

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Return empty array - client will read from localStorage directly
    res.status(200).json([])
  } else if (req.method === 'POST') {
    const body = req.body as CreateVisitRequest
    
    // Validate required fields
    if (!body.patientId || !body.visitorId || !body.frequency || !body.startDate) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    if (!body.visitsPerPeriod || body.visitsPerPeriod < 1) {
      return res.status(400).json({ message: 'visitsPerPeriod must be at least 1' })
    }

    // Validate time slots
    if (!body.timeSlots || !Array.isArray(body.timeSlots) || body.timeSlots.length === 0) {
      return res.status(400).json({ message: 'timeSlots array is required' })
    }

    if (body.timeSlots.length !== body.visitsPerPeriod) {
      return res.status(400).json({ message: 'Number of time slots must match visits per period' })
    }

    // Generate visit dates
    const generatedDates = generateVisitDates(
      body.frequency,
      body.visitsPerPeriod,
      body.startDate,
      body.timeSlots,
      body.endDate,
      body.occurrences
    )

    if (generatedDates.length === 0) {
      return res.status(400).json({ message: 'No visits could be generated with the provided parameters' })
    }

    // Generate visit ID and return it
    // Client will store it in localStorage
    const newVisit: ScheduledVisit = {
      id: faker.string.uuid(),
      patientId: body.patientId,
      visitorId: body.visitorId,
      frequency: body.frequency,
      visitsPerPeriod: body.visitsPerPeriod,
      startDate: body.startDate,
      endDate: body.endDate,
      occurrences: body.occurrences,
      timeSlots: body.timeSlots,
      generatedDates,
      createdAt: new Date().toISOString()
    }

    res.status(201).json(newVisit)
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}

