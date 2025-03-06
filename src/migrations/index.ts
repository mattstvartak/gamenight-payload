import * as migration_20250306_010210 from './20250306_010210';

export const migrations = [
  {
    up: migration_20250306_010210.up,
    down: migration_20250306_010210.down,
    name: '20250306_010210'
  },
];
