import { NextRequest, NextResponse } from 'next/server'
import { ReservationService } from '@/services/reservation.service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const reservation = await ReservationService.releaseReservation(id)
    return NextResponse.json({ success: true, data: reservation })
  } catch (error: any) {
    console.error('Error releasing reservation:', error)

    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      )
    }

    if (error.message?.includes('already released')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to release reservation' },
      { status: 500 }
    )
  }
}
