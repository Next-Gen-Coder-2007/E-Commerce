export const TAXONOMY_CATEGORIES = [
  {
    id: 'fashion',
    name: 'Fashion',
    subcategories: ["Men's", "Women's", 'Kids', 'Ethnic', 'Sportswear'],
    attributes: ['Size', 'Color', 'Material', 'Fit', 'Pattern'],
    desc: 'Designer apparel, seasonal collections, traditional ethnic wear & casuals',
  },
  {
    id: 'footwear',
    name: 'Footwear',
    subcategories: ['Sneakers', 'Running', 'Formal', 'Sandals', 'Boots'],
    attributes: ['Size', 'Color', 'Material', 'Sole'],
    desc: 'Athletic runners, handcrafted formal shoes, boots & casual lifestyle kicks',
  },
  {
    id: 'mobiles',
    name: 'Mobiles',
    subcategories: ['Smartphones', 'Feature Phones', 'Tablets'],
    attributes: ['RAM', 'Storage', 'Color', 'Processor'],
    desc: 'Next-gen 5G flagship smartphones, durable feature phones & multi-tasking tablets',
  },
  {
    id: 'laptops-computers',
    name: 'Laptops & Computers',
    subcategories: ['Laptops', 'Desktops', 'Mini PCs'],
    attributes: ['CPU', 'RAM', 'Storage', 'GPU', 'Display'],
    desc: 'High-performance workstations, OLED creator laptops & compact desktop rigs',
  },
  {
    id: 'electronics',
    name: 'Electronics',
    subcategories: ['Headphones', 'Earbuds', 'Speakers', 'Cameras'],
    attributes: ['Color', 'Connectivity', 'Battery', 'Specs'],
    desc: 'Studio reference monitors, ANC wireless earbuds, Bluetooth soundbars & 4K cameras',
  },
  {
    id: 'tv-entertainment',
    name: 'TV & Home Entertainment',
    subcategories: ['TVs', 'Projectors', 'Streaming Devices'],
    attributes: ['Size', 'Resolution', 'Panel', 'Refresh Rate'],
    desc: 'OLED 4K/8K smart screens, cinematic ultra-short throw projectors & streaming sticks',
  },
  {
    id: 'computer-accessories',
    name: 'Computer Accessories',
    subcategories: ['Keyboard', 'Mouse', 'Monitor', 'Webcam', 'SSD'],
    attributes: ['Size', 'Connection', 'Switch Type', 'Storage'],
    desc: 'Hot-swap mechanical keyboards, ergonomic mice, 4K monitors & high-speed NVMe storage',
  },
  {
    id: 'smart-devices',
    name: 'Smart Devices',
    subcategories: ['Smartwatch', 'Smart Band', 'Smart Home'],
    attributes: ['Color', 'Size', 'Connectivity', 'Features'],
    desc: 'Fitness trackers, biometric smartwatches, smart hubs & automated home sensors',
  },
  {
    id: 'home-furniture',
    name: 'Home & Furniture',
    subcategories: ['Sofa', 'Bed', 'Table', 'Chair', 'Storage'],
    attributes: ['Dimensions', 'Material', 'Color'],
    desc: 'Contemporary modular sofas, hardwood beds, ergonomic desk chairs & storage units',
  },
  {
    id: 'home-appliances',
    name: 'Home Appliances',
    subcategories: ['AC', 'Refrigerator', 'Washing Machine', 'Microwave'],
    attributes: ['Capacity', 'Energy Rating', 'Color'],
    desc: 'Energy-star inverter air conditioners, multi-door refrigerators & smart washers',
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    subcategories: ['Cookware', 'Mixer', 'Air Fryer', 'Coffee Maker'],
    attributes: ['Capacity', 'Material', 'Power'],
    desc: 'Cast iron cookware, espresso machines, digital air fryers & high-torque blenders',
  },
  {
    id: 'beauty-personal-care',
    name: 'Beauty & Personal Care',
    subcategories: ['Skincare', 'Makeup', 'Haircare', 'Grooming'],
    attributes: ['Shade', 'Size', 'Skin Type', 'Volume'],
    desc: 'Clean dermatology formulas, hydrating serums, salon haircare & precision groomers',
  },
  {
    id: 'jewellery-accessories',
    name: 'Jewellery & Accessories',
    subcategories: ['Rings', 'Necklaces', 'Watches', 'Sunglasses'],
    attributes: ['Size', 'Material', 'Color', 'Design'],
    desc: 'Fine handcrafted jewellery, luxury analog watches, polarized eyewear & leather goods',
  },
  {
    id: 'sports-fitness',
    name: 'Sports & Fitness',
    subcategories: ['Cricket', 'Football', 'Gym', 'Cycling'],
    attributes: ['Size', 'Weight', 'Material', 'Color'],
    desc: 'Pro sports equipment, home gym free weights, resistance kits & road cycles',
  },
  {
    id: 'toys-games',
    name: 'Toys & Games',
    subcategories: ['Action Figures', 'Board Games', 'RC', 'Educational'],
    attributes: ['Age', 'Size', 'Edition', 'Color'],
    desc: 'Collectible scale figures, family strategy board games, RC drones & STEM learning kits',
  },
  {
    id: 'books-stationery',
    name: 'Books & Stationery',
    subcategories: ['Books', 'Notebooks', 'Pens', 'Art Supplies'],
    attributes: ['Format', 'Language', 'Size', 'Pack'],
    desc: 'Bestselling fiction and non-fiction, archival journals, fountain pens & artists palettes',
  },
  {
    id: 'automotive',
    name: 'Automotive',
    subcategories: ['Car Accessories', 'Bike Accessories', 'Tools'],
    attributes: ['Vehicle Compatibility', 'Size', 'Material'],
    desc: 'Smart dashcams, riding helmets, automotive detailers & diagnostic scan tools',
  },
  {
    id: 'pet-supplies',
    name: 'Pet Supplies',
    subcategories: ['Food Accessories', 'Toys', 'Beds', 'Grooming'],
    attributes: ['Size', 'Material', 'Breed/Animal'],
    desc: 'Nutritious feeds, orthopedic dog beds, interactive cat toys & grooming clippers',
  },
  {
    id: 'baby-products',
    name: 'Baby Products',
    subcategories: ['Clothes', 'Toys', 'Strollers', 'Baby Care'],
    attributes: ['Age', 'Size', 'Color', 'Material'],
    desc: 'Hypoallergenic infant apparel, modular lightweight strollers & gentle baby cosmetics',
  },
  {
    id: 'travel-luggage',
    name: 'Travel & Luggage',
    subcategories: ['Suitcases', 'Backpacks', 'Travel Accessories'],
    attributes: ['Size', 'Capacity', 'Material', 'Color'],
    desc: 'Polycarbonate hardshell spinners, technical trekking backpacks & packing organizers',
  },
  {
    id: 'office-supplies',
    name: 'Office Supplies',
    subcategories: ['Chairs', 'Desks', 'Printers', 'Accessories'],
    attributes: ['Size', 'Material', 'Compatibility'],
    desc: 'Executive standing desks, wireless laser printers, document organizers & desk pads',
  },
  {
    id: 'tools-hardware',
    name: 'Tools & Hardware',
    subcategories: ['Power Tools', 'Hand Tools', 'Electrical'],
    attributes: ['Voltage', 'Size', 'Power', 'Material'],
    desc: 'Brushless cordless drills, socket sets, laser distance meters & industrial hardware',
  },
  {
    id: 'garden-outdoor',
    name: 'Garden & Outdoor',
    subcategories: ['Gardening Tools', 'Furniture', 'Outdoor Gear'],
    attributes: ['Size', 'Material', 'Capacity'],
    desc: 'Weatherproof patio sets, ergonomic pruning shears, camping tents & solar garden lamps',
  },
  {
    id: 'musical-instruments',
    name: 'Musical Instruments',
    subcategories: ['Guitar', 'Keyboard', 'Drums', 'Accessories'],
    attributes: ['Size', 'Material', 'Type', 'Finish'],
    desc: 'Acoustic & electric guitars, 88-key weighted digital pianos, drum kits & studio gear',
  },
];

