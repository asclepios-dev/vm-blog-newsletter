import * as migration_20260116_203055 from './20260116_203055';

export const migrations = [
  {
    up: migration_20260116_203055.up,
    down: migration_20260116_203055.down,
    name: '20260116_203055'
  },
];
