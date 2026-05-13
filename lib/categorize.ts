const KEYWORDS: Record<string, string[]> = {
  "Food & Dining": [
    "coffee", "cafe", "restaurant", "lunch", "dinner", "breakfast", "pizza",
    "burger", "sushi", "nando", "kfc", "mcdonald", "subway", "starbucks",
    "costa", "bar", "pub", "bakery", "eat", "meal", "brunch", "takeaway",
    "takeout", "snack", "food", "grill", "bistro", "diner", "wings", "taco",
    "burrito", "ramen", "noodle", "curry", "kebab", "sandwich",
  ],
  "Grocery": [
    "grocery", "supermarket", "tesco", "sainsbury", "asda", "walmart",
    "costco", "whole foods", "aldi", "lidl", "market", "vegetables", "fruits",
    "produce", "milk", "eggs", "bread",
  ],
  "Transport": [
    "uber", "lyft", "taxi", "bus", "train", "metro", "tube", "flight",
    "airline", "petrol", "gas station", "fuel", "parking", "toll", "fare",
    "transit", "tram", "commute", "rail", "car hire", "rental car",
  ],
  "Shopping": [
    "amazon", "ebay", "zara", "h&m", "primark", "clothes", "clothing",
    "shoes", "fashion", "mall", "online order", "delivery", "purchase",
    "shop", "store",
  ],
  "Entertainment": [
    "netflix", "spotify", "disney", "hulu", "apple tv", "cinema", "movie",
    "theatre", "theater", "concert", "gaming", "steam", "playstation", "xbox",
    "nintendo", "show", "festival", "gig", "museum", "ticket",
  ],
  "Health": [
    "pharmacy", "chemist", "doctor", "hospital", "clinic", "dentist", "gym",
    "fitness", "yoga", "medical", "medicine", "prescription", "vitamin",
    "optician", "physio", "therapy",
  ],
  "Utilities": [
    "electric", "electricity", "internet", "broadband", "wifi", "phone bill",
    "mobile bill", "council tax", "insurance", "rent", "mortgage", "water bill",
    "gas bill",
  ],
  "Travel": [
    "hotel", "airbnb", "hostel", "booking.com", "holiday", "vacation",
    "resort", "tour", "visa", "luggage", "suitcase",
  ],
  "Education": [
    "course", "tuition", "university", "college", "textbook", "lesson",
    "training", "udemy", "coursera", "skillshare", "class", "exam fee",
  ],
};

export function guessCategory(description: string): string | null {
  const lower = description.toLowerCase();
  for (const [category, keywords] of Object.entries(KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }
  return null;
}
