'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ProductWithInventory } from '@/types'

export default function Home() {
  const router = useRouter()

  const [products, setProducts] = useState<ProductWithInventory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reserving, setReserving] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
    
    // Add polling to catch background expiry cleanups every 30 seconds
    const interval = setInterval(() => {
      fetchProducts(false) // Fetch silently without full loading state
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchProducts = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)

      const response = await fetch('/api/products', {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const result = await response.json()

      if (result.success && Array.isArray(result.data)) {
        setProducts(result.data)
      } else {
        setProducts([])
        if (showLoading) {
          setError('Invalid API response')
          toast.error('Invalid API response')
        }
      }
    } catch (err) {
      console.error(err)
      if (showLoading) {
        setError('Failed to load products')
        toast.error('Failed to load products')
      }
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const handleReserve = async (
    productId: string,
    warehouseId: string,
    availableStock: number
  ) => {
    if (availableStock < 1) {
      toast.error('No stock available')
      return
    }

    setReserving(`${productId}-${warehouseId}`)

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          warehouseId,
          quantity: 1,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Reservation created successfully')

        // Refresh products after reservation
        await fetchProducts()

        router.push(`/reservation/${result.data.id}`)
      } else {
        toast.error(result.error || 'Reservation failed')
      }
    } catch (err) {
      console.error(err)
      toast.error('Reservation failed')
    } finally {
      setReserving(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-semibold">
          Loading products...
        </h1>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">
            {error}
          </h1>

          <Button onClick={fetchProducts}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">

        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-3">
            Inventory Reservation System
          </h1>

          <p className="text-gray-600 text-lg">
            Browse products and reserve stock from warehouses
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold">
              No products found
            </h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {products.map((product) => (
              <Card
                key={product.id}
                className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden border-gray-200 bg-white"
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start gap-4 mb-1">
                    <CardTitle className="text-xl font-bold text-gray-900 leading-tight">
                      {product.name}
                    </CardTitle>
                    <Badge variant="secondary" className="font-mono text-xs text-gray-500 whitespace-nowrap">
                      {product.sku}
                    </Badge>
                  </div>

                  <CardDescription className="text-sm text-gray-600 mt-1">
                    {product.description}
                  </CardDescription>
                  
                  <div className="mt-4">
                    <span className="text-2xl font-extrabold text-gray-900">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="pt-2">

                  <div className="space-y-3">

                    {product.inventory?.map((inv) => (
                      <div
                        key={inv.id}
                        className="border border-gray-100 rounded-xl p-4 bg-gray-50 hover:bg-white transition-colors duration-200"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-800 text-sm">
                              {inv.warehouse?.name}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {inv.warehouse?.location}
                            </p>
                          </div>
                          <Badge variant={inv.availableStock > 0 ? "default" : "destructive"} className="shadow-sm">
                            {inv.availableStock} Available
                          </Badge>
                        </div>

                        <div className="flex gap-2 text-xs text-gray-500 mb-4 bg-white p-2 rounded-lg border border-gray-100">
                          <div className="flex-1 text-center">
                            <span className="block font-semibold text-gray-700">{inv.totalStock}</span>
                            Total
                          </div>
                          <div className="w-px bg-gray-200"></div>
                          <div className="flex-1 text-center">
                            <span className="block font-semibold text-orange-600">{inv.reservedStock}</span>
                            Reserved
                          </div>
                        </div>

                        <Button
                          className="w-full rounded-xl font-medium transition-all duration-200"
                          variant={inv.availableStock > 0 ? "default" : "secondary"}
                          disabled={
                            inv.availableStock < 1 ||
                            reserving === `${product.id}-${inv.warehouseId}`
                          }
                          onClick={() =>
                            handleReserve(
                              product.id,
                              inv.warehouseId,
                              inv.availableStock
                            )
                          }
                        >
                          {reserving === `${product.id}-${inv.warehouseId}` ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              Reserving...
                            </span>
                          ) : (
                            `Reserve from ${inv.warehouse?.location?.split(',')[0] || 'Warehouse'}`
                          )}
                        </Button>
                      </div>
                    ))}

                  </div>
                </CardContent>

              </Card>
            ))}

          </div>
        )}
      </div>
    </main>
  )
}