import { NextRequest, NextResponse } from 'next/server'
import { ReservationService } from '@/services/reservation.service'
import { createReservationSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createReservationSchema.parse(body)

    const reservation = await ReservationService.createReservation(
      validated.productId,
      validated.warehouseId,
      validated.quantity
    )

    return NextResponse.json({ success: true, data: reservation }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating reservation:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      )
    }

    if (error.message?.includes('Insufficient stock')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create reservation' },
      { status: 500 }
    )
  }
}
