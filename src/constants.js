/**
 * Application constants for Der Stille Helfer
 */

/**
 * Default product categories for inventory organization
 */
export const DEFAULT_CATEGORIES = [
    { id: 'kuehlschrank', name: 'Kühlschrank', icon: '🧊', color: '#3B82F6' },
    { id: 'gefrierschrank', name: 'Gefrierschrank', icon: '❄️', color: '#8B5CF6' },
    { id: 'fruechte', name: 'Früchte', icon: '🍎', color: '#EF4444' },
    { id: 'gemuese', name: 'Gemüse', icon: '🥬', color: '#22C55E' },
    { id: 'vorrat', name: 'Vorrat', icon: '🏠', color: '#F59E0B' },
    { id: 'getraenke', name: 'Getränke', icon: '🥤', color: '#06B6D4' },
    { id: 'gewuerze', name: 'Gewürze', icon: '🧂', color: '#EC4899' }
];

/**
 * Meal time categories
 */
export const MEAL_CATEGORIES = [
    { id: 'all', name: 'Alle', icon: '🍽️' },
    { id: 'fruehstueck', name: 'Frühstück', icon: '🌅' },
    { id: 'mittag', name: 'Mittag', icon: '☀️' },
    { id: 'abend', name: 'Abend', icon: '🌙' },
    { id: 'snack', name: 'Snacks', icon: '🍿' },
    { id: 'salat', name: 'Salat', icon: '🥗' }
];

/**
 * Sample recipes with meal categories (mahlzeit)
 */
