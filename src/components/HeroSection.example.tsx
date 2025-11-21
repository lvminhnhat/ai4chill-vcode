import React from 'react'
import HeroSection from './HeroSection'

/**
 * Example usage of HeroSection component
 */
export default function HeroSectionExample() {
  return (
    <div>
      {/* Default HeroSection */}
      <HeroSection />

      {/* Custom HeroSection */}
      <HeroSection
        title="Custom AI Tools Title"
        subtitle="Custom subtitle for demonstration"
        primaryCta={{
          text: 'Get Started',
          href: '/get-started',
        }}
        secondaryCta={{
          text: 'Learn More',
          href: '/learn-more',
        }}
        showImage={true}
      />

      {/* HeroSection without image */}
      <HeroSection
        title="Simple Hero Without Image"
        subtitle="Clean and minimal design"
        showImage={false}
      />
    </div>
  )
}
