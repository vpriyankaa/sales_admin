"use client"

import { useState, useEffect, useCallback } from "react"

interface UseImageUrlResult {
  imageUrl: string | null
  loading: boolean
  error: string | null
  retry: () => void
}

export function useImageUrl(filename: string | null): UseImageUrlResult {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState<number>(0)

  const fetchImageUrl = useCallback(async (filename: string) => {
    if (!filename) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/get-image-url?filename=${encodeURIComponent(filename)}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      setImageUrl(data.url)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load image"
      setError(errorMessage)
      console.error("Error fetching image URL:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const retry = useCallback(() => {
    if (filename && retryCount < 3) {
      // Limit retries to prevent infinite loops
      setRetryCount((prev) => prev + 1)
      fetchImageUrl(filename)
    }
  }, [filename, fetchImageUrl, retryCount])

  useEffect(() => {
    if (filename) {
      setRetryCount(0) // Reset retry count for new filename
      fetchImageUrl(filename)
    } else {
      setImageUrl(null)
      setError(null)
      setLoading(false)
    }
  }, [filename, fetchImageUrl])

  return { imageUrl, loading, error, retry }
}
