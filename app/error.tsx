"use client"

import { Button } from "@/components/ui/button"

type ErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">문제가 발생했습니다</h1>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button onClick={reset}>다시 시도</Button>
      </div>
    </div>
  )
}
