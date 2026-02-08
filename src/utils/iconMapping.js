/**
 * Icon mapping and normalization utilities
 * Maps product names to icon filenames and emoji fallbacks
 */

// Emoji fallback mapping (same as before)
export const PRODUCT_EMOJIS = {
    // Dairy
    'milch': '🥛',
    'hafermilch': '🥛',
    'sojamilch': '🥛',
    'käse': '🧀',
    'kaese': '🧀',
    'gouda': '🧀',
    'emmentaler': '🧀',
    'cheddar': '🧀',
    'butter': '🧈',
    'margarine': '🧈',
    'joghurt': '🥛',
    'quark': '🥛',
    'sahne': '🥛',
    'schmand': '🥛',
    'frischkäse': '🧀',
    'frischkaese': '🧀',

    // Fruits
    'apfel': '🍎',
    'äpfel': '🍎',
    'aepfel': '🍎',
    'banane': '�banana',
    'orange': '🍊',
    'traube': '🍇',
    'erdbeere': '🍓',
    'heidelbeere': '🫐',
    'zitrone': '🍋',
    'birne': '🍐',
    'pfirsich': '🍑',
    'kirsche': '🍒',
    'wassermelone': '🍉',
    'ananas': '🍍',
    'mango': '🥭',
    'kiwi': '🥝',

    // Vegetables
    'tomate': '🍅',
    'karotte': '🥕',
    'möhre': '🥕',
    'paprika': '🫑',
    'zwiebel': '🧅',
    'knoblauch': '🧄',
    'kartoffel': '🥔',
    'salat': '🥬',
    'gurke': '🥒',
    'zucchini': '🥒',
    'aubergine': '🍆',
    'brokkoli': '🥦',
    'blumenkohl': '🥦',
    'spinat': '🥬',
    'champignon': '🍄',
    'pilz': '🍄',

    // Meat & Protein
    'fleisch': '🥩',
    'rindfleisch': '🥩',
    'schweinefleisch': '🥩',
    'hähnchen': '🍗',
    'haehnchen': '🍗',
    'huhn': '🍗',
    'pute': '🍗',
    'fisch': '🐟',
    'lachs': '🐟',
    'thunfisch': '🐟',
    'forelle': '🐟',
    'garnele': '🦐',
    'ei': '🥚',
    'eier': '🥚',
    'wurst': '🌭',
    'salami': '🍖',
    'schinken': '🥓',
    'speck': '🥓',
    'hackfleisch': '🥩',

    // Bread & Grains
    'brot': '🍞',
    'brötchen': '🥖',
    'reis': '🍚',
    'nudel': '🍝',
    'pasta': '🍝',
    'spaghetti': '🍝',
    'mehl': '🌾',

    // Condiments & Sauces
    'ketchup': '🍅',
    'mayonnaise': '🥚',
    'senf': '🌭',
    'pesto': '🌿',
    'hummus': '🧆',
    'nutella': '🍫',
    'marmelade': '🍓',
    'honig': '🍯',
    'öl': '🫒',
    'oel': '🫒',
    'olivenöl': '🫒',
    'essig': '🧪',

    // Other
    'wasser': '💧',
    'saft': '🧃',
    'bier': '🍺',
    'wein': '🍷',
    'kaffee': '☕',
    'tee': '🍵',
    'schokolade': '🍫',
    'zucker': '🍬',
    'salz': '🧂',
    'pfeffer': '🧂',
    'tofu': '🥡',
    'tempeh': '🥡'
};

/**
 * Normalize product name to icon filename
 * Rules:
 * - Lowercase
 * - Remove umlauts: ä→a, ö→o, ü→u, ß→ss
 * - Remove plural 's' and 'n'
 * - Remove spaces and special characters
 */
export const normalizeIconName = (productName) => {
    if (!productName) return null;

    return productName
        .toLowerCase()
        .trim()
        // Remove umlauts
        .replace(/ä/g, 'a')
        .replace(/ö/g, 'o')
        .replace(/ü/g, 'u')
        .replace(/ß/g, 'ss')
        // Remove common plural endings
        .replace(/en$/, '')
        .replace(/s$/, '')
        // Remove spaces and special chars
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
};

/**
 * Get icon path for a product
 * Returns the path to try loading
 */
export const getIconPath = (productName) => {
    const normalized = normalizeIconName(productName);
    if (!normalized) return null;
    return `/icons/${normalized}.png`;
};

/**
 * Get emoji fallback for a product
 */
export const getEmojiForProduct = (productName) => {
    if (!productName) return '🍽️';

    const normalized = normalizeIconName(productName);

    // Direct match
    if (PRODUCT_EMOJIS[normalized]) {
        return PRODUCT_EMOJIS[normalized];
    }

    // Partial match (check if product name contains any key)
    for (const [key, emoji] of Object.entries(PRODUCT_EMOJIS)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return emoji;
        }
    }

    return '🍽️'; // Default
};

/**
 * Icon mapping based on the user's reference images
 * Maps categories to available icons
 */
export const AVAILABLE_ICONS = {
    // From image 1
    fruits: ['zitrone', 'traube', 'erdbeere', 'heidelbeere', 'apfel', 'birne', 'banane', 'orange'],
    condiments: ['ketchup', 'mayonnaise', 'senf', 'remoulade', 'pesto', 'hummus', 'nutella'],
    basics: ['tofu', 'tempeh', 'salat', 'krauter', 'brot', 'mehl', 'zucker', 'salz', 'reis', 'nudel'],

    // From image 2
    proteins: ['lachs', 'thunfisch', 'forelle', 'garnele', 'fischfilet', 'eier'],
    vegetables: ['zucchini', 'aubergine', 'tomate', 'brokkoli', 'blumenkohl', 'salat', 'spinat', 'champignon', 'zwiebel', 'knoblauch'],

    // From image 3
    dairy: ['milch', 'hafermilch', 'sojamilch', 'joghurt', 'quark', 'sahne', 'butter', 'margarine', 'frischkase', 'schmand', 'gouda', 'emmentaler', 'cheddar'],
    meat: ['rindfleisch', 'schweinefleisch', 'hahnchen', 'pute', 'hackfleisch', 'salami', 'schinken', 'wurst']
};

/**
 * Get all available icon names as a flat array
 */
export const getAllAvailableIcons = () => {
    return Object.values(AVAILABLE_ICONS).flat();
};
