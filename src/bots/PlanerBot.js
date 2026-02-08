import { Bot } from './Bot.js';
export class PlanerBot extends Bot {
    constructor() { super('planer', 'Der Planer', '📅'); }
    suggest(products) {
        if (products.some(p => p.name.includes('Hackfleisch'))) return 'Börek';
        return null;
    }
}
