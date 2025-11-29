import type { CategoryDefinition } from '../lib/mock-data'

interface CategoryIconProps {
  category: CategoryDefinition
  size?: number
  className?: string
}

// Sprite sheet configuration - adjust these based on your actual image dimensions
// If you have a single image with all icons, configure it here
// Otherwise, use individual icon images (recommended)
const SPRITE_CONFIG = {
  imagePath: '/icons/service-categories-sprite.png', // Main sprite sheet image (optional)
  iconSize: 200, // Size of each icon in the sprite sheet
  iconsPerRow: 3, // Number of icons per row in the sprite sheet
  // Icon positions in the sprite sheet (0-indexed) - adjust based on your image layout
  positions: {
    1: { row: 0, col: 1 }, // Shops - top center
    2: { row: 1, col: 0 }, // Pharmacy & Beauty - mid-left
    3: { row: 0, col: 2 }, // Groceries - top-right
    4: { row: 1, col: 1 }, // Food - bottom-center
    5: { row: 1, col: 2 }, // Package Delivery - bottom-left
  },
  enabled: false, // Set to true if using sprite sheet instead of individual images
}

export function CategoryIcon({ category, size = 64, className = '' }: CategoryIconProps) {
  // If individual icon image is provided, use it
  if (category.iconImage) {
    return (
      <img
        src={category.iconImage}
        alt={category.name}
        width={size}
        height={size}
        className={`object-contain ${className}`}
        onError={(e) => {
          // Fallback: try sprite sheet if individual image fails
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          // You could show a fallback icon here
        }}
      />
    )
  }

  // If sprite sheet is enabled and available, use CSS background positioning
  if (SPRITE_CONFIG.enabled) {
    const position = SPRITE_CONFIG.positions[category.id as keyof typeof SPRITE_CONFIG.positions]
    if (position) {
      const backgroundX = -position.col * SPRITE_CONFIG.iconSize
      const backgroundY = -position.row * SPRITE_CONFIG.iconSize

      return (
        <div
          className={`bg-no-repeat ${className}`}
          style={{
            width: size,
            height: size,
            backgroundImage: `url(${SPRITE_CONFIG.imagePath})`,
            backgroundPosition: `${backgroundX}px ${backgroundY}px`,
            backgroundSize: `${SPRITE_CONFIG.iconsPerRow * SPRITE_CONFIG.iconSize}px auto`,
          }}
          aria-label={category.name}
        />
      )
    }
  }

  // Fallback to icon component if available
  if (category.icon) {
    const Icon = category.icon
    return <Icon className={className} size={size} />
  }

  // Final fallback
  return <div className={`bg-gray-300 ${className}`} style={{ width: size, height: size }} />
}

