// Elvis's dietary restrictions - dairy products to be replaced
// WICHTIG: Butter, Rahm/Sahne und Hartkäse sind ERLAUBT
// Soja ist NICHT gewünscht als Alternative
export const ELVIS_SUBSTITUTIONS = {
  'Milch': ['Hafermilch', 'Kokosmilch', 'Mandelmilch'],
  'Joghurt': ['Kokosjoghurt', 'Haferjoghurt'],
  'Quark': ['Cashew-Quark', 'Skyr (wenn vertragen)'],
  'Crème fraîche': ['Sauerrahm', 'Schmand'],
  'Mascarpone': ['Cashewcreme', 'Frischkäse (wenn vertragen)'],
  'Ricotta': ['Cashewcreme'],
  'Weichkäse': ['Hartkäse stattdessen'],
  'Frischkäse': ['Cashewaufstrich'],
  'Mozzarella': ['Burrata (wenn vertragen)', 'Hartkäse geraspelt']
};

// Was ERLAUBT ist (wird nicht als Warnung angezeigt)
export const ELVIS_ALLOWED = [
  'Butter',
  'Rahm',
  'Sahne',
  'Sauerrahm',
  'Schmand',
  'Hartkäse',
  'Parmesan',
  'Gruyère',
  'Emmentaler',
  'Bergkäse',
  'Gouda (alt)',
  'Cheddar',
  'Pecorino'
];

// Was NICHT als Alternative verwendet werden soll
export const ELVIS_EXCLUDED_ALTERNATIVES = [
  'Soja',
  'Sojajoghurt',
  'Sojamilch',
  'Sojaquark',
  'Soja-Cuisine',
  'Tofu'
];

// Export list of restricted ingredients for profile seeding
export const ELVIS_RESTRICTIONS = Object.keys(ELVIS_SUBSTITUTIONS);

// Vollständiges Allergieprofil als strukturiertes Objekt
export const ELVIS_PROFILE = {
    forbidden: Object.keys(ELVIS_SUBSTITUTIONS),
    allowed: ELVIS_ALLOWED,
    excluded: ELVIS_EXCLUDED_ALTERNATIVES,
    substitutions: ELVIS_SUBSTITUTIONS
};