const TAXONOMY_MAP = new Map();
TAXONOMY_CATEGORIES.forEach((c) => {
  TAXONOMY_MAP.set(c.id.toLowerCase(), c);
  TAXONOMY_MAP.set(c.name.toLowerCase(), c);
});

TAXONOMY_MAP.set('smartphones', TAXONOMY_MAP.get('mobiles'));
TAXONOMY_MAP.set('laptops', TAXONOMY_MAP.get('laptops-computers'));
TAXONOMY_MAP.set('audio', TAXONOMY_MAP.get('electronics'));
TAXONOMY_MAP.set('home', TAXONOMY_MAP.get('home-furniture'));
TAXONOMY_MAP.set('beauty', TAXONOMY_MAP.get('beauty-personal-care'));
TAXONOMY_MAP.set('sports', TAXONOMY_MAP.get('sports-fitness'));

export const getTaxonomyCategory = (slugOrName) => {
  if (!slugOrName) return null;
  return TAXONOMY_MAP.get(String(slugOrName).trim().toLowerCase()) || null;
};

export const VALID_CATEGORY_IDS = new Set(TAXONOMY_CATEGORIES.map((c) => c.id));

export const validateCategoryAndSubcategory = (category, subcategory) => {
  if (!category || typeof category !== 'string') {
    return { valid: false, message: 'Please provide a valid product category.' };
  }

  const catObj = getTaxonomyCategory(category);
  if (!catObj) {
    return {
      valid: false,
      message: `Invalid category "${category}". Only the 24 authorized marketplace categories are permitted: ${TAXONOMY_CATEGORIES.map((c) => c.name).join(', ')}.`,
    };
  }

  if (subcategory && typeof subcategory === 'string' && subcategory.trim()) {
    const cleanSub = subcategory.trim();
    const matchesSub = catObj.subcategories.some(
      (s) => s.toLowerCase() === cleanSub.toLowerCase()
    );
    if (!matchesSub) {
      return {
        valid: false,
        message: `Invalid subcategory "${cleanSub}" for ${catObj.name}. Permitted subcategories: ${catObj.subcategories.join(', ')}.`,
      };
    }
  }

  return { valid: true, canonicalCategory: catObj.id };
};
