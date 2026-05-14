import { NextResponse } from 'next/server'
import { WarehouseService } from '@/services/warehouse.service'

export async function GET() {
  try {
    const warehouses = await WarehouseService.getAllWarehouses()
    return NextResponse.json({ success: true, data: warehouses })
  } catch (error) {
    console.error('Error fetching warehouses:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch warehouses' },
      { status: 500 }
    )
  }
}
