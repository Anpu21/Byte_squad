/**
 * Curated Unsplash images used by the admin seed to give each product
 * a relevant photo. Photos are picked round-robin within a category, so
 * the same product (by index in `SUPERMARKET_PRODUCTS`) always gets the
 * same image — no random churn between seed runs.
 *
 * Format: `https://images.unsplash.com/photo-<id>?w=600&q=80&auto=format&fit=crop`
 *
 * If a specific photo ever stops looking right, swap the URL here and
 * delete the corresponding asset in Cloudinary's Media Library; the next
 * seed run will re-upload at the same `public_id`.
 */
export const SEED_PRODUCT_IMAGES: Record<string, string[]> = {
  Beverages: [
    'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&q=80&auto=format&fit=crop', // soda bottle
    'https://images.unsplash.com/photo-1622543925917-bd9e34ee9e6f?w=600&q=80&auto=format&fit=crop', // cola cans
    'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=600&q=80&auto=format&fit=crop', // sprite-style soda
    'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&q=80&auto=format&fit=crop', // orange juice
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80&auto=format&fit=crop', // bottled water
    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80&auto=format&fit=crop', // tea cup / leaves
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80&auto=format&fit=crop', // coffee
  ],
  Dairy: [
    'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80&auto=format&fit=crop', // milk bottle
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80&auto=format&fit=crop', // yogurt
    'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=80&auto=format&fit=crop', // cheese block
    'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&q=80&auto=format&fit=crop', // butter
    'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&q=80&auto=format&fit=crop', // eggs
    'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&q=80&auto=format&fit=crop', // milk pour
  ],
  Bakery: [
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80&auto=format&fit=crop', // white bread
    'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=600&q=80&auto=format&fit=crop', // brown bread
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80&auto=format&fit=crop', // burger buns
    'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=600&q=80&auto=format&fit=crop', // dinner rolls
  ],
  Produce: [
    'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600&q=80&auto=format&fit=crop', // apples
    'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&q=80&auto=format&fit=crop', // bananas
    'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=600&q=80&auto=format&fit=crop', // tomatoes
    'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=80&auto=format&fit=crop', // onions
    'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=80&auto=format&fit=crop', // potatoes (using onions photo as fallback)
    'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=600&q=80&auto=format&fit=crop', // carrots
  ],
  Pantry: [
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80&auto=format&fit=crop', // rice
    'https://images.unsplash.com/photo-1581700515891-00f5ac4316e5?w=600&q=80&auto=format&fit=crop', // sugar
    'https://images.unsplash.com/photo-1518110925475-8db1bd9c5d9d?w=600&q=80&auto=format&fit=crop', // salt
    'https://images.unsplash.com/photo-1574484184081-afea8a62f9b3?w=600&q=80&auto=format&fit=crop', // flour
    'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=600&q=80&auto=format&fit=crop', // pasta
    'https://images.unsplash.com/photo-1599909533829-7f51def40ee5?w=600&q=80&auto=format&fit=crop', // lentils / legumes
    'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80&auto=format&fit=crop', // cooking oil
  ],
  Snacks: [
    'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&q=80&auto=format&fit=crop', // chips
    'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&q=80&auto=format&fit=crop', // cookies
    'https://images.unsplash.com/photo-1481391032119-d89fee407e44?w=600&q=80&auto=format&fit=crop', // chocolate bar
    'https://images.unsplash.com/photo-1559054663-e8d23213f55c?w=600&q=80&auto=format&fit=crop', // crackers
    'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&q=80&auto=format&fit=crop', // mixed nuts
  ],
  Frozen: [
    'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80&auto=format&fit=crop', // frozen chicken / poultry
    'https://images.unsplash.com/photo-1535473895227-bdecb20fb157?w=600&q=80&auto=format&fit=crop', // fish fillet
    'https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=600&q=80&auto=format&fit=crop', // ice cream
  ],
  Household: [
    'https://images.unsplash.com/photo-1583947214955-a6e51d23ba70?w=600&q=80&auto=format&fit=crop', // dish soap / cleaning
    'https://images.unsplash.com/photo-1582735689669-fa5a4d8a0eb6?w=600&q=80&auto=format&fit=crop', // laundry detergent
    'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=600&q=80&auto=format&fit=crop', // toilet paper rolls
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80&auto=format&fit=crop', // floor cleaner / mop
  ],
  'Personal Care': [
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80&auto=format&fit=crop', // shampoo bottles
    'https://images.unsplash.com/photo-1571781565635-f7c01b8d9a93?w=600&q=80&auto=format&fit=crop', // soap bar
    'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=600&q=80&auto=format&fit=crop', // toothpaste
    'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80&auto=format&fit=crop', // toothbrush
  ],
};

/**
 * Returns the curated source URL for a product's category at a given index.
 * Round-robins through the available URLs for that category. Falls back to
 * `null` when the category isn't covered, so the seed can decide whether to
 * leave `imageUrl` empty.
 */
export function pickSeedImageUrl(
  category: string,
  indexInCategory: number,
): string | null {
  const list = SEED_PRODUCT_IMAGES[category];
  if (!list || list.length === 0) return null;
  return list[indexInCategory % list.length];
}
