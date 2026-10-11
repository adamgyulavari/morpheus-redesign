import * as migration_20261007_231747_initial from './20261007_231747_initial';
import * as migration_20261007_234934_ui_not_found from './20261007_234934_ui_not_found';
import * as migration_20261008_001030_seo_redirects from './20261008_001030_seo_redirects';
import * as migration_20261010_233009_s3_object_key from './20261010_233009_s3_object_key';
import * as migration_20261011_133053_accounts from './20261011_133053_accounts';
import * as migration_20261011_133108_drop_user_role from './20261011_133108_drop_user_role';

export const migrations = [
  {
    up: migration_20261007_231747_initial.up,
    down: migration_20261007_231747_initial.down,
    name: '20261007_231747_initial',
  },
  {
    up: migration_20261007_234934_ui_not_found.up,
    down: migration_20261007_234934_ui_not_found.down,
    name: '20261007_234934_ui_not_found',
  },
  {
    up: migration_20261008_001030_seo_redirects.up,
    down: migration_20261008_001030_seo_redirects.down,
    name: '20261008_001030_seo_redirects',
  },
  {
    up: migration_20261010_233009_s3_object_key.up,
    down: migration_20261010_233009_s3_object_key.down,
    name: '20261010_233009_s3_object_key',
  },
  {
    up: migration_20261011_133053_accounts.up,
    down: migration_20261011_133053_accounts.down,
    name: '20261011_133053_accounts',
  },
  {
    up: migration_20261011_133108_drop_user_role.up,
    down: migration_20261011_133108_drop_user_role.down,
    name: '20261011_133108_drop_user_role'
  },
];
