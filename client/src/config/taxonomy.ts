import {
  Shirt,
  Footprints,
  Smartphone,
  Laptop,
  Headphones,
  Tv,
  Keyboard,
  Watch,
  Sofa,
  Refrigerator,
  Utensils,
  Sparkles,
  Gem,
  Dumbbell,
  Gamepad2,
  BookOpen,
  Car,
  Dog,
  Baby,
  Luggage,
  Briefcase,
  Wrench,
  Trees,
  Music,
  LucideIcon,
} from 'lucide-react';

export interface TaxonomyCategory {
  id: string;
  name: string;
  subcategories: string[];
  attributes: string[];
  icon: LucideIcon;
  desc: string;
  img: string;
}

export const TAXONOMY_CATEGORIES: TaxonomyCategory[] = [
  {
    id: 'fashion',
    name: 'Fashion',
    subcategories: ["Men's", "Women's", 'Kids', 'Ethnic', 'Sportswear'],
    attributes: ['Size', 'Color', 'Material', 'Fit', 'Pattern'],
    icon: Shirt,
    desc: 'Designer apparel, seasonal collections, traditional ethnic wear & casuals',
    img: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80',
  },
  {
    id: 'footwear',
    name: 'Footwear',
    subcategories: ['Sneakers', 'Running', 'Formal', 'Sandals', 'Boots'],
    attributes: ['Size', 'Color', 'Material', 'Sole'],
    icon: Footprints,
    desc: 'Athletic runners, handcrafted formal shoes, boots & casual lifestyle kicks',
    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
  },
  {
    id: 'mobiles',
    name: 'Mobiles',
    subcategories: ['Smartphones', 'Feature Phones', 'Tablets'],
    attributes: ['RAM', 'Storage', 'Color', 'Processor'],
    icon: Smartphone,
    desc: 'Next-gen 5G flagship smartphones, durable feature phones & multi-tasking tablets',
    img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
  },
  {
    id: 'laptops-computers',
    name: 'Laptops & Computers',
    subcategories: ['Laptops', 'Desktops', 'Mini PCs'],
    attributes: ['CPU', 'RAM', 'Storage', 'GPU', 'Display'],
    icon: Laptop,
    desc: 'High-performance workstations, OLED creator laptops & compact desktop rigs',
    img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80',
  },
  {
    id: 'electronics',
    name: 'Electronics',
    subcategories: ['Headphones', 'Earbuds', 'Speakers', 'Cameras'],
    attributes: ['Color', 'Connectivity', 'Battery', 'Specs'],
    icon: Headphones,
    desc: 'Studio reference monitors, ANC wireless earbuds, Bluetooth soundbars & 4K cameras',
    img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
  },
  {
    id: 'tv-entertainment',
    name: 'TV & Home Entertainment',
    subcategories: ['TVs', 'Projectors', 'Streaming Devices'],
    attributes: ['Size', 'Resolution', 'Panel', 'Refresh Rate'],
    icon: Tv,
    desc: 'OLED 4K/8K smart screens, cinematic ultra-short throw projectors & streaming sticks',
    img: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&q=80',
  },
  {
    id: 'computer-accessories',
    name: 'Computer Accessories',
    subcategories: ['Keyboard', 'Mouse', 'Monitor', 'Webcam', 'SSD'],
    attributes: ['Size', 'Connection', 'Switch Type', 'Storage'],
    icon: Keyboard,
    desc: 'Hot-swap mechanical keyboards, ergonomic mice, 4K monitors & high-speed NVMe storage',
    img: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80',
  },
  {
    id: 'smart-devices',
    name: 'Smart Devices',
    subcategories: ['Smartwatch', 'Smart Band', 'Smart Home'],
    attributes: ['Color', 'Size', 'Connectivity', 'Features'],
    icon: Watch,
    desc: 'Fitness trackers, biometric smartwatches, smart hubs & automated home sensors',
    img: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&q=80',
  },
  {
    id: 'home-furniture',
    name: 'Home & Furniture',
    subcategories: ['Sofa', 'Bed', 'Table', 'Chair', 'Storage'],
    attributes: ['Dimensions', 'Material', 'Color'],
    icon: Sofa,
    desc: 'Contemporary modular sofas, hardwood beds, ergonomic desk chairs & storage units',
    img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
  },
  {
    id: 'home-appliances',
    name: 'Home Appliances',
    subcategories: ['AC', 'Refrigerator', 'Washing Machine', 'Microwave'],
    attributes: ['Capacity', 'Energy Rating', 'Color'],
    icon: Refrigerator,
    desc: 'Energy-star inverter air conditioners, multi-door refrigerators & smart washers',
    img: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&q=80',
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    subcategories: ['Cookware', 'Mixer', 'Air Fryer', 'Coffee Maker'],
    attributes: ['Capacity', 'Material', 'Power'],
    icon: Utensils,
    desc: 'Cast iron cookware, espresso machines, digital air fryers & high-torque blenders',
    img: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&q=80',
  },
  {
    id: 'beauty-personal-care',
    name: 'Beauty & Personal Care',
    subcategories: ['Skincare', 'Makeup', 'Haircare', 'Grooming'],
    attributes: ['Shade', 'Size', 'Skin Type', 'Volume'],
    icon: Sparkles,
    desc: 'Clean dermatology formulas, hydrating serums, salon haircare & precision groomers',
    img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80',
  },
  {
    id: 'jewellery-accessories',
    name: 'Jewellery & Accessories',
    subcategories: ['Rings', 'Necklaces', 'Watches', 'Sunglasses'],
    attributes: ['Size', 'Material', 'Color', 'Design'],
    icon: Gem,
    desc: 'Fine handcrafted jewellery, luxury analog watches, polarized eyewear & leather goods',
    img: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80',
  },
  {
    id: 'sports-fitness',
    name: 'Sports & Fitness',
    subcategories: ['Cricket', 'Football', 'Gym', 'Cycling'],
    attributes: ['Size', 'Weight', 'Material', 'Color'],
    icon: Dumbbell,
    desc: 'Pro sports equipment, home gym free weights, resistance kits & road cycles',
    img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&q=80',
  },
  {
    id: 'toys-games',
    name: 'Toys & Games',
    subcategories: ['Action Figures', 'Board Games', 'RC', 'Educational'],
    attributes: ['Age', 'Size', 'Edition', 'Color'],
    icon: Gamepad2,
    desc: 'Collectible scale figures, family strategy board games, RC drones & STEM learning kits',
    img: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&q=80',
  },
  {
    id: 'books-stationery',
    name: 'Books & Stationery',
    subcategories: ['Books', 'Notebooks', 'Pens', 'Art Supplies'],
    attributes: ['Format', 'Language', 'Size', 'Pack'],
    icon: BookOpen,
    desc: 'Bestselling fiction and non-fiction, archival journals, fountain pens & artists palettes',
    img: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&q=80',
  },
  {
    id: 'automotive',
    name: 'Automotive',
    subcategories: ['Car Accessories', 'Bike Accessories', 'Tools'],
    attributes: ['Vehicle Compatibility', 'Size', 'Material'],
    icon: Car,
    desc: 'Smart dashcams, riding helmets, automotive detailers & diagnostic scan tools',
    img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80',
  },
  {
    id: 'pet-supplies',
    name: 'Pet Supplies',
    subcategories: ['Food Accessories', 'Toys', 'Beds', 'Grooming'],
    attributes: ['Size', 'Material', 'Breed/Animal'],
    icon: Dog,
    desc: 'Nutritious feeds, orthopedic dog beds, interactive cat toys & grooming clippers',
    img: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&q=80',
  },
  {
    id: 'baby-products',
    name: 'Baby Products',
    subcategories: ['Clothes', 'Toys', 'Strollers', 'Baby Care'],
    attributes: ['Age', 'Size', 'Color', 'Material'],
    icon: Baby,
    desc: 'Hypoallergenic infant apparel, modular lightweight strollers & gentle baby cosmetics',
    img: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80',
  },
  {
    id: 'travel-luggage',
    name: 'Travel & Luggage',
    subcategories: ['Suitcases', 'Backpacks', 'Travel Accessories'],
    attributes: ['Size', 'Capacity', 'Material', 'Color'],
    icon: Luggage,
    desc: 'Polycarbonate hardshell spinners, technical trekking backpacks & packing organizers',
    img: 'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=600&q=80',
  },
  {
    id: 'office-supplies',
    name: 'Office Supplies',
    subcategories: ['Chairs', 'Desks', 'Printers', 'Accessories'],
    attributes: ['Size', 'Material', 'Compatibility'],
    icon: Briefcase,
    desc: 'Executive standing desks, wireless laser printers, document organizers & desk pads',
    img: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&q=80',
  },
  {
    id: 'tools-hardware',
    name: 'Tools & Hardware',
    subcategories: ['Power Tools', 'Hand Tools', 'Electrical'],
    attributes: ['Voltage', 'Size', 'Power', 'Material'],
    icon: Wrench,
    desc: 'Brushless cordless drills, socket sets, laser distance meters & industrial hardware',
    img: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=600&q=80',
  },
  {
    id: 'garden-outdoor',
    name: 'Garden & Outdoor',
    subcategories: ['Gardening Tools', 'Furniture', 'Outdoor Gear'],
    attributes: ['Size', 'Material', 'Capacity'],
    icon: Trees,
    desc: 'Weatherproof patio sets, ergonomic pruning shears, camping tents & solar garden lamps',
    img: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80',
  },
  {
    id: 'musical-instruments',
    name: 'Musical Instruments',
    subcategories: ['Guitar', 'Keyboard', 'Drums', 'Accessories'],
    attributes: ['Size', 'Material', 'Type', 'Finish'],
    icon: Music,
    desc: 'Acoustic & electric guitars, 88-key weighted digital pianos, drum kits & studio gear',
    img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
  },
];

