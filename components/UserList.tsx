import { useEffect, useState } from 'react'

interface User {
  id: string
  name: string
  email: string
  avatar: string
}

export default function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h2>Users</h2>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {users.map(user => (
          <div key={user.id} style={{ border: '1px solid #ddd', padding: '1rem' }}>
            <h3>{user.name}</h3>
            <p>{user.email}</p>
            <img src={user.avatar} alt={user.name} style={{ width: 50, height: 50, borderRadius: '50%' }} />
          </div>
        ))}
      </div>
    </div>
  )
}