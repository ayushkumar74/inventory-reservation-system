import { NextRequest, NextResponse } from 'next/server'
import { ReservationService } from '@/services/reservation.service'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const reservation = await ReservationService.getReservation(id)

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: 'Reservation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: reservation })
  } catch (error) {
    console.error('Error fetching reservation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reservation' },
      { status: 500 }
    )
  }
}
