import { exportDB, importInto, peakImportFile } from 'dexie-export-import';
import { db } from './schema';

/**
 * Export entire database to JSON file
 * @param {Function} setProgress - Callback to update progress (0-100)
 * @param {Function} setMessage - Callback to update status message
 * @returns {Promise<boolean>} - True on success, false on error
 */
export async function exportDatabase(setProgress, setMessage) {
  try {
    setMessage('Exportiere Datenbank...');
    setProgress(0);

    const blob = await exportDB(db, {
      prettyJson: true,
      progressCallback: ({ completedRows, totalRows }) => {
        const percent = Math.round((completedRows / totalRows) * 100);
        setProgress(percent);
        return true;
      }
    });

    const date = new Date().toISOString().split('T')[0];
    const filename = `der-stille-helfer-${date}.json`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setMessage('Export erfolgreich!');
    return true;
  } catch (error) {
    console.error('Export error:', error);
    setMessage(`Fehler beim Export: ${error.message}`);
    return false;
  }
}

/**
 * Validate backup file before import
 * @param {File} file - The backup JSON file to validate
 * @returns {Promise<{valid: boolean, meta?: object, error?: string}>}
 */
export async function validateBackupFile(file) {
  try {
    const meta = await peakImportFile(file);

    if (meta.data.databaseName !== 'DerStilleHelfer') {
      return {
        valid: false,
        error: `Falsche Datenbank: Erwartet 'DerStilleHelfer', gefunden '${meta.data.databaseName}'`
      };
    }

    if (meta.data.databaseVersion > db.verno) {
      return {
        valid: false,
        error: `Backup ist von neuerer Version (v${meta.data.databaseVersion}), aktuelle Version ist v${db.verno}`
      };
    }

    const requiredTables = ['personen', 'produkte', 'base_rezepte', 'eigene_rezepte',
                            'varianten', 'favoriten', 'einkaufsliste', 'notizen', 'profile'];
    const importTables = meta.data.tables.map(t => t.name);
    const missingTables = requiredTables.filter(t => !importTables.includes(t));

    if (missingTables.length > 0) {
      return {
        valid: false,
        error: `Fehlende Tabellen: ${missingTables.join(', ')}`
      };
    }

    return { valid: true, meta };
  } catch (error) {
    return { valid: false, error: `Datei nicht lesbar: ${error.message}` };
  }
}

/**
 * Import database from JSON file
 * @param {File} file - The backup JSON file to import
 * @param {Function} setProgress - Callback to update progress (0-100)
 * @param {Function} setMessage - Callback to update status message
 * @returns {Promise<boolean>} - True on success, false on error
 */
export async function importDatabase(file, setProgress, setMessage) {
  try {
    setMessage('Validiere Datei...');
    const validation = await validateBackupFile(file);

    if (!validation.valid) {
      setMessage(validation.error);
      return false;
    }

    setMessage('Importiere Datenbank...');
    setProgress(0);

    await importInto(db, file, {
      clearTablesBeforeImport: true,
      overwriteValues: true,
      acceptVersionDiff: true,
      progressCallback: ({ completedRows, totalRows }) => {
        const percent = Math.round((completedRows / totalRows) * 100);
        setProgress(percent);
        return true;
      }
    });

    setMessage('Import erfolgreich! Seite wird neu geladen...');
    setTimeout(() => window.location.reload(), 1500);
    return true;
  } catch (error) {
    console.error('Import error:', error);
    setMessage(`Fehler beim Import: ${error.message}`);
    return false;
  }
}
