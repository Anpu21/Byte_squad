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
    'https://images.unsplash.com/photo-1534260164206-2a3a4a72891d?w=600&q=80&auto=format&fit=crop', // soda bottle
    'https://images.unsplash.com/photo-1622543925917-bd9e34ee9e6f?w=600&q=80&auto=format&fit=crop', // cola cans
    'https://images.unsplash.com/photo-1635232481590-00102ef8e77a?w=600&q=80&auto=format&fit=crop', // lemon-lime soda / lemonade
    'https://images.unsplash.com/photo-1587015990127-424b954e38b5?w=600&q=80&auto=format&fit=crop', // orange juice
    'https://images.unsplash.com/photo-1550505095-81378a674395?w=600&q=80&auto=format&fit=crop', // bottled water
    'https://images.unsplash.com/photo-1628153792464-21bffac488d4?w=600&q=80&auto=format&fit=crop', // tea leaves
    'https://images.unsplash.com/photo-1554600740-951beab4712b?w=600&q=80&auto=format&fit=crop', // coffee
  ],
  Dairy: [
    'https://images.unsplash.com/photo-1635436338433-89747d0ca0ef?w=600&q=80&auto=format&fit=crop', // milk bottle
    'https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=600&q=80&auto=format&fit=crop', // yogurt
    'https://images.unsplash.com/photo-1757857755423-3412736d1236?w=600&q=80&auto=format&fit=crop', // cheese block
    'https://images.unsplash.com/photo-1603596310923-dbb12732f9c7?w=600&q=80&auto=format&fit=crop', // butter
    'https://images.unsplash.com/photo-1498654077810-12c21d4d6dc3?w=600&q=80&auto=format&fit=crop', // eggs
    'https://images.unsplash.com/photo-1695694381035-e939e7d90f87?w=600&q=80&auto=format&fit=crop', // milk pour
  ],
  Bakery: [
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80&auto=format&fit=crop', // white bread
    'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=600&q=80&auto=format&fit=crop', // brown bread
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80&auto=format&fit=crop', // burger buns
    'https://images.unsplash.com/photo-1671036437036-0b1f11c80941?w=600&q=80&auto=format&fit=crop', // dinner rolls
  ],
  Produce: [
    'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600&q=80&auto=format&fit=crop', // apples
    'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&q=80&auto=format&fit=crop', // bananas
    'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=600&q=80&auto=format&fit=crop', // tomatoes
    'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=600&q=80&auto=format&fit=crop', // onions
    'https://images.unsplash.com/photo-1508313880080-c4bef0730395?w=600&q=80&auto=format&fit=crop', // potatoes
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
    'https://images.unsplash.com/photo-1647577746559-c9a28c0d0870?w=600&q=80&auto=format&fit=crop', // dish soap
    'https://images.unsplash.com/photo-1624372635310-01d078c05dd9?w=600&q=80&auto=format&fit=crop', // laundry detergent
    'https://images.unsplash.com/photo-1585690359409-9020f3602bdb?w=600&q=80&auto=format&fit=crop', // toilet paper rolls
    'https://images.unsplash.com/photo-1689127903369-aef916b0c40d?w=600&q=80&auto=format&fit=crop', // floor cleaner / mop
  ],
  'Personal Care': [
    'https://images.unsplash.com/photo-1747098393451-6b985f62a2c2?w=600&q=80&auto=format&fit=crop', // shampoo bottles
    'https://images.unsplash.com/photo-1571781565635-f7c01b8d9a93?w=600&q=80&auto=format&fit=crop', // soap bar
    'https://images.unsplash.com/photo-1610216690558-4aee861f4ab3?w=600&q=80&auto=format&fit=crop', // toothpaste, // toothpaste
    'https://images.unsplash.com/photo-1625834319124-345137437603?w=600&q=80&auto=format&fit=crop', // toothbrush
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