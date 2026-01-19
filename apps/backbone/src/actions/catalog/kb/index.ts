import { registry } from '../../registry.js';
import { kbSearch } from './search.js';

// Register all kb actions
registry.register(kbSearch);

export { kbSearch };
