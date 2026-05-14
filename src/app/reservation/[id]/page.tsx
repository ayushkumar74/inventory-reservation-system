'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Reservation } from '@/types'

export default function ReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string | null>(null)
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    // Unwrap params
    params.then((p) => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return
    fetchReservation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (reservation?.status === 'PENDING' && reservation.expiresAt) {
      const updateTimer = () => {
        const now = new Date().getTime()
        const expires = new Date(reservation.expiresAt).getTime()
        const diff = expires - now
        setTimeLeft(Math.max(0, Math.floor(diff / 1000)))
      }

      updateTimer()
      const timer = setInterval(updateTimer, 1000)
      return () => clearInterval(timer)
    }
  }, [reservation])

  const fetchReservation = async () => {
    if (!id) return
    try {
      const res = await fetch(`/api/reservations/${id}`)
      const data = await res.json()
      if (data.success) {
        setReservation(data.data)
      } else if (res.status === 404) {
        toast.error('Reservation not found')
        router.push('/')
      }
    } catch (error) {
      toast.error('Failed to fetch reservation')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!id) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/reservations/${id}/confirm`, {
        method: 'POST',
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Reservation confirmed successfully')
        setReservation(data.data)
      } else {
        if (res.status === 410) {
          toast.error('Reservation has expired')
          fetchReservation()
        } else {
          toast.error(data.error || 'Failed to confirm reservation')
        }
      }
    } catch (error) {
      toast.error('Failed to confirm reservation')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRelease = async () => {
    if (!id) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/reservations/${id}/release`, {
        method: 'POST',
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Reservation released successfully')
        // After release, redirect back to products page as requested
        setTimeout(() => {
          router.push('/')
        }, 1500)
      } else {
        toast.error(data.error || 'Failed to release reservation')
      }
    } catch (error) {
      toast.error('Failed to release reservation')
    } finally {
      setActionLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'default'
      case 'CONFIRMED':
        return 'secondary'
      case 'RELEASED':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading reservation...</div>
      </div>
    )
  }

  if (!reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Reservation not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={() => router.push('/')}
            variant="ghost"
            className="mb-6"
          >
            ← Back to Products
          </Button>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">Reservation Details</CardTitle>
                  <CardDescription>Reservation ID: {reservation.id}</CardDescription>
                </div>
                <Badge variant={getStatusColor(reservation.status)}>
                  {reservation.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Product</p>
                  <p className="font-semibold">{reservation.product?.name || 'Loading...'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quantity</p>
                  <p className="font-semibold">{reservation.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created At</p>
                  <p className="font-semibold">
                    {new Date(reservation.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expires At</p>
                  <p className="font-semibold">
                    {new Date(reservation.expiresAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {reservation.status === 'PENDING' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 font-medium mb-2">
                    ⏰ Reservation expires in: {formatTime(timeLeft)}
                  </p>
                  <p className="text-xs text-yellow-700">
                    Confirm your reservation before it expires to secure your stock.
                  </p>
                </div>
              )}

              {reservation.status === 'CONFIRMED' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 font-medium">
                    ✓ Reservation confirmed at {reservation.confirmedAt ? new Date(reservation.confirmedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              )}

              {reservation.status === 'RELEASED' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800 font-medium">
                    ✗ Reservation released at {reservation.releasedAt ? new Date(reservation.releasedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-3">
              {reservation.status === 'PENDING' && (
                <>
                  <Button
                    onClick={handleConfirm}
                    disabled={actionLoading || timeLeft <= 0}
                    className="flex-1"
                  >
                    {actionLoading ? 'Processing...' : 'Confirm Reservation'}
                  </Button>
                  <Button
                    onClick={handleRelease}
                    disabled={actionLoading}
                    variant="outline"
                    className="flex-1"
                  >
                    {actionLoading ? 'Processing...' : 'Release Reservation'}
                  </Button>
                </>
              )}
              {reservation.status === 'CONFIRMED' && (
                <div className="flex gap-3 w-full">
                  <Button
                    onClick={() => router.push('/')}
                    variant="outline"
                    className="flex-1"
                  >
                    Back to Products
                  </Button>
                  <Button
                    onClick={handleRelease}
                    disabled={actionLoading}
                    variant="destructive"
                    className="flex-1"
                  >
                    {actionLoading ? 'Processing...' : 'Cancel Reservation'}
                  </Button>
                </div>
              )}
              {reservation.status === 'RELEASED' && (
                <Button
                  onClick={() => router.push('/')}
                  className="w-full"
                >
                  Back to Products
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
