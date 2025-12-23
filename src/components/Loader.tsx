// src/components/Loader.tsx
export default function Loader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="relative">
        {/* Spinning circle */}
        <div className="w-16 h-16 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
        {/* Pulsing inner circle */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-8 h-8 bg-green-600 rounded-full animate-pulse opacity-20"></div>
        </div>
      </div>
    </div>
  )
}