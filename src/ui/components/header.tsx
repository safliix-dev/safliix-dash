'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function Header({ title, className, children, backHref }: {
  title: string
  className?: string
  children?: React.ReactNode
  backHref?: string
}) {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(backHref!)
    }
  }

  return (
    <div className={`flex items-center justify-between p-2 bg-[#686868] ${className}`}>
      <div className="flex items-center gap-3">
        {backHref && (
          <button onClick={handleBack} className="text-white hover:text-gray-200 transition-colors cursor-pointer">
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className="text-2xl font-bold text-white">{title}</h1>
      </div>
      {children}
    </div>
  )
}
