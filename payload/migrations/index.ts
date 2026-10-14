import * as migration_20261007_231747_initial from './20261007_231747_initial';
import * as migration_20261007_234934_ui_not_found from './20261007_234934_ui_not_found';
import * as migration_20261008_001030_seo_redirects from './20261008_001030_seo_redirects';
import * as migration_20261010_233009_s3_object_key from './20261010_233009_s3_object_key';
import * as migration_20261011_133053_accounts from './20261011_133053_accounts';
import * as migration_20261011_133108_drop_user_role from './20261011_133108_drop_user_role';
import * as migration_20261011_190535_login_codes from './20261011_190535_login_codes';
import * as migration_20261011_214820_rooms_sessions from './20261011_214820_rooms_sessions';
import * as migration_20261011_215504_booking_note from './20261011_215504_booking_note';
import * as migration_20261012_061100_room_booking_permission from './20261012_061100_room_booking_permission';
import * as migration_20261013_014650_applications from './20261013_014650_applications';
import * as migration_20261013_021132_workshop_cutoff_job from './20261013_021132_workshop_cutoff_job';
import * as migration_20261013_025650_signup_pages from './20261013_025650_signup_pages';
import * as migration_20261013_030125_remove_static_dates from './20261013_030125_remove_static_dates';
import * as migration_20261014_014745_workshop_defaults from './20261014_014745_workshop_defaults';
import * as migration_20261014_051509_signup_mode from './20261014_051509_signup_mode';
import * as migration_20261014_051547_remove_signup_enabled from './20261014_051547_remove_signup_enabled';

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
    name: '20261011_133108_drop_user_role',
  },
  {
    up: migration_20261011_190535_login_codes.up,
    down: migration_20261011_190535_login_codes.down,
    name: '20261011_190535_login_codes',
  },
  {
    up: migration_20261011_214820_rooms_sessions.up,
    down: migration_20261011_214820_rooms_sessions.down,
    name: '20261011_214820_rooms_sessions',
  },
  {
    up: migration_20261011_215504_booking_note.up,
    down: migration_20261011_215504_booking_note.down,
    name: '20261011_215504_booking_note',
  },
  {
    up: migration_20261012_061100_room_booking_permission.up,
    down: migration_20261012_061100_room_booking_permission.down,
    name: '20261012_061100_room_booking_permission',
  },
  {
    up: migration_20261013_014650_applications.up,
    down: migration_20261013_014650_applications.down,
    name: '20261013_014650_applications',
  },
  {
    up: migration_20261013_021132_workshop_cutoff_job.up,
    down: migration_20261013_021132_workshop_cutoff_job.down,
    name: '20261013_021132_workshop_cutoff_job',
  },
  {
    up: migration_20261013_025650_signup_pages.up,
    down: migration_20261013_025650_signup_pages.down,
    name: '20261013_025650_signup_pages',
  },
  {
    up: migration_20261013_030125_remove_static_dates.up,
    down: migration_20261013_030125_remove_static_dates.down,
    name: '20261013_030125_remove_static_dates',
  },
  {
    up: migration_20261014_014745_workshop_defaults.up,
    down: migration_20261014_014745_workshop_defaults.down,
    name: '20261014_014745_workshop_defaults',
  },
  {
    up: migration_20261014_051509_signup_mode.up,
    down: migration_20261014_051509_signup_mode.down,
    name: '20261014_051509_signup_mode',
  },
  {
    up: migration_20261014_051547_remove_signup_enabled.up,
    down: migration_20261014_051547_remove_signup_enabled.down,
    name: '20261014_051547_remove_signup_enabled'
  },
];
