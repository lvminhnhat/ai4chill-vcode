import Image from 'next/image'

interface ProductGalleryProps {
  image: string
  alt: string
}

export function ProductGallery({ image, alt }: ProductGalleryProps) {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
      <Image
        src={image || '/images/placeholder.jpg'}
        alt={alt}
        fill
        className="object-cover"
        priority
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  )
}
