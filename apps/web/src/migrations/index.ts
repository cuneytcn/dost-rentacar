import * as migration_20260930_092053_initial from './20260930_092053_initial'
import * as migration_20260930_092100_reservation_overlap_guard from './20260930_092100_reservation_overlap_guard'
import * as migration_20260930_110959_jobs_and_reminders from './20260930_110959_jobs_and_reminders'
import * as migration_20260930_112520_vehicle_document_reminders from './20260930_112520_vehicle_document_reminders'
import * as migration_20260930_173024_currency_defaults_try from './20260930_173024_currency_defaults_try'
import * as migration_20260930_173531_settings_authorization_number from './20260930_173531_settings_authorization_number'
import * as migration_20260930_175052_media_credit from './20260930_175052_media_credit'

export const migrations = [
  {
    up: migration_20260930_092053_initial.up,
    down: migration_20260930_092053_initial.down,
    name: '20260930_092053_initial',
  },
  {
    up: migration_20260930_092100_reservation_overlap_guard.up,
    down: migration_20260930_092100_reservation_overlap_guard.down,
    name: '20260930_092100_reservation_overlap_guard',
  },
  {
    up: migration_20260930_110959_jobs_and_reminders.up,
    down: migration_20260930_110959_jobs_and_reminders.down,
    name: '20260930_110959_jobs_and_reminders',
  },
  {
    up: migration_20260930_112520_vehicle_document_reminders.up,
    down: migration_20260930_112520_vehicle_document_reminders.down,
    name: '20260930_112520_vehicle_document_reminders',
  },
  {
    up: migration_20260930_173024_currency_defaults_try.up,
    down: migration_20260930_173024_currency_defaults_try.down,
    name: '20260930_173024_currency_defaults_try',
  },
  {
    up: migration_20260930_173531_settings_authorization_number.up,
    down: migration_20260930_173531_settings_authorization_number.down,
    name: '20260930_173531_settings_authorization_number',
  },
  {
    up: migration_20260930_175052_media_credit.up,
    down: migration_20260930_175052_media_credit.down,
    name: '20260930_175052_media_credit',
  },
]