// Map of category slug or aliases to the category object
const TAXONOMY_MAP = new Map<string, TaxonomyCategory>();
TAXONOMY_CATEGORIES.forEach((cat) => {
  TAXONOMY_MAP.set(cat.id.toLowerCase(), cat);
  TAXONOMY_MAP.set(cat.name.toLowerCase(), cat);
});

// Legacy category alias mappings
TAXONOMY_MAP.set('smartphones', TAXONOMY_CATEGORIES.find((c) => c.id === 'mobiles')!);
TAXONOMY_MAP.set('laptops', TAXONOMY_CATEGORIES.find((c) => c.id === 'laptops-computers')!);
TAXONOMY_MAP.set('audio', TAXONOMY_CATEGORIES.find((c) => c.id === 'electronics')!);
TAXONOMY_MAP.set('home', TAXONOMY_CATEGORIES.find((c) => c.id === 'home-furniture')!);
TAXONOMY_MAP.set('beauty', TAXONOMY_CATEGORIES.find((c) => c.id === 'beauty-personal-care')!);
TAXONOMY_MAP.set('sports', TAXONOMY_CATEGORIES.find((c) => c.id === 'sports-fitness')!);

export const getTaxonomyCategory = (categoryIdOrSlug?: string): TaxonomyCategory | undefined => {
  if (!categoryIdOrSlug) return undefined;
  return TAXONOMY_MAP.get(categoryIdOrSlug.trim().toLowerCase());
};

export const getSubcategoriesForCategory = (categoryIdOrSlug?: string): string[] => {
  const cat = getTaxonomyCategory(categoryIdOrSlug);
  return cat ? cat.subcategories : [];
};

export const getAttributesForCategory = (categoryIdOrSlug?: string): string[] => {
  const cat = getTaxonomyCategory(categoryIdOrSlug);
  return cat ? cat.attributes : [];
};

export const VALID_CATEGORY_IDS = new Set<string>(TAXONOMY_CATEGORIES.map((c) => c.id));


