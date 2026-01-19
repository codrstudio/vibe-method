import { registry } from '../../registry.js';
import { userUpdate } from './update.js';

// Register all user actions
registry.register(userUpdate);

export { userUpdate };
