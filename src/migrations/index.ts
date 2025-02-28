import * as migration_20250228_070205 from './20250228_070205';

export const migrations = [
  {
    up: migration_20250228_070205.up,
    down: migration_20250228_070205.down,
    name: '20250228_070205'
  },
];
