export const strings = {
    app: {
        title: 'Der Stille Helfer',
        subtitle: 'Deine persönliche Küchen-App',
        version: '1.0 FINAL'
    },
    nav: {
        uebersicht: 'Übersicht',
        produkte: 'Inventar',
        rezepte: 'Rezepte',
        einkauf: 'Einkauf',
        einstellungen: 'Profil',
        notizen: 'Notizen',
        favoriten: 'Favoriten'
    },
    common: {
        add: 'Hinzufügen',
        edit: 'Bearbeiten',
        delete: 'Löschen',
        save: 'Speichern',
        cancel: 'Abbrechen',
        close: 'Schließen',
        loading: 'Lädt...'
    },
    bots: {
        koch_title: 'Der Koch',
        koch_desc: 'Passt Rezepte an Elvis an.',
        planer_title: 'Der Planer',
        planer_desc: 'Schlägt Rezepte vor.',
        safe: '✓ Sicher für dich',
        adapted: '⟳ Angepasst',
        warning: '⚠ Enthält Allergene'
    },
    recipe: {
        ingredients: 'Zutaten',
        instructions: 'Anleitung',
        category: 'Kategorie',
        servings: 'Portionen',
        time: 'Zeit',
        minutes: 'Minuten',
        loading: 'Rezept wird geladen...',
        notFound: 'Rezept nicht gefunden',
        addToShoppingList: 'Zutaten auf Einkaufsliste',
        addedToList: '{count} Zutat(en) zur Einkaufsliste hinzugefügt',
        allAlreadyOnList: 'Alle Zutaten bereits auf der Liste',
        someAlreadyOnList: '{count} hinzugefügt, {existing} bereits vorhanden'
    },
    notes: {
        title: 'Deine Notizen',
        addNote: '+ Neue Notiz',
        editNote: 'Notiz bearbeiten',
        deleteNote: 'Notiz löschen',
        deleteConfirm: 'Möchtest du diese Notiz wirklich löschen?',
        noNotes: 'Noch keine Notizen',
        placeholderTitle: 'Titel',
        placeholderContent: 'Inhalt',
        validation: {
            required: 'Titel ist erforderlich',
            maxTitle: 'Titel darf maximal 50 Zeichen haben',
            maxContent: 'Inhalt darf maximal 1000 Zeichen haben'
        }
    },
    settings: {
        title: 'Profil & Einstellungen',
        profile: 'Profil-Einstellungen',
        name: 'Name',
        allergies: 'Allergien',
        preferences: 'Präferenzen',
        saveSuccess: 'Profil erfolgreich gespeichert!',
        saveError: 'Fehler beim Speichern des Profils',
        resetApp: 'App Zurücksetzen',
        resetConfirm: 'Möchtest du wirklich alle Daten zurücksetzen?',
        dietaryRestrictions: 'Nahrungsmittel-Einschränkungen',
        noRestrictions: 'Keine Einschränkungen - alle Rezepte sind für dich sicher!',
        restrictionsInfo: 'Diese Zutaten werden in Rezepten automatisch durch Alternativen ersetzt.',
        restrictionCount: 'Einschränkungen'
    },
    products: {
        title: 'Mein Inventar',
        add: 'Hinzufügen',
        sort: {
            expiration: 'Ablaufdatum (bald zuerst)',
            name: 'Name (A-Z)'
        },
        filter: {
            all: 'Alle Lagerorte',
            fridge: 'Kühlschrank',
            freezer: 'Gefrierschrank',
            pantry: 'Vorratskammer'
        },
        noProducts: 'Noch keine Produkte'
    },
    backup: {
        title: 'Datensicherung',
        exportTitle: 'Daten exportieren',
        exportDesc: 'Sichere alle deine Rezepte, Produkte und Einstellungen als JSON-Datei.',
        exportButton: 'Backup herunterladen',
        exportProgress: 'Exportiere...',
        exportSuccess: 'Export erfolgreich!',
        exportError: 'Fehler beim Export',
        importTitle: 'Daten importieren',
        importDesc: 'Stelle deine Daten aus einer Backup-Datei wieder her.',
        importButton: 'Backup auswählen',
        importProgress: 'Importiere...',
        importSuccess: 'Import erfolgreich!',
        importError: 'Fehler beim Import',
        importConfirmTitle: 'Daten überschreiben?',
        importConfirmText: 'Der Import überschreibt ALLE vorhandenen Daten. Diese Aktion kann nicht rückgängig gemacht werden.',
        importConfirmYes: 'Ja, importieren',
        importConfirmNo: 'Abbrechen',
        selectFile: 'Datei auswählen',
        warningTitle: 'Wichtig für Safari-Nutzer',
        warningText: 'Safari löscht App-Daten nach 7 Tagen Inaktivität. Exportiere regelmäßig!'
    }
};
