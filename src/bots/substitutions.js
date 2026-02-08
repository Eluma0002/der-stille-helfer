// Elvis's dietary restrictions - dairy products to be replaced
export const ELVIS_SUBSTITUTIONS = {
  'Milch': ['Sauerrahm', 'Kokosmilch'],
  'Butter': ['Pflanzenmargarine', 'Öl'],
  'Käse': ['Veganer Käse (optional)'],
  'Joghurt': ['Sojajoghurt'],
  'Sahne': ['Soja-Cuisine', 'Kokosmilch'],
  'Quark': ['Sojaquark', 'Skyr vegan'],
  'Crème fraîche': ['Vegane Crème'],
  'Schmand': ['Pflanzliche Sahne + Zitronensaft'],
  'Mascarpone': ['Cashewcreme'],
  'Ricotta': ['Tofu zerdrückt + Öl']
};

// Export list of restricted ingredients for profile seeding
export const ELVIS_RESTRICTIONS = Object.keys(ELVIS_SUBSTITUTIONS);
