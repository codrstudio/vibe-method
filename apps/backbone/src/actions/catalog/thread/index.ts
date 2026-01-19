import { registry } from '../../registry.js';
import { threadCreate } from './create.js';

// Register all thread actions
registry.register(threadCreate);

export { threadCreate };
