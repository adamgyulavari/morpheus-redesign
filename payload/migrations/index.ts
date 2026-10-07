import * as migration_20261007_231747_initial from './20261007_231747_initial';
import * as migration_20261007_234934_ui_not_found from './20261007_234934_ui_not_found';

export const migrations = [
  {
    up: migration_20261007_231747_initial.up,
    down: migration_20261007_231747_initial.down,
    name: '20261007_231747_initial',
  },
  {
    up: migration_20261007_234934_ui_not_found.up,
    down: migration_20261007_234934_ui_not_found.down,
    name: '20261007_234934_ui_not_found'
  },
];
