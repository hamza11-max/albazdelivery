# Category Icons Setup Guide

This guide explains how to set up the service category icons for the customer app.

## Current Icon Configuration

The customer app is configured to use the following icon images:

1. **Shops** → `/public/icons/gifts.png` (Smartphone with storefront and shopping cart)
2. **Pharmacy & Beauty** → `/public/icons/beauty.png` (Makeup products: lipstick, compacts)
3. **Groceries** → `/public/icons/groceries.png` (Shopping cart with grocery items)
4. **Food** → `/public/icons/restaurants.png` (Food items: hamburger, pizza, etc.)
5. **Package Delivery** → `/public/icons/package-delivery.png` (Delivery scooter with package)

## Icon Specifications

- **Format**: PNG (with transparent background preferred)
- **Recommended size**: 200x200px to 400x400px (square format works best)
- **Background**: Transparent or white background preferred
- **Location**: All icons should be placed in `/public/icons/` directory

## File Structure

```
public/
  icons/
    gifts.png          # Shops icon
    beauty.png         # Pharmacy & Beauty icon
    groceries.png      # Groceries icon
    restaurants.png    # Food icon
    package-delivery.png # Package Delivery icon
```

The icons are configured in `apps/customer/lib/mock-data.ts`.

## Troubleshooting

If icons are not showing up:

1. **Clear browser cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. **Restart dev server**: Stop and restart `npm run dev` or `pnpm dev`
3. **Check file paths**: Ensure files are in `/public/icons/` with exact names:
   - `gifts.png`
   - `beauty.png`
   - `groceries.png`
   - `restaurants.png`
   - `package-delivery.png`
4. **Check browser console**: Look for 404 errors for missing image files
5. **Verify file extensions**: Files should be `.png` (not `.jpg` or `.jpeg`)

## Option 2: Sprite Sheet

If you prefer to use a single sprite sheet image:

1. Create a sprite sheet with all 5 icons arranged in a grid
2. Place it at `/public/icons/service-categories-sprite.png`
3. Update the `SPRITE_CONFIG` in `components/CategoryIcon.tsx`:
   - Set `enabled: true`
   - Adjust `iconSize` to match your icon dimensions
   - Adjust `iconsPerRow` based on your grid layout
   - Update `positions` to match the icon positions in your sprite sheet

## Icon Extraction Tools

You can use any image editing software to extract individual icons:
- **Photoshop**: Use the Crop tool or Slice tool
- **GIMP**: Use the Rectangle Select tool
- **Online tools**: Use tools like Photopea, Canva, or Figma

## Current Configuration

The icons are configured in `apps/customer/lib/mock-data.ts`:

```typescript
{
  id: 1,
  name: 'Shops',
  iconImage: '/icons/shops-icon.png',
  // ...
}
```

The `CategoryIcon` component will automatically:
- Use individual icon images if `iconImage` is provided
- Fall back to sprite sheet if sprite is enabled
- Fall back to Lucide icons if images are not available

## Testing

After adding your icon images, test by:
1. Starting the development server
2. Navigating to the home page
3. Verifying that all category icons display correctly
4. Checking browser console for any image loading errors

