require('dotenv').config({ path: 'C:/Users/Dell/Desktop/TheDripMap/.env.local', override: true });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const ID = '517a9b42-b6d2-413d-bab0-92e365fde614';

const payload = {
  description: "Refresh Med Spa LA offers professional aesthetic and wellness services in Woodland Hills. Founded by Dr. Kia Rowhanian and Nurse Fatima, the practice combines nearly two decades of medical expertise to provide IV therapy, BOTOX, dermal fillers, medical weight loss, hormone replacement, and advanced skin rejuvenation — with fully customized treatment plans, by appointment only.",
  specialties: [
    "IV Therapy",
    "IV Hydration",
    "Hangover Recovery",
    "Wellness Drips",
    "Medical Weight Loss",
    "BOTOX & Fillers",
    "Hormone Replacement Therapy",
    "Skin Rejuvenation",
    "Aesthetic Treatments",
  ],
  working_hours: {
    Monday:    "8:00 AM - 6:00 PM",
    Tuesday:   "8:00 AM - 6:00 PM",
    Wednesday: "8:00 AM - 6:00 PM",
    Thursday:  "8:00 AM - 6:00 PM",
    Friday:    "8:00 AM - 6:00 PM",
    Saturday:  "10:00 AM - 2:00 PM",
    Sunday:    "Closed",
    note: "By appointment only",
  },
  phone: "(818) 864-7546",
  address: "21021 Ventura Blvd, Suite 100-4, Woodland Hills, CA 91364",
  postal_code: "91364",
  city: "Los Angeles",
  state: "California",
  amenities: [
    "Medical Director on staff (Dr. Kia Rowhanian, MD)",
    "Registered Nurse on staff (Nurse Fatima)",
    "By appointment only",
    "Private treatment rooms",
    "Customized treatment plans",
  ],
  // Use team photo as hero — authentic to this specific clinic
  image_url: "https://refreshmedspala.com/wp-content/themes/ui-refresh/img/Refreshteam.jpg",
  imageUrl: "https://refreshmedspala.com/wp-content/themes/ui-refresh/img/Refreshteam.jpg",
  website: "https://www.refreshmedspala.com",
  price_range: "$$",
};

(async () => {
  const { data, error } = await s.from('providers')
    .update(payload)
    .eq('id', ID)
    .select('id, name, slug, is_featured, description, specialties, working_hours, phone, address, image_url, amenities, price_range');
  if (error) { console.error('UPDATE ERROR:', error); process.exit(1); }
  console.log('✓ Refresh Med Spa LA enriched:');
  console.log(JSON.stringify(data[0], null, 2));
})();
