import { Provider, BlogPost } from '../types';

export const MOCK_CITIES: { city: string, state: string, count: number }[] = [
  { city: 'New York', state: 'NY', count: 42 },
  { city: 'Los Angeles', state: 'CA', count: 38 },
  { city: 'Miami', state: 'FL', count: 25 },
  { city: 'Las Vegas', state: 'NV', count: 18 },
  { city: 'Austin', state: 'TX', count: 15 },
  { city: 'Chicago', state: 'IL', count: 22 },
  { city: 'San Francisco', state: 'CA', count: 12 },
  { city: 'San Diego', state: 'CA', count: 14 },
  { city: 'Dallas', state: 'TX', count: 16 },
  { city: 'Houston', state: 'TX', count: 19 },
  { city: 'Phoenix', state: 'AZ', count: 11 },
  { city: 'Philadelphia', state: 'PA', count: 9 }
];

export const MOCK_LISTINGS: Provider[] = [
  {
    id: '1',
    name: 'The Wellness Drip',
    city: 'New York',
    address: '123 Manhattan Ave, New York, NY 10001',
    rating: 4.9,
    reviewCount: 128,
    priceRange: '$$',
    type: 'Both',
    specialties: ['NAD+ Plus', 'Immune Support', 'Beauty Glow'],
    amenities: ['Private Rooms', 'Free WiFi', 'Beverages'],
    description: 'Premier IV therapy clinic in the heart of Manhattan offering customized wellness solutions.',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800',
    is_featured: true,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 5,
      speedOfService: 4,
      valueForMoney: 4
    }
  },
  {
    id: '2',
    name: 'LA Hydration Hub',
    city: 'Los Angeles',
    address: '456 Sunset Blvd, Los Angeles, CA 90028',
    rating: 4.8,
    reviewCount: 95,
    priceRange: '$$$',
    type: 'In-Clinic',
    specialties: ['Hangover', 'Recovery', 'Hydration'],
    amenities: ['Valet Parking', 'Luxury Lounge'],
    description: 'Hollywood\'s favorite hydration spot for quick recovery and performance boosts.',
    imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800',
    is_featured: true,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 4,
      speedOfService: 5,
      valueForMoney: 3
    }
  },
  {
    id: '3',
    name: 'Miami Glow IV',
    city: 'Miami',
    address: '789 Ocean Dr, Miami Beach, FL 33139',
    rating: 4.7,
    reviewCount: 210,
    priceRange: '$$',
    type: 'Mobile',
    specialties: ['Beauty Glow', 'Weight Loss', 'Hydration'],
    amenities: ['Mobile Service', 'Group Discounts'],
    description: 'Expert mobile IV therapy bringing the glow directly to your home or hotel.',
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800',
    is_featured: false,
    decisionDrivers: {
      medicalSupervision: true,
      luxuryExperience: 3,
      speedOfService: 4,
      valueForMoney: 5
    }
  }
];

