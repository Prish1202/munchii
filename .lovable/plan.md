# Grocery browsing and image optimization

## What will change
- Keep the existing outlet header first on every merchant page.
- For Grocery outlets only, replace the long category pill row with a compact, horizontally scrollable two-column category gallery.
- Each category card will show the category name and a collage of up to four available product images from that category.
- Selecting a category will move into that category’s product list, with an easy back-to-categories control, search, sorting, and the existing cart controls.
- Grocery products will use compact, phone-friendly cards showing image, name, price or quantity option, availability, and the existing Add controls.
- Restaurant/Café and Campus Canteen pages will keep their current menu structure and behavior.

## Image handling
- Upgrade the shared image upload path so every new image is resized and compressed before it is sent to storage.
- Use purpose-specific presets: small square profile photos, balanced product/menu images, and wider outlet photos.
- Prefer WebP when the browser can encode it, while safely falling back to JPEG or the original file if conversion is unsupported.
- Preserve transparency when needed, correct image orientation through browser decoding, cap dimensions and output size, and never upscale small images.
- Keep existing stored image URLs working unchanged; responsive `object-cover` display prevents stretching across phone sizes.

## Safety and verification
- Do not change cart calculations, product option pricing, orders, Razorpay, pickup windows, capacity, authentication, or Coins.
- Verify Grocery and food merchant rendering separately, including empty categories, uncategorized products, search, quantity options, mobile layout, and existing image URLs.
- Verify newly selected profile, product/menu, and outlet photos are optimized before upload and still preview correctly.

## Technical details
- Add reusable image optimization presets to the media utility and apply them inside the shared B2 upload hook, with optional per-upload purpose.
- Update the three current image upload callers to identify avatar, catalog, or outlet photos.
- Split Grocery rendering in the customer merchant page from the existing Restaurant/Canteen rendering while sharing the current add-to-cart and quantity-option handlers.
- Use current category and item queries; no database schema or backend business-logic changes are required.
