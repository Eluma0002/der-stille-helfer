// OpenFoodFacts API Integration
const API_BASE = 'https://world.openfoodfacts.org/api/v2';

export const searchProduct = async (barcode) => {
    try {
        const response = await fetch(`${API_BASE}/product/${barcode}.json`);
        const data = await response.json();

        if (data.status === 1 && data.product) {
            const product = data.product;
            return {
                found: true,
                name: product.product_name || product.product_name_de || 'Unbekanntes Produkt',
                brand: product.brands || '',
                category: guessCategory(product),
                image: product.image_url || null,
                barcode: barcode
            };
        }

        return {
            found: false,
            barcode: barcode
        };
    } catch (error) {
        console.error('OpenFoodFacts API error:', error);
        return {
            found: false,
            error: error.message,
            barcode: barcode
        };
    }
};

// Guess German storage category from OpenFoodFacts categories
const guessCategory = (product) => {
    const categories = (product.categories || '').toLowerCase();
    const productName = (product.product_name || '').toLowerCase();

    // Milchprodukte → kuehlschrank
    if (categories.includes('milk') || categories.includes('dairy') ||
        categories.includes('milch') || categories.includes('käse') ||
        categories.includes('joghurt') || categories.includes('butter')) {
        return 'kuehlschrank';
    }

    // Tiefkühlprodukte → gefrierschrank
    if (categories.includes('frozen') || categories.includes('tiefkühl')) {
        return 'gefrierschrank';
    }

    // Getränke → getraenke
    if (categories.includes('beverage') || categories.includes('drink') ||
        categories.includes('getränk') || categories.includes('saft') ||
        categories.includes('water') || categories.includes('wasser')) {
        return 'getraenke';
    }

    // Gewürze → gewuerze
    if (categories.includes('spice') || categories.includes('seasoning') ||
        categories.includes('gewürz') || categories.includes('salz') ||
        categories.includes('pfeffer')) {
        return 'gewuerze';
    }

    // Default: Vorrat (pantry)
    return 'vorrat';
};