export const SAMPLE_RECIPES = [
    {
        id: 'spaghetti-bolognese',
        name: 'Spaghetti Bolognese',
        zutaten: [
            { name: 'Spaghetti', menge: '400g' },
            { name: 'Hackfleisch', menge: '300g' },
            { name: 'Tomatenpassata', menge: '400ml' },
            { name: 'Zwiebel', menge: '1 Stück' },
            { name: 'Knoblauch', menge: '2 Zehen' },
            { name: 'Olivenöl', menge: '2 EL' }
        ],
        anleitung: 'Zwiebel und Knoblauch fein hacken und in Olivenöl anbraten. Hackfleisch hinzufügen und krümelig braten. Tomatenpassata dazugeben, mit Salz und Pfeffer würzen. 20 Minuten köcheln lassen. Spaghetti nach Packungsanleitung kochen und mit der Sauce servieren.',
        kategorie: 'Hauptgericht',
        mahlzeit: 'mittag',
        portionen: 4,
        zeit: 35
    },
    {
        id: 'kartoffelsalat',
        name: 'Kartoffelsalat',
        zutaten: [
            { name: 'Kartoffeln', menge: '1kg' },
            { name: 'Zwiebel', menge: '1 Stück' },
            { name: 'Essig', menge: '3 EL' },
            { name: 'Öl', menge: '4 EL' },
            { name: 'Brühe', menge: '150ml' }
        ],
        anleitung: 'Kartoffeln kochen, schälen und in Scheiben schneiden. Zwiebel fein hacken. Warme Brühe mit Essig und Öl vermengen. Über die Kartoffeln gießen, Zwiebeln unterheben. Mit Salz und Pfeffer abschmecken. Mindestens 30 Minuten ziehen lassen.',
        kategorie: 'Beilage',
        mahlzeit: 'mittag',
        portionen: 4,
        zeit: 45
    },
    {
        id: 'pfannkuchen',
        name: 'Pfannkuchen',
        zutaten: [
            { name: 'Mehl', menge: '250g' },
            { name: 'Eier', menge: '3 Stück' },
            { name: 'Hafermilch', menge: '400ml' },
            { name: 'Zucker', menge: '2 EL' },
            { name: 'Salz', menge: '1 Prise' }
        ],
        anleitung: 'Alle Zutaten zu einem glatten Teig verrühren. Teig 15 Minuten ruhen lassen. In einer Pfanne mit etwas Butter dünne Pfannkuchen ausbacken. Nach Belieben mit Zucker, Marmelade oder Honig servieren.',
        kategorie: 'Dessert',
        mahlzeit: 'snack',
        portionen: 4,
        zeit: 25
    },
    {
        id: 'gulasch',
        name: 'Gulasch',
        zutaten: [
            { name: 'Rindfleisch', menge: '600g' },
            { name: 'Zwiebeln', menge: '3 Stück' },
            { name: 'Paprikapulver', menge: '2 EL' },
            { name: 'Tomatenmark', menge: '2 EL' },
            { name: 'Rinderbrühe', menge: '500ml' },
            { name: 'Öl', menge: '3 EL' }
        ],
        anleitung: 'Fleisch in Würfel schneiden. Zwiebeln in Ringe schneiden und in Öl glasig braten. Fleisch anbraten. Paprikapulver und Tomatenmark einrühren. Mit Brühe ablöschen. Bei niedriger Hitze 1,5-2 Stunden schmoren bis das Fleisch zart ist.',
        kategorie: 'Hauptgericht',
        mahlzeit: 'abend',
        portionen: 4,
        zeit: 120
    },
    {
        id: 'omelett',
        name: 'Omelett',
        zutaten: [
            { name: 'Eier', menge: '3 Stück' },
            { name: 'Butter', menge: '1 EL' },
            { name: 'Salz', menge: '1 Prise' },
            { name: 'Pfeffer', menge: '1 Prise' }
        ],
        anleitung: 'Eier mit Salz und Pfeffer verquirlen. Butter in einer Pfanne erhitzen. Eier hineingeben und bei mittlerer Hitze stocken lassen. Das Omelett zusammenklappen und servieren. Nach Belieben mit Hartkäse, Schinken oder Kräuter füllen.',
        kategorie: 'Frühstück',
        mahlzeit: 'fruehstueck',
        portionen: 1,
        zeit: 10
    },
    {
        id: 'ruehreier-mit-speck',
        name: 'Rührei mit Speck',
        zutaten: [
            { name: 'Eier', menge: '4 Stück' },
            { name: 'Speck', menge: '100g' },
            { name: 'Butter', menge: '1 EL' },
            { name: 'Salz', menge: '1 Prise' },
            { name: 'Pfeffer', menge: '1 Prise' }
        ],
        anleitung: 'Speck in einer Pfanne knusprig braten. Eier mit Salz und Pfeffer verquirlen und in die Pfanne geben. Bei mittlerer Hitze unter Rühren stocken lassen, bis die gewünschte Konsistenz erreicht ist. Mit frischem Brot servieren.',
        kategorie: 'Frühstück',
        mahlzeit: 'fruehstueck',
        portionen: 2,
        zeit: 15
    },
    {
        id: 'gemuesepfanne',
        name: 'Gemüsepfanne',
        zutaten: [
            { name: 'Paprika', menge: '2 Stück' },
            { name: 'Zucchini', menge: '1 Stück' },
            { name: 'Karotten', menge: '2 Stück' },
            { name: 'Zwiebel', menge: '1 Stück' },
            { name: 'Olivenöl', menge: '2 EL' },
            { name: 'Salz', menge: 'nach Geschmack' }
        ],
        anleitung: 'Gemüse waschen und in mundgerechte Stücke schneiden. Zwiebel fein hacken und in Olivenöl anbraten. Gemüse hinzufügen und 5-7 Minuten braten. Mit Salz und Pfeffer abschmecken. Optional mit Reis oder Nudeln kombinieren.',
        kategorie: 'Hauptgericht',
        mahlzeit: 'abend',
        portionen: 3,
        zeit: 25
    },
    {
        id: 'haehnchenbrust-mit-kartoffeln',
        name: 'Hähnchenbrust mit Kartoffeln',
        zutaten: [
            { name: 'Hähnchenbrust', menge: '2 Stück' },
            { name: 'Kartoffeln', menge: '6 Stück' },
            { name: 'Rosmarin', menge: '1 Zweig' },
            { name: 'Olivenöl', menge: '2 EL' },
            { name: 'Salz', menge: '1 TL' },
            { name: 'Pfeffer', menge: '1 TL' }
        ],
        anleitung: 'Kartoffeln schälen, vierteln und mit Olivenöl, Salz, Pfeffer und Rosmarin vermengen. Auf einem Backblech verteilen. Hähnchenbrust mit Salz und Pfeffer würzen und auf die Kartoffeln legen. Bei 200°C für 30-35 Minuten im Ofen backen.',
        kategorie: 'Hauptgericht',
        mahlzeit: 'abend',
        portionen: 2,
        zeit: 45
    },
    {
        id: 'linsensuppe',
        name: 'Linsensuppe',
        zutaten: [
            { name: 'Rote Linsen', menge: '250g' },
            { name: 'Karotten', menge: '2 Stück' },
            { name: 'Sellerie', menge: '1 Stück' },
            { name: 'Zwiebel', menge: '1 Stück' },
            { name: 'Gemüsebrühe', menge: '1 Liter' },
            { name: 'Olivenöl', menge: '1 EL' }
        ],
        anleitung: 'Zwiebel, Karotten und Sellerie fein hacken und in Olivenöl anbraten. Linsen hinzufügen und kurz mitbraten. Mit Gemüsebrühe ablöschen und 20-25 Minuten kochen lassen. Mit Salz und Pfeffer abschmecken. Optional mit Brot servieren.',
        kategorie: 'Suppe',
        mahlzeit: 'mittag',
        portionen: 4,
        zeit: 35
    },
    {
        id: 'obstsalat',
        name: 'Obstsalat',
        zutaten: [
            { name: 'Apfel', menge: '2 Stück' },
            { name: 'Banane', menge: '2 Stück' },
            { name: 'Trauben', menge: '100g' },
            { name: 'Orange', menge: '1 Stück' },
            { name: 'Zitronensaft', menge: '1 EL' },
            { name: 'Honig', menge: '1 TL' }
        ],
        anleitung: 'Obst waschen und in mundgerechte Stücke schneiden. In einer Schüssel vermengen. Mit Zitronensaft und Honig beträufeln. Kühl stellen und frisch servieren.',
        kategorie: 'Dessert',
        mahlzeit: 'snack',
        portionen: 3,
        zeit: 10
    },
    {
        id: 'gemischter-salat',
        name: 'Gemischter Salat',
        zutaten: [
            { name: 'Blattsalat', menge: '1 Kopf' },
            { name: 'Tomaten', menge: '2 Stück' },
            { name: 'Gurke', menge: '1/2 Stück' },
            { name: 'Olivenöl', menge: '3 EL' },
            { name: 'Balsamico', menge: '1 EL' },
            { name: 'Salz', menge: '1 Prise' }
        ],
        anleitung: 'Salat waschen und trocknen. Tomaten und Gurke in Scheiben schneiden. Alles in einer Schüssel vermengen. Aus Olivenöl, Balsamico und Salz ein Dressing anrühren und über den Salat geben.',
        kategorie: 'Salat',
        mahlzeit: 'salat',
        portionen: 2,
        zeit: 10
    }
];
