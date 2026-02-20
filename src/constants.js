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
    },

    // ── FRÜHSTÜCK ───────────────────────────────────
    {
        id: 'muesli-mit-fruechten',
        name: 'Müsli mit Früchten',
        zutaten: [
            { name: 'Haferflocken', menge: '80g' },
            { name: 'Hafermilch', menge: '200ml' },
            { name: 'Banane', menge: '1 Stück' },
            { name: 'Honig', menge: '1 TL' }
        ],
        anleitung: 'Haferflocken in eine Schüssel geben. Hafermilch darüber gießen und 5 Minuten quellen lassen. Banane in Scheiben schneiden und darauf verteilen. Mit Honig beträufeln.',
        kategorie: 'Frühstück',
        mahlzeit: 'fruehstueck',
        portionen: 1,
        zeit: 5
    },
    {
        id: 'french-toast',
        name: 'French Toast',
        zutaten: [
            { name: 'Toast', menge: '4 Scheiben' },
            { name: 'Eier', menge: '2 Stück' },
            { name: 'Hafermilch', menge: '100ml' },
            { name: 'Butter', menge: '1 EL' },
            { name: 'Zucker', menge: '1 EL' },
            { name: 'Zimt', menge: '1 Prise' }
        ],
        anleitung: 'Eier, Hafermilch, Zucker und Zimt verquirlen. Toastscheiben darin wenden. Butter in einer Pfanne erhitzen und die Toasts von beiden Seiten goldbraun braten. Mit Puderzucker oder Marmelade servieren.',
        kategorie: 'Frühstück',
        mahlzeit: 'fruehstueck',
        portionen: 2,
        zeit: 15
    },
    {
        id: 'porridge',
        name: 'Porridge / Haferbrei',
        zutaten: [
            { name: 'Haferflocken', menge: '100g' },
            { name: 'Hafermilch', menge: '300ml' },
            { name: 'Banane', menge: '1 Stück' },
            { name: 'Honig', menge: '1 TL' }
        ],
        anleitung: 'Haferflocken und Hafermilch in einem Topf bei mittlerer Hitze unter Rühren 5 Minuten kochen bis der Brei cremig ist. In eine Schüssel füllen. Banane in Scheiben schneiden und obenauf legen. Mit Honig verfeinern.',
        kategorie: 'Frühstück',
        mahlzeit: 'fruehstueck',
        portionen: 1,
        zeit: 10
    },
    {
        id: 'avocado-toast',
        name: 'Avocado-Toast',
        zutaten: [
            { name: 'Brot', menge: '2 Scheiben' },
            { name: 'Avocado', menge: '1 Stück' },
            { name: 'Zitronensaft', menge: '1 TL' },
            { name: 'Salz', menge: '1 Prise' },
            { name: 'Pfeffer', menge: '1 Prise' }
        ],
        anleitung: 'Brot toasten. Avocado halbieren, Kern entfernen und das Fruchtfleisch mit einer Gabel zerdrücken. Mit Zitronensaft, Salz und Pfeffer abschmecken. Auf dem Toast verteilen. Optional mit Chili-Flocken oder einem Ei toppen.',
        kategorie: 'Frühstück',
        mahlzeit: 'fruehstueck',
        portionen: 1,
        zeit: 8
    },
    {
        id: 'joghurt-mit-fruechten',
        name: 'Joghurt mit Früchten',
        zutaten: [
            { name: 'Joghurt', menge: '200g' },
            { name: 'Erdbeeren', menge: '100g' },
            { name: 'Honig', menge: '1 TL' },
            { name: 'Haferflocken', menge: '2 EL' }
        ],
        anleitung: 'Joghurt in eine Schüssel geben. Erdbeeren waschen, vierteln und darauf verteilen. Mit Honig beträufeln und mit Haferflocken bestreuen.',
        kategorie: 'Frühstück',
        mahlzeit: 'fruehstueck',
        portionen: 1,
        zeit: 5
    },
    {
        id: 'brot-mit-aufschnitt',
        name: 'Brot mit Aufschnitt',
        zutaten: [
            { name: 'Brot', menge: '4 Scheiben' },
            { name: 'Butter', menge: '2 EL' },
            { name: 'Schinken', menge: '100g' },
            { name: 'Käse', menge: '4 Scheiben' }
        ],
        anleitung: 'Brot schneiden. Butter gleichmäßig aufstreichen. Mit Schinken und Käse belegen. Nach Belieben mit Salat oder Gurke ergänzen.',
        kategorie: 'Frühstück',
        mahlzeit: 'fruehstueck',
        portionen: 2,
        zeit: 5
    },

    // ── MITTAGESSEN ─────────────────────────────────
    {
        id: 'pasta-carbonara',
        name: 'Pasta Carbonara',
        zutaten: [
            { name: 'Spaghetti', menge: '400g' },
            { name: 'Speck', menge: '150g' },
            { name: 'Eier', menge: '3 Stück' },
            { name: 'Parmesan', menge: '80g' },
            { name: 'Pfeffer', menge: 'nach Geschmack' }
        ],
        anleitung: 'Spaghetti al dente kochen. Speck würfeln und ohne Fett knusprig braten. Eier mit geriebenem Parmesan und Pfeffer verquirlen. Pasta abgießen, etwas Kochwasser aufheben. Heiße Pasta mit Speck vermengen, vom Herd nehmen, Ei-Käse-Mischung unterrühren. Bei Bedarf Kochwasser zugeben.',
        kategorie: 'Hauptgericht',
        mahlzeit: 'mittag',
        portionen: 4,
        zeit: 25
    },
    {
        id: 'tomatensuppe',
        name: 'Cremige Tomatensuppe',
        zutaten: [
            { name: 'Tomaten', menge: '800g' },
            { name: 'Zwiebel', menge: '1 Stück' },
            { name: 'Knoblauch', menge: '2 Zehen' },
            { name: 'Gemüsebrühe', menge: '500ml' },
            { name: 'Olivenöl', menge: '2 EL' },
            { name: 'Sahne', menge: '100ml' }
        ],
        anleitung: 'Zwiebel und Knoblauch fein hacken und in Olivenöl anbraten. Tomaten grob würfeln und hinzufügen. Mit Brühe auffüllen und 20 Minuten köcheln. Suppe pürieren, Sahne unterrühren. Mit Salz, Pfeffer und Basilikum abschmecken.',
        kategorie: 'Suppe',
        mahlzeit: 'mittag',
        portionen: 4,
        zeit: 30
    },
    {
        id: 'kartoffelsuppe',
        name: 'Kartoffelsuppe',
        zutaten: [
            { name: 'Kartoffeln', menge: '600g' },
            { name: 'Karotten', menge: '2 Stück' },
            { name: 'Zwiebel', menge: '1 Stück' },
            { name: 'Gemüsebrühe', menge: '1 Liter' },
            { name: 'Speck', menge: '80g' },
            { name: 'Petersilie', menge: '1 Bund' }
        ],
        anleitung: 'Speck würfeln und anbraten. Zwiebel fein hacken und mitbraten. Kartoffeln und Karotten schälen, würfeln und hinzufügen. Mit Brühe auffüllen. 20 Minuten köcheln bis das Gemüse weich ist. Einen Teil pürieren für cremige Konsistenz. Mit Petersilie garnieren.',
        kategorie: 'Suppe',
        mahlzeit: 'mittag',
        portionen: 4,
        zeit: 35
    },
    {
        id: 'wraps-haehnchen',
        name: 'Wraps mit Hähnchen',
        zutaten: [
            { name: 'Tortilla-Wraps', menge: '4 Stück' },
            { name: 'Hähnchenbrust', menge: '300g' },
            { name: 'Paprika', menge: '1 Stück' },
            { name: 'Salat', menge: '4 Blätter' },
            { name: 'Joghurt', menge: '100g' },
            { name: 'Olivenöl', menge: '1 EL' }
        ],
        anleitung: 'Hähnchenbrust in Streifen schneiden, in Olivenöl mit Paprika würzen und anbraten. Paprika in Streifen schneiden. Wraps kurz in der Pfanne erwärmen. Mit Joghurt bestreichen, Salat, Paprika und Hähnchen belegen. Aufrollen und servieren.',
        kategorie: 'Hauptgericht',
        mahlzeit: 'mittag',
        portionen: 2,
        zeit: 25
    },
    {
        id: 'pasta-pesto',
        name: 'Pasta mit Pesto',
        zutaten: [
            { name: 'Spaghetti', menge: '400g' },
            { name: 'Pesto', menge: '4 EL' },
            { name: 'Parmesan', menge: '50g' },
            { name: 'Kirschtomaten', menge: '200g' },
            { name: 'Olivenöl', menge: '2 EL' }
        ],
        anleitung: 'Pasta nach Packungsanleitung kochen. Kirschtomaten halbieren. Fertige Pasta abgießen, etwas Kochwasser aufheben. Pasta mit Pesto und etwas Kochwasser cremig verrühren. Tomaten unterheben. Mit Parmesan bestreuen.',
        kategorie: 'Hauptgericht',
        mahlzeit: 'mittag',
        portionen: 4,
        zeit: 20
    },
    {
        id: 'thunfisch-pasta',
        name: 'Thunfisch-Pasta',
        zutaten: [
            { name: 'Nudeln', menge: '400g' },
            { name: 'Thunfisch', menge: '2 Dosen' },
            { name: 'Tomatenpassata', menge: '300ml' },
            { name: 'Zwiebel', menge: '1 Stück' },
            { name: 'Knoblauch', menge: '2 Zehen' },
            { name: 'Olivenöl', menge: '2 EL' }
        ],
        anleitung: 'Nudeln kochen. Zwiebel und Knoblauch in Olivenöl anbraten. Tomatenpassata hinzufügen und 10 Minuten köcheln. Thunfisch abtropfen und unterheben. Mit Salz, Pfeffer und Oregano abschmecken. Über die Nudeln geben.',
        kategorie: 'Hauptgericht',
        mahlzeit: 'mittag',
        portionen: 4,
        zeit: 25
    },
    {
        id: 'reispfanne',
        name: 'Bunte Reispfanne',
        zutaten: [
            { name: 'Reis', menge: '300g' },
            { name: 'Paprika', menge: '2 Stück' },
            { name: 'Karotten', menge: '2 Stück' },
            { name: 'Zwiebel', menge: '1 Stück' },
            { name: 'Eier', menge: '2 Stück' },
            { name: 'Sojasoße', menge: '3 EL' },
            { name: 'Olivenöl', menge: '2 EL' }
        ],
        anleitung: 'Reis vorkochen und abkühlen lassen. Gemüse in kleine Würfel schneiden und in Olivenöl scharf anbraten. Reis hinzufügen und mitbraten. Eier dazugeben und verquirlen. Alles mit Sojasoße würzen. Bei Bedarf mit Salz und Pfeffer abschmecken.',
        kategorie: 'Hauptgericht',
        mahlzeit: 'mittag',
        portionen: 3,
        zeit: 30
    },
    {
        id: 'erbsensuppe',
        name: 'Erbsensuppe',
        zutaten: [
            { name: 'Erbsen', menge: '500g' },
            { name: 'Kartoffeln', menge: '300g' },
            { name: 'Speck', menge: '100g' },
            { name: 'Gemüsebrühe', menge: '1 Liter' },
            { name: 'Zwiebel', menge: '1 Stück' }
        ],
        anleitung: 'Speck würfeln und anbraten. Zwiebel fein hacken und mitbraten. Kartoffeln würfeln und mit Erbsen und Brühe hinzufügen. 25 Minuten köcheln. Nach Belieben pürieren oder stückig lassen. Mit Salz und Pfeffer abschmecken.',
        kategorie: 'Suppe',
        mahlzeit: 'mittag',
        portionen: 4,
        zeit: 35
    },

    // ── ABENDESSEN ──────────────────────────────────
    {
        id: 'lachs-mit-reis',
        name: 'Lachsfilet mit Reis',
        zutaten: [
            { name: 'Lachsfilet', menge: '2 Stück' },
            { name: 'Reis', menge: '200g' },
            { name: 'Zitrone', menge: '1 Stück' },
            { name: 'Butter', menge: '1 EL' },
            { name: 'Salz', menge: '1 TL' },
            { name: 'Pfeffer', menge: '1 TL' }
        ],
        anleitung: 'Reis nach Packungsanleitung kochen. Lachsfilet mit Salz, Pfeffer und Zitronensaft würzen. Butter in einer Pfanne erhitzen und den Lachs von jeder Seite 3-4 Minuten braten. Mit Reis und Zitronenspalten servieren.',
        kategorie: 'Hauptgericht',
        mahlzeit: 'abend',
        portionen: 2,
        zeit: 25
    },
    {
        id: 'chili-con-carne',
        name: 'Chili con Carne',
        zutaten: [
            { name: 'Hackfleisch', menge: '400g' },
            { name: 'Kidneybohnen', menge: '1 Dose' },
            { name: 'Mais', menge: '1 Dose' },
            { name: 'Tomatenpassata', menge: '400ml' },
            { name: 'Zwiebel', menge: '1 Stück' },
            { name: 'Knoblauch', menge: '2 Zehen' },
            { name: 'Chili', menge: '1 Stück' }
        ],
        anleitung: 'Zwiebel und Knoblauch hacken und anbraten. Hackfleisch hinzufügen und krümelig braten. Mit Paprikapulver, Cumin und Chili würzen. Tomatenpassata, Bohnen und Mais hinzufügen. 30 Minuten bei niedriger Hitze köcheln. Mit Salz abschmecken.',
        kategorie: 'Hauptgericht',
        mahlzeit: 'abend',
        portionen: 4,
        zeit: 45
    },
    {
        id: 'bratwurst-sauerkraut',
        name: 'Bratwurst mit Sauerkraut',
        zutaten: [
            { name: 'Bratwurst', menge: '4 Stück' },
            { name: 'Sauerkraut', menge: '500g' },
            { name: 'Kartoffeln', menge: '600g' },
            { name: 'Zwiebel', menge: '1 Stück' },
            { name: 'Öl', menge: '2 EL' }
        ],
        anleitung: 'Kartoffeln kochen. Zwiebel in Ringe schneiden und in Öl glasig braten. Sauerkraut hinzufügen und 15 Minuten köcheln. Bratwürste in einer Pfanne rundum goldbraun braten. Mit Sauerkraut und Kartoffeln servieren.',
        kategorie: 'Hauptgericht',
        mahlzeit: 'abend',
        portionen: 4,
        zeit: 40
    },
    {
        id: 'putenbrust-gemuese',
        name: 'Putenbrust mit Gemüse',
        zutaten: [
            { name: 'Putenbrust', menge: '400g' },
            { name: 'Zucchini', menge: '1 Stück' },
            { name: 'Paprika', menge: '1 Stück' },
            { name: 'Karotten', menge: '2 Stück' },
            { name: 'Olivenöl', menge: '2 EL' },
            { name: 'Kräuter der Provence', menge: '1 TL' }
        ],
        anleitung: 'Putenbrust in Scheiben schneiden und mit Kräutern würzen. In Olivenöl von beiden Seiten 4 Minuten braten. Gemüse in Scheiben schneiden und in derselben Pfanne 5 Minuten garen. Mit Salz und Pfeffer abschmecken.',
        kategorie: 'Hauptgericht',
        mahlzeit: 'abend',
        portionen: 2,
        zeit: 25
    },
    {
        id: 'kartoffelgratin',
        name: 'Kartoffelgratin',
        zutaten: [
            { name: 'Kartoffeln', menge: '800g' },
            { name: 'Sahne', menge: '300ml' },
            { name: 'Käse', menge: '150g' },
            { name: 'Knoblauch', menge: '1 Zehe' },
            { name: 'Butter', menge: '1 EL' },
            { name: 'Muskat', menge: '1 Prise' }
        ],
        anleitung: 'Kartoffeln schälen und in dünne Scheiben schneiden. Auflaufform mit Butter einfetten und mit Knoblauch ausreiben. Kartoffeln schichten, mit Sahne übergießen, mit Muskat und Salz würzen. Mit geriebenem Käse bestreuen. Bei 180°C 45 Minuten backen.',
        kategorie: 'Hauptgericht',
        mahlzeit: 'abend',
        portionen: 4,
        zeit: 60
    },
    {
        id: 'flammkuchen',
        name: 'Flammkuchen',
        zutaten: [
            { name: 'Mehl', menge: '300g' },
            { name: 'Speck', menge: '150g' },
            { name: 'Zwiebel', menge: '2 Stück' },
            { name: 'Schmand', menge: '200g' },
            { name: 'Salz', menge: '1 TL' },
            { name: 'Olivenöl', menge: '3 EL' }
        ],
        anleitung: 'Mehl, Salz, Olivenöl und Wasser zu einem dünnen Teig kneten, 20 Minuten ruhen lassen. Dünn ausrollen. Schmand darauf verstreichen. Mit Speck und Zwiebelringen belegen. Bei 250°C 12-15 Minuten backen bis die Ränder knusprig sind.',
        kategorie: 'Hauptgericht',
        mahlzeit: 'abend',
        portionen: 2,
        zeit: 40
    },
    {
        id: 'pizza-selber-backen',
        name: 'Pizza selbst gebacken',
        zutaten: [
            { name: 'Mehl', menge: '400g' },
            { name: 'Tomatenpassata', menge: '200ml' },
            { name: 'Käse', menge: '200g' },
            { name: 'Paprika', menge: '1 Stück' },
            { name: 'Salz', menge: '1 TL' },
            { name: 'Olivenöl', menge: '3 EL' }
        ],
        anleitung: 'Mehl mit Salz, Olivenöl, Hefe und warmem Wasser zu einem Teig kneten. 1 Stunde gehen lassen. Dünn ausrollen. Tomatenpassata als Basis aufstreichen, mit geriebenem Käse und Belag belegen. Bei 230°C 12-15 Minuten backen.',
        kategorie: 'Hauptgericht',
        mahlzeit: 'abend',
        portionen: 2,
        zeit: 90
    },
    {
        id: 'schweinefilet-nudeln',
        name: 'Schweinefilet mit Nudeln',
        zutaten: [
            { name: 'Schweinefilet', menge: '400g' },
            { name: 'Nudeln', menge: '300g' },
            { name: 'Sahne', menge: '200ml' },
            { name: 'Pilze', menge: '200g' },
            { name: 'Zwiebel', menge: '1 Stück' },
            { name: 'Olivenöl', menge: '2 EL' }
        ],
        anleitung: 'Nudeln kochen. Schweinefilet in Medaillons schneiden und in Olivenöl scharf anbraten. Herausnehmen. Zwiebeln und Pilze im Bratfett anbraten. Sahne hinzufügen und 5 Minuten einkochen. Fleisch zurück in die Pfanne. Mit Nudeln servieren.',
        kategorie: 'Hauptgericht',
        mahlzeit: 'abend',
        portionen: 3,
        zeit: 35
    },
    {
        id: 'eintopf-gemuese',
        name: 'Gemüse-Eintopf',
        zutaten: [
            { name: 'Kartoffeln', menge: '400g' },
            { name: 'Karotten', menge: '3 Stück' },
            { name: 'Sellerie', menge: '1 Stück' },
            { name: 'Zucchini', menge: '1 Stück' },
            { name: 'Gemüsebrühe', menge: '1 Liter' },
            { name: 'Zwiebel', menge: '1 Stück' },
            { name: 'Olivenöl', menge: '2 EL' }
        ],
        anleitung: 'Alle Gemüse schälen und in Würfel schneiden. Zwiebel in Olivenöl anbraten. Restliches Gemüse hinzufügen und kurz mitbraten. Mit Brühe auffüllen und 25 Minuten köcheln bis alles weich ist. Mit Salz, Pfeffer und frischen Kräutern abschmecken.',
        kategorie: 'Suppe',
        mahlzeit: 'abend',
        portionen: 4,
        zeit: 40
    },

    // ── SNACKS ──────────────────────────────────────
    {
        id: 'smoothie',
        name: 'Frucht-Smoothie',
        zutaten: [
            { name: 'Banane', menge: '1 Stück' },
            { name: 'Erdbeeren', menge: '100g' },
            { name: 'Hafermilch', menge: '250ml' },
            { name: 'Honig', menge: '1 TL' }
        ],
        anleitung: 'Alle Zutaten in einen Mixer geben. Auf höchster Stufe 30 Sekunden mixen bis eine cremige Konsistenz entsteht. Sofort servieren.',
        kategorie: 'Snack',
        mahlzeit: 'snack',
        portionen: 1,
        zeit: 5
    },
    {
        id: 'bananenbrot',
        name: 'Bananenbrot',
        zutaten: [
            { name: 'Bananen', menge: '3 Stück (reif)' },
            { name: 'Mehl', menge: '200g' },
            { name: 'Eier', menge: '2 Stück' },
            { name: 'Zucker', menge: '80g' },
            { name: 'Butter', menge: '80g' },
            { name: 'Backpulver', menge: '1 TL' }
        ],
        anleitung: 'Ofen auf 180°C vorheizen. Bananen zerdrücken. Mit weicher Butter und Zucker verrühren. Eier einrühren. Mehl und Backpulver untermengen. In eine gefettete Kastenform füllen. 50-60 Minuten backen. Stäbchenprobe machen.',
        kategorie: 'Snack',
        mahlzeit: 'snack',
        portionen: 8,
        zeit: 70
    },
    {
        id: 'toast-kaese',
        name: 'Überbackener Käsetoast',
        zutaten: [
            { name: 'Toast', menge: '4 Scheiben' },
            { name: 'Käse', menge: '100g' },
            { name: 'Butter', menge: '1 EL' },
            { name: 'Senf', menge: '1 TL' }
        ],
        anleitung: 'Toast leicht toasten. Mit Butter und Senf bestreichen. Käsescheiben darauflegen. Im Ofen oder Toaster-Ofen bei 200°C 5 Minuten backen bis der Käse blubbert und goldbraun ist.',
        kategorie: 'Snack',
        mahlzeit: 'snack',
        portionen: 2,
        zeit: 10
    },
    {
        id: 'quark-mit-fruechten',
        name: 'Quark mit Früchten',
        zutaten: [
            { name: 'Quark', menge: '250g' },
            { name: 'Apfel', menge: '1 Stück' },
            { name: 'Honig', menge: '1 EL' },
            { name: 'Zimt', menge: '1 Prise' }
        ],
        anleitung: 'Quark mit Honig und Zimt glatt rühren. Apfel waschen, entkernen und in kleine Würfel schneiden. Unter den Quark heben. In Schüsseln verteilen und nach Belieben mit Nüssen toppen.',
        kategorie: 'Snack',
        mahlzeit: 'snack',
        portionen: 2,
        zeit: 5
    },
    {
        id: 'energieball',
        name: 'Energie-Balls',
        zutaten: [
            { name: 'Haferflocken', menge: '150g' },
            { name: 'Honig', menge: '3 EL' },
            { name: 'Erdnussbutter', menge: '2 EL' },
            { name: 'Schokolade', menge: '50g' }
        ],
        anleitung: 'Schokolade grob hacken. Alle Zutaten in einer Schüssel vermischen bis ein klebriger Teig entsteht. Für 30 Minuten in den Kühlschrank stellen. Mit befeuchteten Händen kleine Kugeln formen. Im Kühlschrank aufbewahren.',
        kategorie: 'Snack',
        mahlzeit: 'snack',
        portionen: 12,
        zeit: 15
    },

    // ── SALATE ──────────────────────────────────────
    {
        id: 'griechischer-salat',
        name: 'Griechischer Salat',
        zutaten: [
            { name: 'Tomaten', menge: '3 Stück' },
            { name: 'Gurke', menge: '1 Stück' },
            { name: 'Paprika', menge: '1 Stück' },
            { name: 'Oliven', menge: '100g' },
            { name: 'Feta', menge: '200g' },
            { name: 'Olivenöl', menge: '3 EL' }
        ],
        anleitung: 'Tomaten, Gurke und Paprika in grobe Stücke schneiden. In einer großen Schüssel vermengen. Oliven und in Würfel geschnittenen Feta hinzufügen. Mit Olivenöl, Oregano, Salz und Pfeffer anmachen.',
        kategorie: 'Salat',
        mahlzeit: 'salat',
        portionen: 2,
        zeit: 10
    },
    {
        id: 'nudelsalat',
        name: 'Nudelsalat',
        zutaten: [
            { name: 'Nudeln', menge: '300g' },
            { name: 'Paprika', menge: '1 Stück' },
            { name: 'Gurke', menge: '1/2 Stück' },
            { name: 'Mais', menge: '1 Dose' },
            { name: 'Mayonnaise', menge: '4 EL' },
            { name: 'Essig', menge: '2 EL' }
        ],
        anleitung: 'Nudeln kochen und abkühlen lassen. Paprika und Gurke würfeln. Mais abtropfen. Alle Zutaten vermengen. Aus Mayonnaise, Essig, Salz und Pfeffer ein Dressing anrühren und unterheben. Mindestens 1 Stunde ziehen lassen.',
        kategorie: 'Salat',
        mahlzeit: 'salat',
        portionen: 4,
        zeit: 25
    },
    {
        id: 'wurstsalat',
        name: 'Wurstsalat',
        zutaten: [
            { name: 'Aufschnitt', menge: '200g' },
            { name: 'Zwiebel', menge: '1 Stück' },
            { name: 'Gurke', menge: '1/2 Stück' },
            { name: 'Essig', menge: '3 EL' },
            { name: 'Öl', menge: '3 EL' }
        ],
        anleitung: 'Aufschnitt in Streifen schneiden. Zwiebel in feine Ringe, Gurke in Scheiben schneiden. Alles vermengen. Aus Essig, Öl, Salz und Pfeffer ein Dressing anrühren. Über den Salat geben und 30 Minuten ziehen lassen.',
        kategorie: 'Salat',
        mahlzeit: 'salat',
        portionen: 2,
        zeit: 15
    },
    {
        id: 'coleslaw',
        name: 'Coleslaw (Krautsalat)',
        zutaten: [
            { name: 'Weißkohl', menge: '500g' },
            { name: 'Karotten', menge: '2 Stück' },
            { name: 'Mayonnaise', menge: '3 EL' },
            { name: 'Joghurt', menge: '2 EL' },
            { name: 'Essig', menge: '2 EL' },
            { name: 'Zucker', menge: '1 TL' }
        ],
        anleitung: 'Weißkohl in feine Streifen schneiden, Karotten raspeln. Mit Salz vermengen und 15 Minuten ziehen lassen, dann ausdrücken. Dressing aus Mayonnaise, Joghurt, Essig und Zucker anrühren. Alles vermengen und 1 Stunde kühlen.',
        kategorie: 'Salat',
        mahlzeit: 'salat',
        portionen: 4,
        zeit: 20
    }
];
