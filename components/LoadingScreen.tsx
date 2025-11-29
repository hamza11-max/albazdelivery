"use client"

interface LoadingScreenProps {
  message?: string
  className?: string
}

export function LoadingScreen({ 
  message = "Chargement...", 
  className = "" 
}: LoadingScreenProps) {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 ${className}`}>
      <div className="text-center">
        {/* ALBAZ Logo GIF */}
        <div className="mb-6 flex justify-center">
          <img 
            src="/albaz-logo.gif" 
            alt="AlBaz Logo" 
            className="h-32 w-32 md:h-40 md:w-40 object-contain animate-pulse"
            onError={(e) => {
              // Fallback to SVG if GIF not found
              const target = e.target as HTMLImageElement
              target.src = "/logo.svg"
              target.onerror = null // Prevent infinite loop
            }}
          />
        </div>
        
        {/* Loading spinner overlay */}
        <div className="relative inline-block">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent"></div>
          </div>
        </div>
        
        {/* Loading message */}
        <p className="mt-6 text-gray-600 dark:text-gray-400 text-sm md:text-base font-medium">
          {message}
        </p>
      </div>
    </div>
  )
}

