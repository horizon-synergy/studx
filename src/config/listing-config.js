export const PRICING_MODELS = [
  { value: 'once_off', label: 'Once-off price' }, { value: 'hourly', label: 'Per hour' },
  { value: 'daily', label: 'Per day' }, { value: 'negotiable', label: 'Negotiable' },
]
export const CONDITIONS = [
  { value: 'new', label: 'New — unused, sealed' }, { value: 'like_new', label: 'Like new — barely used' },
  { value: 'good', label: 'Good — minor wear' }, { value: 'fair', label: 'Fair — visible wear, fully functional' },
  { value: 'poor', label: 'Poor — heavy wear, still works' },
]
export const DELIVERY_METHODS = [
  { value: 'in_person', label: 'In person / on campus' }, { value: 'online', label: 'Online / remote' }, { value: 'both', label: 'Both' },
]
export const PRODUCT_SUBCATEGORIES = [
  { value: 'textbook', label: '📚 Textbook / Course material' }, { value: 'electronics', label: '💻 Electronics & Gadgets' },
  { value: 'clothing', label: '👕 Clothing & Accessories' }, { value: 'furniture', label: '🪑 Furniture & Décor' },
  { value: 'stationery', label: '✏️ Stationery & Supplies' }, { value: 'sports', label: '⚽ Sports & Fitness' },
  { value: 'food', label: '🍱 Food & Groceries' }, { value: 'transport', label: '🛴 Transport & Mobility' },
  { value: 'other_product', label: '📦 Other Product' },
]
export const SERVICE_SUBCATEGORIES = [
  { value: 'tutoring', label: '🎓 Tutoring & Academic Help' }, { value: 'design', label: '🎨 Graphic Design & Branding' },
  { value: 'photography', label: '📷 Photography & Videography' }, { value: 'writing', label: '✍️ Writing & Editing' },
  { value: 'coding', label: '💻 Coding & Tech' }, { value: 'delivery', label: '🚚 Delivery & Errands' },
  { value: 'cleaning', label: '🧹 Cleaning & Home Help' }, { value: 'hair_beauty', label: '💇 Hair & Beauty' },
  { value: 'music_arts', label: '🎵 Music & Arts' }, { value: 'other_service', label: '🛠 Other Service' },
]
export const SPEC_FIELDS = {
  textbook: [
    { key: 'subject', label: 'Subject / Module', type: 'text', placeholder: 'e.g. Financial Accounting 101' },
    { key: 'author', label: 'Author(s)', type: 'text', placeholder: 'e.g. Warren Buffett' },
    { key: 'edition', label: 'Edition', type: 'text', placeholder: 'e.g. 3rd Edition' },
    { key: 'isbn', label: 'ISBN (optional)', type: 'text', placeholder: 'e.g. 978-3-16-148410-0' },
    { key: 'condition', label: 'Condition', type: 'select', options: CONDITIONS },
    { key: 'notes', label: 'Additional notes', type: 'text', placeholder: 'e.g. Highlighting in chapter 3' },
  ],
  electronics: [
    { key: 'brand', label: 'Brand', type: 'text', placeholder: 'e.g. Apple, Samsung' },
    { key: 'model', label: 'Model', type: 'text', placeholder: 'e.g. MacBook Air M2' },
    { key: 'colour', label: 'Colour', type: 'text', placeholder: 'e.g. Space Grey' },
    { key: 'storage', label: 'Storage / Specs', type: 'text', placeholder: 'e.g. 256GB SSD, 8GB RAM' },
    { key: 'condition', label: 'Condition', type: 'select', options: CONDITIONS },
    { key: 'includes', label: "What's included", type: 'text', placeholder: 'e.g. Original box, charger, case' },
  ],
  clothing: [
    { key: 'brand', label: 'Brand', type: 'text', placeholder: 'e.g. Nike, Zara' },
    { key: 'size', label: 'Size', type: 'text', placeholder: 'e.g. M, 32, 9 UK' },
    { key: 'colour', label: 'Colour', type: 'text', placeholder: 'e.g. Navy Blue' },
    { key: 'gender', label: 'Gender fit', type: 'select', options: [{ value: 'mens', label: "Men's" }, { value: 'womens', label: "Women's" }, { value: 'unisex', label: 'Unisex' }, { value: 'kids', label: 'Kids' }] },
    { key: 'condition', label: 'Condition', type: 'select', options: CONDITIONS },
  ],
  furniture: [
    { key: 'dimensions', label: 'Dimensions (L × W × H)', type: 'text', placeholder: 'e.g. 120cm × 60cm × 75cm' },
    { key: 'material', label: 'Material', type: 'text', placeholder: 'e.g. Solid wood, MDF' },
    { key: 'colour', label: 'Colour', type: 'text', placeholder: 'e.g. White' },
    { key: 'weight', label: 'Weight (kg)', type: 'number', placeholder: 'e.g. 15' },
    { key: 'condition', label: 'Condition', type: 'select', options: CONDITIONS },
    { key: 'assembly', label: 'Assembly required', type: 'select', options: [{ value: 'no', label: 'No — ready to use' }, { value: 'yes', label: 'Yes — some assembly needed' }] },
  ],
  stationery: [
    { key: 'brand', label: 'Brand', type: 'text', placeholder: 'e.g. Staedtler' },
    { key: 'quantity', label: 'Quantity / Pack size', type: 'text', placeholder: 'e.g. Set of 12' },
    { key: 'condition', label: 'Condition', type: 'select', options: CONDITIONS },
  ],
  sports: [
    { key: 'brand', label: 'Brand', type: 'text', placeholder: 'e.g. Adidas' },
    { key: 'size', label: 'Size', type: 'text', placeholder: 'e.g. Size 5 ball' },
    { key: 'colour', label: 'Colour', type: 'text', placeholder: 'e.g. Black / White' },
    { key: 'condition', label: 'Condition', type: 'select', options: CONDITIONS },
  ],
  food: [
    { key: 'quantity', label: 'Quantity / Portion size', type: 'text', placeholder: 'e.g. 500g, feeds 4' },
    { key: 'allergens', label: 'Allergens', type: 'text', placeholder: 'e.g. Contains nuts, gluten-free' },
    { key: 'expiry', label: 'Best before / Expiry', type: 'text', placeholder: 'e.g. 2025-08-01' },
  ],
  transport: [
    { key: 'type', label: 'Type', type: 'select', options: [{ value: 'bicycle', label: 'Bicycle' }, { value: 'scooter', label: 'Scooter / E-scooter' }, { value: 'skateboard', label: 'Skateboard' }, { value: 'other', label: 'Other' }] },
    { key: 'brand', label: 'Brand', type: 'text', placeholder: 'e.g. Giant, Xiaomi' },
    { key: 'colour', label: 'Colour', type: 'text', placeholder: '' },
    { key: 'condition', label: 'Condition', type: 'select', options: CONDITIONS },
  ],
  other_product: [
    { key: 'colour', label: 'Colour', type: 'text', placeholder: '' },
    { key: 'weight', label: 'Weight (kg)', type: 'number', placeholder: '' },
    { key: 'dimensions', label: 'Dimensions', type: 'text', placeholder: 'e.g. 30cm × 20cm × 10cm' },
    { key: 'condition', label: 'Condition', type: 'select', options: CONDITIONS },
  ],
  tutoring: [
    { key: 'subject', label: 'Subject / Module', type: 'text', placeholder: 'e.g. Calculus, Accounting' },
    { key: 'level', label: 'Academic level', type: 'select', options: [{ value: 'high_school', label: 'High School' }, { value: 'first_year', label: 'First Year' }, { value: 'second_year', label: 'Second Year' }, { value: 'third_year', label: 'Third Year' }, { value: 'honours', label: 'Honours / Postgrad' }, { value: 'any', label: 'Any level' }] },
    { key: 'deliveryMethod', label: 'Session type', type: 'select', options: DELIVERY_METHODS },
    { key: 'availability', label: 'Availability', type: 'text', placeholder: 'e.g. Weekday evenings, Saturdays' },
    { key: 'qualification', label: 'Your qualification / year', type: 'text', placeholder: 'e.g. 3rd year BSc CS, 80% in module' },
  ],
  design: [
    { key: 'deliveryMethod', label: 'Delivery method', type: 'select', options: DELIVERY_METHODS },
    { key: 'turnaround', label: 'Turnaround time', type: 'text', placeholder: 'e.g. 2-3 business days' },
    { key: 'software', label: 'Software used', type: 'text', placeholder: 'e.g. Figma, Illustrator, Canva' },
    { key: 'portfolio', label: 'Portfolio link (optional)', type: 'text', placeholder: 'https://...' },
    { key: 'revisions', label: 'Revisions included', type: 'text', placeholder: 'e.g. 2 free revisions' },
  ],
  photography: [
    { key: 'deliveryMethod', label: 'Session type', type: 'select', options: DELIVERY_METHODS },
    { key: 'turnaround', label: 'Delivery turnaround', type: 'text', placeholder: 'e.g. 48 hours after shoot' },
    { key: 'equipment', label: 'Equipment', type: 'text', placeholder: 'e.g. Canon R6, DJI drone' },
    { key: 'edited', label: 'Photos delivered', type: 'select', options: [{ value: 'edited', label: 'Edited / retouched' }, { value: 'raw', label: 'RAW files only' }, { value: 'both', label: 'Both RAW and edited' }] },
    { key: 'portfolio', label: 'Portfolio link (optional)', type: 'text', placeholder: 'https://...' },
  ],
  writing: [
    { key: 'type', label: 'Writing type', type: 'select', options: [{ value: 'essay', label: 'Academic essay' }, { value: 'cv', label: 'CV / Resume' }, { value: 'editing', label: 'Proofreading / Editing' }, { value: 'report', label: 'Report' }, { value: 'creative', label: 'Creative writing' }, { value: 'other', label: 'Other' }] },
    { key: 'turnaround', label: 'Turnaround time', type: 'text', placeholder: 'e.g. 24 hours per 1000 words' },
    { key: 'deliveryMethod', label: 'Delivery method', type: 'select', options: DELIVERY_METHODS },
    { key: 'wordLimit', label: 'Word limit', type: 'text', placeholder: 'e.g. Up to 3000 words' },
  ],
  coding: [
    { key: 'languages', label: 'Languages / Frameworks', type: 'text', placeholder: 'e.g. Python, React, SQL' },
    { key: 'turnaround', label: 'Turnaround time', type: 'text', placeholder: 'e.g. 3-5 days per project' },
    { key: 'deliveryMethod', label: 'Collaboration method', type: 'select', options: DELIVERY_METHODS },
    { key: 'portfolio', label: 'GitHub / Portfolio', type: 'text', placeholder: 'https://github.com/...' },
  ],
  delivery: [
    { key: 'coverage', label: 'Coverage area', type: 'text', placeholder: 'e.g. Within campus, Braamfontein' },
    { key: 'vehicle', label: 'Transport method', type: 'select', options: [{ value: 'foot', label: 'On foot' }, { value: 'bicycle', label: 'Bicycle' }, { value: 'scooter', label: 'Scooter' }, { value: 'car', label: 'Car' }] },
    { key: 'availability', label: 'Availability', type: 'text', placeholder: 'e.g. Mon-Fri 8am-6pm' },
    { key: 'maxWeight', label: 'Max load (kg)', type: 'number', placeholder: 'e.g. 10' },
  ],
  cleaning: [
    { key: 'type', label: 'Cleaning type', type: 'select', options: [{ value: 'room', label: 'Room / Flat' }, { value: 'laundry', label: 'Laundry' }, { value: 'dishes', label: 'Dishes' }, { value: 'general', label: 'General cleaning' }] },
    { key: 'availability', label: 'Availability', type: 'text', placeholder: 'e.g. Weekends, flexible' },
    { key: 'supplies', label: 'Supplies', type: 'select', options: [{ value: 'own', label: 'I bring my own supplies' }, { value: 'client', label: 'Client provides supplies' }] },
  ],
  hair_beauty: [
    { key: 'specialty', label: 'Specialty', type: 'text', placeholder: 'e.g. Box braids, locs, nails, makeup' },
    { key: 'deliveryMethod', label: 'Where', type: 'select', options: [{ value: 'my_place', label: 'At my place' }, { value: 'client_place', label: 'At your place' }, { value: 'both', label: 'Either' }] },
    { key: 'availability', label: 'Availability', type: 'text', placeholder: 'e.g. Weekends only' },
    { key: 'duration', label: 'Estimated duration', type: 'text', placeholder: 'e.g. 3-4 hours' },
  ],
  music_arts: [
    { key: 'type', label: 'Type', type: 'text', placeholder: 'e.g. Guitar lessons, beat making, drawing' },
    { key: 'deliveryMethod', label: 'Session type', type: 'select', options: DELIVERY_METHODS },
    { key: 'availability', label: 'Availability', type: 'text', placeholder: '' },
    { key: 'experience', label: 'Your experience', type: 'text', placeholder: 'e.g. 5 years playing guitar' },
  ],
  other_service: [
    { key: 'deliveryMethod', label: 'Delivery method', type: 'select', options: DELIVERY_METHODS },
    { key: 'availability', label: 'Availability', type: 'text', placeholder: '' },
    { key: 'turnaround', label: 'Turnaround / Duration', type: 'text', placeholder: '' },
  ],
}
export const ALLOWED_PRICING_MODELS = { product: ['once_off', 'negotiable'], service: ['once_off', 'hourly', 'daily', 'negotiable'] }
export function formatPrice(price, pricingModel) {
  const formatted = `R${Number(price).toFixed(2)}`
  switch (pricingModel) { case 'hourly': return `${formatted}/hr`; case 'daily': return `${formatted}/day`; case 'negotiable': return `From ${formatted}`; default: return formatted }
}
