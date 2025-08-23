import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'

// Example handlers for mock API endpoints
export const handlers = [
  // GET /api/patients - Get list of patients
  http.get('/api/patients', () => {
    const patients = Array.from({ length: 8 }, () => ({
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      service: faker.helpers.arrayElement(['Physical Therapy', 'Occupational Therapy', 'Speech Therapy', 'Rehabilitation']),
      lastVisit: faker.date.recent({ days: 30 }).toISOString(),
      status: faker.helpers.arrayElement(['pending', 'completed'])
    }))
    return HttpResponse.json(patients)
  }),

  // POST /api/visits/complete - Mark visits as completed
  http.post('/api/visits/complete', async ({ request }) => {
    const body = await request.json() as { patientIds: string[], date: string }
    return HttpResponse.json({
      success: true,
      message: 'Visits marked as completed',
      updatedPatients: body.patientIds,
      completedAt: body.date
    }, { status: 200 })
  }),
  // GET /api/users
  http.get('/api/users', () => {
    const users = Array.from({ length: 10 }, () => ({
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      avatar: faker.image.avatar()
    }))

    return HttpResponse.json(users)
  }),

  // GET /api/user/:id
  http.get('/api/user/:id', ({ params }) => {
    const { id } = params
    
    return HttpResponse.json({
      id,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      address: {
        street: faker.location.street(),
        city: faker.location.city(),
        zipCode: faker.location.zipCode()
      }
    })
  }),

  // POST /api/users
  http.post('/api/users', async ({ request }) => {
    const newUser = {
      id: faker.string.uuid(),
      createdAt: faker.date.recent(),
      ...((await request.json()) as Record<string, unknown>)
    }
    
    return HttpResponse.json(newUser, { status: 201 })
  })
]