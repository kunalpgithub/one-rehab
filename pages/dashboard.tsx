import Head from 'next/head'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Navigation from '../components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { usePatientsQuery } from '../hooks/usePatientsQuery'
import { useVisitsQuery } from '../hooks/useVisitsQuery'
import { useInvoicesQuery } from '../hooks/useInvoicesQuery'
import { staggerContainer, staggerItem } from '../lib/animations'

interface DashboardStats {
  totalPatients: number
  activeVisits: number
  pendingInvoices: number
  completedVisits: number
}

export default function Dashboard() {
  const { data: patients = [], isLoading: patientsLoading } = usePatientsQuery()
  const { data: visits = [], isLoading: visitsLoading } = useVisitsQuery()
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoicesQuery()

  const stats: DashboardStats = {
    totalPatients: patients.length,
    activeVisits: visits.filter(v => {
      const today = new Date()
      return v.generatedDates.some(date => {
        const visitDate = new Date(date)
        return visitDate >= today
      })
    }).length,
    pendingInvoices: invoices.length,
    completedVisits: visits.reduce((acc, v) => acc + v.generatedDates.filter(date => new Date(date) < new Date()).length, 0)
  }

  const loading = patientsLoading || visitsLoading || invoicesLoading

  return (
    <>
      <Head>
        <title>Dashboard - One Rehab</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <main className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-gray-900 mb-8"
            >
              Dashboard
            </motion.h1>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <motion.div 
                initial="initial"
                animate="animate"
                variants={staggerContainer}
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
              >
                {/* Total Patients */}
                <motion.div variants={staggerItem}>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                      <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalPatients}</div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Active Visits */}
                <motion.div variants={staggerItem}>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Visits</CardTitle>
                      <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.activeVisits}</div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Pending Invoices */}
                <motion.div variants={staggerItem}>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
                      <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Completed Visits */}
                <motion.div variants={staggerItem}>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Completed Visits</CardTitle>
                      <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.completedVisits}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}