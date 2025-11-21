import React from 'react'
import TrustBar from './TrustBar'

/**
 * Example usage of TrustBar component
 */
export default function TrustBarExample() {
  return (
    <div>
      {/* Default TrustBar */}
      <TrustBar />

      {/* TrustBar with custom className */}
      <TrustBar className="mt-8" />

      {/* TrustBar in different context */}
      <div className="bg-gray-100 py-8">
        <TrustBar className="bg-gray-50 border-gray-300" />
      </div>
    </div>
  )
}
