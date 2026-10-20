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
import * as migration_20261014_151220_applications_course from './20261014_151220_applications_course';
import * as migration_20261014_161157_payments from './20261014_161157_payments';
import * as migration_20261014_161500_held_in_unique_indexes from './20261014_161500_held_in_unique_indexes';
import * as migration_20261014_162000_aszf_page from './20261014_162000_aszf_page';
import * as migration_20261014_185611_online_payments from './20261014_185611_online_payments';
import * as migration_20261014_214947_drop_expire_orders from './20261014_214947_drop_expire_orders';
import * as migration_20261016_194816_payment_open_status from './20261016_194816_payment_open_status';
import * as migration_20261017_003904_invoices from './20261017_003904_invoices';
import * as migration_20261017_013547_drop_credit from './20261017_013547_drop_credit';
import * as migration_20261017_015357_session_code from './20261017_015357_session_code';
import * as migration_20261017_021712_course_payment from './20261017_021712_course_payment';
import * as migration_20261017_023534_group_payment_options from './20261017_023534_group_payment_options';
import * as migration_20261017_025423_monthly_billing from './20261017_025423_monthly_billing';
import * as migration_20261019_170346_email_texts from './20261019_170346_email_texts';
import * as migration_20261019_182112_facebook_sync from './20261019_182112_facebook_sync';
import * as migration_20261019_202633_refund_note from './20261019_202633_refund_note';
import * as migration_20261019_225500_ui_texts from './20261019_225500_ui_texts';
import * as migration_20261020_003021_show_rooms from './20261020_003021_show_rooms';

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
    name: '20261014_051547_remove_signup_enabled',
  },
  {
    up: migration_20261014_151220_applications_course.up,
    down: migration_20261014_151220_applications_course.down,
    name: '20261014_151220_applications_course',
  },
  {
    up: migration_20261014_161157_payments.up,
    down: migration_20261014_161157_payments.down,
    name: '20261014_161157_payments',
  },
  {
    up: migration_20261014_161500_held_in_unique_indexes.up,
    down: migration_20261014_161500_held_in_unique_indexes.down,
    name: '20261014_161500_held_in_unique_indexes',
  },
  {
    up: migration_20261014_162000_aszf_page.up,
    down: migration_20261014_162000_aszf_page.down,
    name: '20261014_162000_aszf_page',
  },
  {
    up: migration_20261014_185611_online_payments.up,
    down: migration_20261014_185611_online_payments.down,
    name: '20261014_185611_online_payments',
  },
  {
    up: migration_20261014_214947_drop_expire_orders.up,
    down: migration_20261014_214947_drop_expire_orders.down,
    name: '20261014_214947_drop_expire_orders',
  },
  {
    up: migration_20261016_194816_payment_open_status.up,
    down: migration_20261016_194816_payment_open_status.down,
    name: '20261016_194816_payment_open_status',
  },
  {
    up: migration_20261017_003904_invoices.up,
    down: migration_20261017_003904_invoices.down,
    name: '20261017_003904_invoices',
  },
  {
    up: migration_20261017_013547_drop_credit.up,
    down: migration_20261017_013547_drop_credit.down,
    name: '20261017_013547_drop_credit',
  },
  {
    up: migration_20261017_015357_session_code.up,
    down: migration_20261017_015357_session_code.down,
    name: '20261017_015357_session_code',
  },
  {
    up: migration_20261017_021712_course_payment.up,
    down: migration_20261017_021712_course_payment.down,
    name: '20261017_021712_course_payment',
  },
  {
    up: migration_20261017_023534_group_payment_options.up,
    down: migration_20261017_023534_group_payment_options.down,
    name: '20261017_023534_group_payment_options',
  },
  {
    up: migration_20261017_025423_monthly_billing.up,
    down: migration_20261017_025423_monthly_billing.down,
    name: '20261017_025423_monthly_billing',
  },
  {
    up: migration_20261019_170346_email_texts.up,
    down: migration_20261019_170346_email_texts.down,
    name: '20261019_170346_email_texts',
  },
  {
    up: migration_20261019_182112_facebook_sync.up,
    down: migration_20261019_182112_facebook_sync.down,
    name: '20261019_182112_facebook_sync',
  },
  {
    up: migration_20261019_202633_refund_note.up,
    down: migration_20261019_202633_refund_note.down,
    name: '20261019_202633_refund_note',
  },
  {
    up: migration_20261019_225500_ui_texts.up,
    down: migration_20261019_225500_ui_texts.down,
    name: '20261019_225500_ui_texts',
  },
  {
    up: migration_20261020_003021_show_rooms.up,
    down: migration_20261020_003021_show_rooms.down,
    name: '20261020_003021_show_rooms'
  },
];
