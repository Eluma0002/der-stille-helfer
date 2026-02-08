/**
 * Application constants for Der Stille Helfer
 */

/**
 * Default product categories for inventory organization
 */
export const DEFAULT_CATEGORIES = [
    { id: 'vorrat', name: 'Vorratskammer', icon: '🏠' },
    { id: 'kuehlschrank', name: 'Kuhlschrank', icon: '🧊' },
    { id: 'gefrierschrank', name: 'Gefrierschrank', icon: '❄️' },
    { id: 'getraenke', name: 'Getranke', icon: '🥤' },
    { id: 'gewuerze', name: 'Gewurze', icon: '🧂' }
];

/**
 * Sample recipes for initial database population
 * Schema matches db.base_rezepte
 */
export const SAMPLE_RECIPES = [
    {
        id: 'spaghetti-bolognese',
        name: 'Spaghetti Bolognese',
        zutaten: [
            { name: 'Spaghetti', menge: '400g' },
            { name: 'Hackfleisch', menge: '300g' },
            { name: 'Tomatenpassata', menge: '400ml' },
            { name: 'Zwiebel', menge: '1 Stuck' },
            { name: 'Knoblauch', menge: '2 Zehen' },
            { name: 'Olivenol', menge: '2 EL' }
        ],
        anleitung: 'Zwiebel und Knoblauch fein hacken und in Olivenol anbraten. Hackfleisch hinzufugen und krumelig braten. Tomatenpassata dazugeben, mit Salz und Pfeffer wurzen. 20 Minuten kocheln lassen. Spaghetti nach Packungsanleitung kochen und mit der Sauce servieren.',
        kategorie: 'Hauptgericht',
        portionen: 4,
        zeit: 35
    },
    {
        id: 'kartoffelsalat',
        name: 'Kartoffelsalat',
        zutaten: [
            { name: 'Kartoffeln', menge: '1kg' },
            { name: 'Zwiebel', menge: '1 Stuck' },
            { name: 'Essig', menge: '3 EL' },
            { name: 'Ol', menge: '4 EL' },
            { name: 'Bruhe', menge: '150ml' }
        ],
        anleitung: 'Kartoffeln kochen, schalen und in Scheiben schneiden. Zwiebel fein hacken. Warme Bruhe mit Essig und Ol vermengen. Uber die Kartoffeln giessen, Zwiebeln unterheben. Mit Salz und Pfeffer abschmecken. Mindestens 30 Minuten ziehen lassen.',
        kategorie: 'Beilage',
        portionen: 4,
        zeit: 45
    },
    {
        id: 'pfannkuchen',
        name: 'Pfannkuchen',
        zutaten: [
            { name: 'Mehl', menge: '250g' },
            { name: 'Eier', menge: '3 Stuck' },
            { name: 'Milch', menge: '400ml' },
            { name: 'Zucker', menge: '2 EL' },
            { name: 'Salz', menge: '1 Prise' }
        ],
        anleitung: 'Alle Zutaten zu einem glatten Teig verruhren. Teig 15 Minuten ruhen lassen. In einer Pfanne mit etwas Butter dunne Pfannkuchen ausbacken. Nach Belieben mit Zucker, Marmelade oder Nutella servieren.',
        kategorie: 'Dessert',
        portionen: 4,
        zeit: 25
    },
    {
        id: 'gulasch',
        name: 'Gulasch',
        zutaten: [
            { name: 'Rindfleisch', menge: '600g' },
            { name: 'Zwiebeln', menge: '3 Stuck' },
            { name: 'Paprikapulver', menge: '2 EL' },
            { name: 'Tomatenmark', menge: '2 EL' },
            { name: 'Rinderbruhe', menge: '500ml' },
            { name: 'Ol', menge: '3 EL' }
        ],
        anleitung: 'Fleisch in Wurfel schneiden. Zwiebeln in Ringe schneiden und in Ol glasig braten. Fleisch anbraten. Paprikapulver und Tomatenmark einruhren. Mit Bruhe ablossen. Bei niedriger Hitze 1,5-2 Stunden schmoren bis das Fleisch zart ist.',
        kategorie: 'Hauptgericht',
        portionen: 4,
        zeit: 120
    },
    {
        id: 'omelett',
        name: 'Omelett',
        zutaten: [
            { name: 'Eier', menge: '3 Stuck' },
            { name: 'Butter', menge: '1 EL' },
            { name: 'Salz', menge: '1 Prise' },
            { name: 'Pfeffer', menge: '1 Prise' }
        ],
        anleitung: 'Eier mit Salz und Pfeffer verquirlen. Butter in einer Pfanne erhitzen. Eier hineingeben und bei mittlerer Hitze stocken lassen. Das Omelett zusammenklappen und servieren. Nach Belieben mit Kase, Schinken oder Krauter fullen.',
        kategorie: 'Fruhstuck',
        portionen: 1,
        zeit: 10
    },
    {
        id: 'ruehreier-mit-speck',
        name: 'Rührei mit Speck',
        zutaten: [
            { name: 'Eier', menge: '4 Stuck' },
            { name: 'Speck', menge: '100g' },
            { name: 'Butter', menge: '1 EL' },
            { name: 'Salz', menge: '1 Prise' },
            { name: 'Pfeffer', menge: '1 Prise' }
        ],
        anleitung: 'Speck in einer Pfanne knusprig braten. Eier mit Salz und Pfeffer verquirlen und in die Pfanne geben. Bei mittlerer Hitze unter Ruhren stocken lassen, bis die gewunschte Konsistenz erreicht ist. Mit frischem Brot servieren.',
        kategorie: 'Fruhstuck',
        portionen: 2,
        zeit: 15
    },
    {
        id: 'gemuesepfanne',
        name: 'Gemüsepfanne',
        zutaten: [
            { name: 'Paprika', menge: '2 Stuck' },
            { name: 'Zucchini', menge: '1 Stuck' },
            { name: 'Karotten', menge: '2 Stuck' },
            { name: 'Zwiebel', menge: '1 Stuck' },
            { name: 'Olivenol', menge: '2 EL' },
            { name: 'Sojasauce', menge: '2 EL' }
        ],
        anleitung: 'Gemuse waschen und in mundgerechte Stucke schneiden. Zwiebel fein hacken und in Olivenol anbraten. Gemuse hinzufugen und 5-7 Minuten braten. Mit Sojasauce abschmecken und servieren. Optional mit Reis oder Nudeln kombinieren.',
        kategorie: 'Hauptgericht',
        portionen: 3,
        zeit: 25
    },
    {
        id: 'haehnchenbrust-mit-kartoffeln',
        name: 'Hähnchenbrust mit Kartoffeln',
        zutaten: [
            { name: 'Hähnchenbrust', menge: '2 Stuck' },
            { name: 'Kartoffeln', menge: '6 Stuck' },
            { name: 'Rosmarin', menge: '1 Zweig' },
            { name: 'Olivenol', menge: '2 EL' },
            { name: 'Salz', menge: '1 TL' },
            { name: 'Pfeffer', menge: '1 TL' }
        ],
        anleitung: 'Kartoffeln schalen, vierteln und mit Olivenol, Salz, Pfeffer und Rosmarin vermengen. Auf einem Backblech verteilen. Hähnchenbrust mit Salz und Pfeffer wurzen und auf die Kartoffeln legen. Bei 200°C fur 30-35 Minuten im Ofen backen, bis das Fleisch durchgegart ist.',
        kategorie: 'Hauptgericht',
        portionen: 2,
        zeit: 45
    },
    {
        id: 'linsensuppe',
        name: 'Linsensuppe',
        zutaten: [
            { name: 'Rote Linsen', menge: '250g' },
            { name: 'Karotten', menge: '2 Stuck' },
            { name: 'Sellerie', menge: '1 Stuck' },
            { name: 'Zwiebel', menge: '1 Stuck' },
            { name: 'Gemusebruhe', menge: '1 Liter' },
            { name: 'Olivenol', menge: '1 EL' }
        ],
        anleitung: 'Zwiebel, Karotten und Sellerie fein hacken und in Olivenol anbraten. Linsen hinzufugen und kurz mitbraten. Mit Gemusebruhe ablossen und 20-25 Minuten kochen lassen, bis die Linsen weich sind. Mit Salz und Pfeffer abschmecken. Optional mit Brot servieren.',
        kategorie: 'Suppe',
        portionen: 4,
        zeit: 35
    },
    {
        id: 'obstsalat',
        name: 'Obstsalat',
        zutaten: [
            { name: 'Apfel', menge: '2 Stuck' },
            { name: 'Banane', menge: '2 Stuck' },
            { name: 'Trauben', menge: '100g' },
            { name: 'Orange', menge: '1 Stuck' },
            { name: 'Zitronensaft', menge: '1 EL' },
            { name: 'Honig', menge: '1 TL' }
        ],
        anleitung: 'Obst waschen und in mundgerechte Stucke schneiden. In einer Schussel vermengen. Mit Zitronensaft und Honig betraufeln, um das Braunwerden zu verhindern. Kuhl stellen und frisch servieren.',
        kategorie: 'Dessert',
        portionen: 3,
        zeit: 10
    }
];