export const MOCK_BLOG_POSTS: BlogPost[] = [
  {
    slug: 'science-of-iv-therapy-for-hangover-recovery',
    title: 'The Science of Hangover Recovery: Why IV Therapy is the Gold Standard',
    metaTitle: 'Hangover IV Therapy: Science, Benefits & Recovery Guide | TheDripMap',
    metaDescription: 'Struggling with a severe hangover? Learn the clinical science behind IV hydration, how it clears acetaldehyde, and why it outperforms oral rehydration.',
    category: 'Educational',
    content: `
# The Science of Hangover Recovery: Why IV Therapy is the Gold Standard

We’ve all experienced the "morning after" consequences of a celebration: the throbbing headache, debilitating nausea, and the feeling that your brain is wrapped in cotton. While folklore suggests "hair of the dog" or a greasy breakfast, clinical science points to a more complex physiological crisis: **acute dehydration, electrolyte imbalance, and toxic metabolic byproducts.**

In this guide, we explore why Intravenous (IV) therapy has moved from the ER to the mainstream as the most effective clinical intervention for hangover recovery.

## 1. The Acetaldehyde Problem
When you consume alcohol, your liver breaks it down into **acetaldehyde**—a compound estimated to be 30 times more toxic than alcohol itself. Acetaldehyde is responsible for the sweating, rapid heart rate, and nausea associated with hangovers. 

Standard oral hydration does nothing to neutralize this toxin. However, specialized IV drips often include **Glutathione**, the body’s "master antioxidant." Glutathione binds to acetaldehyde, converting it into a harmless substance that your kidneys can flush out, effectively "detoxing" your system at a cellular level.

## 2. Bioavailability: Bypassing the Irritated Gut
Alcohol is a gastrointestinal irritant. It inflames the stomach lining (gastritis) and slows down the absorption of fluids. This is why drinking a gallon of water often leads to bloating and further nausea rather than relief.

**IV therapy offers 100% bioavailability.** By delivering fluids directly into the venous system, you bypass the digestive tract entirely. This ensures that 100% of the saline, vitamins, and medications reach your cells instantly.

## 3. Restoring the Electrolyte Matrix
A hangover isn't just a lack of water; it’s a loss of critical minerals. Alcohol acts as a diuretic, causing the kidneys to excrete:
*   **Magnesium:** Essential for nerve function and reducing muscle tension (headaches).
*   **Potassium:** Critical for heart rhythm and cellular fluid balance.
*   **Sodium:** Necessary for maintaining blood pressure and cognitive function.

A clinical IV bag is typically a **Lactated Ringer’s** or **Normal Saline** solution, which is "isotonic"—meaning it matches the concentration of your blood perfectly, providing immediate stabilization.

## 4. The Role of Medical-Grade Additives
What truly sets a professional IV drip apart from a sports drink are the pharmaceutical-grade additives:
*   **Ondansetron (Zofran):** A powerful anti-emetic that blocks the signals in your brain that trigger nausea.
*   **Toradol (Ketorolac):** A non-narcotic anti-inflammatory that targets the "brain swelling" sensation of a hangover headache.
*   **B-Complex Vitamins:** Alcohol depletes B1 (Thiamine) and B12, which are vital for neurological function and energy.

## Conclusion: Is it Worth It?
While time is the only absolute cure for a hangover, IV therapy can compress a 24-hour recovery period into 45 minutes. For professionals, travelers, or anyone who cannot afford a "lost day," it is the clinical gold standard for rapid recovery.

**Ready to feel human again?** [Find a top-rated hangover recovery clinic near you](/search?query=hangover).
    `,
    date: '2024-04-01',
    author: 'Dr. Sarah Chen',
    imageUrl: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=1200'
  },
  {
    slug: 'nad-plus-iv-therapy-cellular-longevity-guide',
    title: 'NAD+ IV Therapy: A Deep Dive into Cellular Longevity and DNA Repair',
    metaTitle: 'NAD+ IV Therapy Guide: Benefits, Science & Longevity | TheDripMap',
    metaDescription: 'Unlock the secrets of NAD+ therapy. Discover how this coenzyme repairs DNA, boosts mitochondria, and reverses cellular aging.',
    category: 'Educational',
    content: `
# NAD+ IV Therapy: A Deep Dive into Cellular Longevity

In the burgeoning field of longevity medicine, one molecule stands above the rest: **Nicotinamide Adenine Dinucleotide (NAD+).** Found in every living cell, NAD+ is the essential coenzyme that powers our mitochondria and protects our genetic integrity. 

As we age, our NAD+ levels naturally decline—falling by as much as 50% by the time we reach our 40s. This decline is a primary driver of what scientists call "inflammaging."

## The Biological Role of NAD+
NAD+ serves two critical functions in the human body:
1.  **Energy Production (ATP):** It acts as a shuttle, carrying electrons to the mitochondria to produce ATP—the "currency" of cellular energy.
2.  **Sirtuin Activation:** NAD+ is the "fuel" for sirtuins, a family of proteins known as "longevity genes" that repair damaged DNA and protect cells from age-related decay.

## Why Infusion Over Oral Supplements?
The "NAD+ Supplement" market is massive, but there is a catch: NAD+ is a large, unstable molecule. When taken orally, much of it is broken down by stomach acid and liver metabolism before it ever reaches your systemic circulation.

**NAD+ IV Therapy** delivers the pure coenzyme directly into the bloodstream. This bypasses the "first-pass metabolism," allowing for much higher concentrations to reach the brain and muscle tissues, where it is needed most.

## Clinical Benefits of High-Dose NAD+
Patients undergoing NAD+ protocols often report a "system reboot" effect, characterized by:
*   **Neuro-Regeneration:** Improved focus, memory, and the clearing of "brain fog."
*   **Metabolic Optimization:** Enhanced ability to convert fats and carbohydrates into usable energy.
*   **Addiction Recovery Support:** NAD+ has been clinically shown to reduce cravings and withdrawal symptoms by restoring neurotransmitter balance.
*   **Chronic Fatigue Relief:** By boosting mitochondrial output, NAD+ addresses fatigue at its biological source.

## What the Procedure Looks Like
Unlike a standard 30-minute hydration drip, NAD+ infusions are slower. Because NAD+ increases cellular activity, a fast drip can cause temporary chest tightness or "heavy" sensations. A typical session lasts between **2 to 4 hours**, ensuring a comfortable and effective absorption rate.

## Is NAD+ Right for You?
Whether you are an executive looking for a cognitive edge, an athlete seeking faster repair, or someone proactively fighting the signs of aging, NAD+ therapy offers a potent biological intervention.

[Explore NAD+ providers in our verified network](/search?query=NAD).
    `,
    date: '2024-03-28',
    author: 'Dr. James Wilson',
    imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=1200'
  },
  {
    slug: 'myers-cocktail-iv-benefits-chronic-fatigue',
    title: 'The Myers’ Cocktail: The Original Wellness Drip for Chronic Fatigue',
    metaTitle: 'Myers’ Cocktail Benefits: Immunity, Energy & Fatigue | TheDripMap',
    metaDescription: 'Discover the history and clinical benefits of the Myers’ Cocktail. Learn why this blend of vitamins and minerals remains the most popular IV therapy.',
    category: 'Educational',
    content: `
# The Myers’ Cocktail: The Original Wellness Drip

Long before "drip bars" appeared in every major city, there was the **Myers’ Cocktail.** Developed in the 1960s by Dr. John Myers at Johns Hopkins University, this specific blend of vitamins and minerals has become the foundational treatment for modern IV therapy.

## What is in a Myers’ Cocktail?
While many clinics offer their own variations, the "Gold Standard" formula includes:
*   **Magnesium Chloride:** To relax muscles and support the nervous system.
*   **Calcium Gluconate:** Essential for bone health and heart rhythm.
*   **Vitamin B-Complex:** Including B1, B2, B3, B5, and B6 for energy metabolism.
*   **Vitamin B12 (Methylcobalamin):** For neurological health and red blood cell production.
*   **Vitamin C (Ascorbic Acid):** A potent antioxidant for immune defense.

## Clinical Applications
The Myers’ Cocktail is not just for "wellness"; it has been used clinically to treat a variety of conditions:
1.  **Chronic Fatigue Syndrome (CFS):** By flooding cells with B-vitamins, many patients report a significant reduction in daily lethargy.
2.  **Fibromyalgia:** Magnesium infusions have been shown to reduce the chronic muscle pain and "trigger points" associated with this condition.
3.  **Migraines:** Acute magnesium administration is a recognized treatment for stopping migraine progression.
4.  **Seasonal Allergies:** High-dose Vitamin C acts as a natural antihistamine, reducing the severity of hay fever symptoms.

## The "Myers’ Glow"
Beyond the internal health benefits, the Myers’ Cocktail is famous for the "glow" it produces. By hydrating the skin from the inside out and neutralizing free radicals, patients often notice improved skin clarity and brightness within 24 hours of treatment.

## Safety and Frequency
The Myers’ Cocktail is exceptionally safe for most adults. For chronic conditions, many practitioners recommend a "loading dose" of one drip per week for four weeks, followed by monthly maintenance sessions.

**Interested in the original wellness boost?** [Find a clinic offering the Myers’ Cocktail](/search?query=myers).
    `,
    date: '2024-03-25',
    author: 'Dr. Sarah Chen',
    imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1200'
  },
  {
    slug: 'iv-hydration-for-athletic-performance-recovery',
    title: 'Peak Performance: How Elite Athletes Use IV Hydration for Recovery',
    metaTitle: 'Athletic IV Recovery: Performance, Hydration & Science | TheDripMap',
    metaDescription: 'Learn how professional athletes use IV therapy to prevent cramping, flush lactic acid, and maintain peak physical output.',
    category: 'Use-Case',
    content: `
# Peak Performance: How Elite Athletes Use IV Hydration

In professional sports, the margin between victory and defeat is often found in the speed of recovery. Whether it’s an ultramarathoner, a CrossFit competitor, or a professional ballplayer, **IV Hydration** has become a non-negotiable part of the modern athletic toolkit.

## The Problem with Oral Rehydration
During high-intensity training, the body can lose up to 2 liters of sweat per hour. Drinking water is essential, but the human gut can only absorb about **800ml to 1 liter of water per hour.** This creates a "hydration gap" where an athlete is losing fluid faster than they can possibly replace it orally.

## The IV Solution: Pre-Hydration vs. Post-Recovery
### 1. Pre-Hydration (The "Buffer")
Athletes often get a drip 24 hours before a major event. This ensures that their plasma volume is at its peak and their electrolyte stores (specifically Sodium and Magnesium) are fully saturated. This "buffer" helps prevent the early onset of fatigue and heat-related cramping.

### 2. Post-Recovery (The "Flush")
After a race or game, the body is in a state of high inflammation and oxidative stress. An IV recovery bag typically includes:
*   **Amino Acids (BCAAs):** To trigger protein synthesis and repair micro-tears in muscle tissue.
*   **Zinc:** To support the immune system, which is often suppressed after extreme exertion.
*   **Glutathione:** To neutralize the free radicals produced during heavy aerobic activity.
*   **Toradol:** To manage acute joint and muscle pain without the GI side effects of oral NSAIDs.

## Lactic Acid and pH Balance
Intense exercise produces lactic acid, which lowers the pH of your blood and causes that "burning" sensation. Isotonic IV fluids help restore the blood’s natural pH balance more rapidly than rest alone, allowing athletes to return to training days sooner.

## Is it Legal?
For competitive athletes, it is important to note that WADA (World Anti-Doping Agency) has specific rules regarding IV volume (currently limited to 100ml per 12-hour period unless medically necessary). Always consult with your team physician or a certified sports medicine clinic.

**Ready to optimize your training?** [Browse sports recovery specialists](/search?query=athlete).
    `,
    date: '2024-03-20',
    author: 'Coach Alex Rivera',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1200'
  },
  {
    slug: 'iv-therapy-safety-side-effects-guide',
    title: 'Is IV Therapy Safe? A Comprehensive Guide to Risks and Best Practices',
    metaTitle: 'IV Therapy Safety Guide: Risks, Side Effects & Standards | TheDripMap',
    metaDescription: 'Is IV therapy safe? Learn about potential side effects, the importance of medical supervision, and how to choose a reputable provider.',
    category: 'Educational',
    content: `
# Is IV Therapy Safe? A Comprehensive Guide

As IV therapy transitions from clinical settings to luxury "drip bars," many first-time patients have a critical question: **Is it actually safe?** 

While IV therapy is a minimally invasive and generally safe procedure, it is still a medical intervention. Understanding the standards of care is essential for ensuring a positive experience.

## The Importance of Medical Supervision
The most important safety factor is **Medical Direction.** A reputable IV clinic must have a licensed Medical Director (MD or DO) who establishes the protocols and oversees the staff. 

**Red Flags to Watch For:**
*   No medical history intake before your first drip.
*   No vital signs (blood pressure/heart rate) taken before the needle is inserted.
*   Staff who cannot explain the ingredients in your bag.

## Who Should Administer the IV?
The person performing the venipuncture should be a licensed medical professional. This includes:
*   Registered Nurses (RN)
*   Nurse Practitioners (NP)
*   Physician Assistants (PA)
*   Certified Paramedics

## Potential Side Effects
Most side effects are minor and temporary. They may include:
*   **Bruising or Soreness:** Common at the site of the needle insertion.
*   **Cooling Sensation:** As the room-temperature fluid enters your warm bloodstream.
*   **Metallic Taste:** Often reported when receiving high doses of B-vitamins or Zinc.
*   **Lightheadedness:** If the drip is administered too quickly.

## Rare but Serious Risks
While rare, serious complications can occur if protocols are not followed:
1.  **Infection (Sepsis):** Prevented by strict "aseptic technique" (sterile prep).
2.  **Phlebitis:** Inflammation of the vein, usually caused by improper needle placement.
3.  **Fluid Overload:** A risk for individuals with underlying heart or kidney conditions. This is why a medical history check is mandatory.

## How to Choose a Safe Provider
1.  **Ask about Sourcing:** Do they use FDA-regulated **503B compounding pharmacies**?
2.  **Check Reviews:** Look for mentions of staff professionalism and clinic cleanliness.
3.  **Trust Your Gut:** If a clinic feels more like a "party spot" than a medical facility, look elsewhere.

**At TheDripMap, we only list clinics that meet our high standards for professional care.** [Search our verified network](/).
    `,
    date: '2024-03-15',
    author: 'Dr. Sarah Chen',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200'
  },
  {
    slug: 'mobile-iv-vs-in-clinic-comparison',
    title: 'Mobile IV Therapy vs. In-Clinic: Which Experience is Right for You?',
    metaTitle: 'Mobile IV vs. In-Clinic: Comparison, Pros & Cons | TheDripMap',
    metaDescription: 'Should you book a mobile IV or visit a wellness lounge? We compare the cost, convenience, and clinical experience of both options.',
    category: 'Educational',
    content: `
# Mobile IV Therapy vs. In-Clinic: Which is Right for You?

The IV therapy industry has split into two distinct models: the **Luxury Wellness Lounge** and the **On-Demand Mobile Service.** Both offer the same clinical benefits, but the experience—and the price tag—can vary significantly.

## Option 1: The In-Clinic Experience
Wellness lounges are designed to be an "oasis." They often feature massage chairs, oxygen bars, aromatherapy, and a social atmosphere.

**Best For:**
*   **Regular Wellness Routines:** If you incorporate IV therapy into your weekly health regimen.
*   **Social Drip Parties:** Booking with a group of friends before a wedding or after a bachelorette party.
*   **Lower Cost:** Since there is no travel fee, in-clinic drips are typically $30–$60 cheaper.

## Option 2: Mobile IV Therapy
Mobile services bring the clinic to you. A nurse arrives at your home, hotel, or office with all the necessary equipment.

**Best For:**
*   **Acute Illness/Hangovers:** When the last thing you want to do is drive across town and sit in a waiting room.
*   **Busy Professionals:** Getting a "Power Drip" while you answer emails in your home office.
*   **Privacy:** High-profile individuals or those who prefer a one-on-one clinical setting.

## Key Comparison Factors
| Feature | In-Clinic | Mobile Service |
| :--- | :--- | :--- |
| **Convenience** | Moderate (Requires Travel) | High (At Your Door) |
| **Cost** | Baseline Pricing | Baseline + Travel Fee ($50-$100) |
| **Environment** | Spa-like / Social | Your Own Home / Private |
| **Amenities** | Massage Chairs, Tea, O2 | Limited to the Drip |

## The Verdict
If you are feeling 10/10 and want to maintain your health, the **Wellness Lounge** offers the best value and experience. However, if you are feeling 2/10 due to a migraine, flu, or hangover, the convenience of **Mobile IV Therapy** is worth every penny.

[Find both mobile and in-clinic providers in your area](/search).
    `,
    date: '2024-03-10',
    author: 'Mark Johnson',
    imageUrl: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=1200'
  }
];
