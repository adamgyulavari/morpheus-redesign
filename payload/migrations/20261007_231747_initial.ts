import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_home_hero_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_home_hero_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_page_hero_buttons_variant" AS ENUM('primary', 'outline');
  CREATE TYPE "public"."enum_pages_blocks_page_hero_buttons_show_if" AS ENUM('upcomingWorkshops');
  CREATE TYPE "public"."enum_pages_blocks_page_hero_layout_shape" AS ENUM('landscape', 'portrait');
  CREATE TYPE "public"."enum_pages_blocks_page_hero_layout_size" AS ENUM('sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_page_hero_layout_position" AS ENUM('top', 'middle', 'bottom');
  CREATE TYPE "public"."enum_pages_blocks_page_hero_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_page_hero_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_cta_band_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_cta_band_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_text_split_size" AS ENUM('md', 'xl');
  CREATE TYPE "public"."enum_pages_blocks_text_split_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_text_split_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_statement_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_statement_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_image_text_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_image_text_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_link_cards_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_link_cards_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_questions_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_questions_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_benefits_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_benefits_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_curriculum_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_curriculum_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_feature_cards_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_feature_cards_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_path_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_path_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_checklist_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_checklist_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_steps_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_steps_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_mood_video_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_mood_video_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_full_image_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_full_image_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_social_band_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_social_band_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_offerings_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_offerings_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_reviews_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_reviews_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_instructor_row_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_instructor_row_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_instructor_grid_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_instructor_grid_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_upcoming_shows_variant" AS ENUM('list', 'byMonth');
  CREATE TYPE "public"."enum_pages_blocks_upcoming_shows_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_upcoming_shows_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_next_show_banner_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_next_show_banner_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_repertoire_groups_group" AS ENUM('company', 'students');
  CREATE TYPE "public"."enum_pages_blocks_repertoire_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_repertoire_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_contact_card_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_contact_card_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_course_starts_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_course_starts_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_course_prices_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_course_prices_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_course_compare_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_course_compare_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_upcoming_workshops_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_upcoming_workshops_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_past_workshops_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_past_workshops_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_open_workshop_sessions_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_open_workshop_sessions_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_programmes_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_programmes_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_quote_request_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_quote_request_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_contact_people_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_contact_people_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_location_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_location_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_legal_document_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_legal_document_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_bio_intro_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_bio_intro_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_bio_next_show_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_bio_next_show_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_link_list_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_link_list_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_social_links_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_social_links_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_contact_footer_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_blocks_contact_footer_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum_pages_layout" AS ENUM('site', 'minimal');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_blocks_home_hero_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_home_hero_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_page_hero_buttons_variant" AS ENUM('primary', 'outline');
  CREATE TYPE "public"."enum__pages_v_blocks_page_hero_buttons_show_if" AS ENUM('upcomingWorkshops');
  CREATE TYPE "public"."enum__pages_v_blocks_page_hero_layout_shape" AS ENUM('landscape', 'portrait');
  CREATE TYPE "public"."enum__pages_v_blocks_page_hero_layout_size" AS ENUM('sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_page_hero_layout_position" AS ENUM('top', 'middle', 'bottom');
  CREATE TYPE "public"."enum__pages_v_blocks_page_hero_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_page_hero_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_band_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_band_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_text_split_size" AS ENUM('md', 'xl');
  CREATE TYPE "public"."enum__pages_v_blocks_text_split_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_text_split_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_statement_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_statement_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_image_text_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_image_text_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_link_cards_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_link_cards_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_questions_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_questions_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_benefits_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_benefits_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_curriculum_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_curriculum_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_feature_cards_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_feature_cards_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_path_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_path_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_checklist_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_checklist_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_steps_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_steps_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_mood_video_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_mood_video_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_full_image_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_full_image_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_social_band_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_social_band_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_offerings_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_offerings_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_reviews_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_reviews_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_instructor_row_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_instructor_row_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_instructor_grid_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_instructor_grid_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_upcoming_shows_variant" AS ENUM('list', 'byMonth');
  CREATE TYPE "public"."enum__pages_v_blocks_upcoming_shows_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_upcoming_shows_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_next_show_banner_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_next_show_banner_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_repertoire_groups_group" AS ENUM('company', 'students');
  CREATE TYPE "public"."enum__pages_v_blocks_repertoire_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_repertoire_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_contact_card_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_contact_card_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_course_starts_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_course_starts_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_course_prices_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_course_prices_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_course_compare_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_course_compare_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_upcoming_workshops_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_upcoming_workshops_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_past_workshops_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_past_workshops_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_open_workshop_sessions_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_open_workshop_sessions_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_programmes_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_programmes_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_quote_request_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_quote_request_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_contact_people_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_contact_people_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_location_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_location_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_legal_document_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_legal_document_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_bio_intro_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_bio_intro_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_bio_next_show_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_bio_next_show_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_link_list_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_link_list_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_social_links_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_social_links_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_contact_footer_spacing_top" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_blocks_contact_footer_spacing_bottom" AS ENUM('none', 'xs', 'sm', 'md', 'lg');
  CREATE TYPE "public"."enum__pages_v_version_layout" AS ENUM('site', 'minimal');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_legal_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__legal_pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_productions_group" AS ENUM('company', 'students');
  CREATE TYPE "public"."enum_productions_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__productions_v_version_group" AS ENUM('company', 'students');
  CREATE TYPE "public"."enum__productions_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'revalidateDates');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'revalidateDates');
  CREATE TABLE "pages_blocks_home_hero_keywords" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_home_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"lead" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_href" varchar,
  	"secondary_cta_label" varchar,
  	"secondary_cta_href" varchar,
  	"image_large_id" integer,
  	"image_small_id" integer,
  	"next_show" boolean DEFAULT true,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_home_hero_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_home_hero_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_page_hero_switcher_pages" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"page_id" integer,
  	"label" varchar
  );
  
  CREATE TABLE "pages_blocks_page_hero_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar,
  	"href" varchar,
  	"course_price_id" integer
  );
  
  CREATE TABLE "pages_blocks_page_hero_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"variant" "enum_pages_blocks_page_hero_buttons_variant",
  	"show_if" "enum_pages_blocks_page_hero_buttons_show_if"
  );
  
  CREATE TABLE "pages_blocks_page_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"lead" varchar,
  	"image_id" integer,
  	"layout_shape" "enum_pages_blocks_page_hero_layout_shape",
  	"layout_size" "enum_pages_blocks_page_hero_layout_size",
  	"layout_tilt" numeric,
  	"layout_position" "enum_pages_blocks_page_hero_layout_position",
  	"switcher_label" varchar,
  	"repertoire_filter" boolean,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_page_hero_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_page_hero_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_cta_band" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"cta_band_id" integer,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_cta_band_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_cta_band_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_text_split_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar,
  	"href" varchar,
  	"course_price_id" integer
  );
  
  CREATE TABLE "pages_blocks_text_split" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"size" "enum_pages_blocks_text_split_size",
  	"text" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_text_split_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_text_split_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_statement" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"text" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_statement_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_statement_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_image_text_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_image_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"quote" varchar,
  	"image_id" integer,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_image_text_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_image_text_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_link_cards_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"href" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_link_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_link_cards_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_link_cards_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_questions_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"closing" varchar,
  	"cta_label" varchar,
  	"cta_href" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_questions_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_questions_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_benefits_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"text" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_benefits_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_benefits_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_curriculum_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_curriculum" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"bonus_eyebrow" varchar,
  	"bonus_heading" varchar,
  	"bonus_text" varchar,
  	"image_id" integer,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_curriculum_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_curriculum_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_feature_cards_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"quote" varchar,
  	"quote_source" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_feature_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_feature_cards_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_feature_cards_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_path_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kicker" varchar,
  	"title" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_path_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"image_id" integer,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_path_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_path_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_checklist_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_checklist" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"closing" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_checklist_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_checklist_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_steps_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_steps_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_steps_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_mood_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"text" varchar,
  	"link_label" varchar,
  	"link_href" varchar,
  	"video_youtube_id" varchar,
  	"video_title" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_mood_video_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_mood_video_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_full_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_full_image_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_full_image_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_social_band" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"link_label" varchar,
  	"link_href" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_social_band_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_social_band_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_offerings_cards_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar,
  	"href" varchar,
  	"course_price_id" integer
  );
  
  CREATE TABLE "pages_blocks_offerings_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"course_id" integer,
  	"badge" varchar,
  	"title" varchar,
  	"text" varchar,
  	"cta_label" varchar,
  	"cta_href" varchar
  );
  
  CREATE TABLE "pages_blocks_offerings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"instructors_link_label" varchar,
  	"instructors_link_href" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_offerings_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_offerings_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_reviews_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_reviews_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_instructor_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"text" varchar,
  	"link_label" varchar,
  	"link_href" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_instructor_row_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_instructor_row_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_instructor_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_instructor_grid_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_instructor_grid_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_upcoming_shows_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "pages_blocks_upcoming_shows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_pages_blocks_upcoming_shows_variant" DEFAULT 'list',
  	"eyebrow" varchar,
  	"heading" varchar,
  	"header_link_label" varchar,
  	"header_link_href" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_upcoming_shows_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_upcoming_shows_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_next_show_banner" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_label" varchar,
  	"link_href" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_next_show_banner_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_next_show_banner_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_repertoire_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"group" "enum_pages_blocks_repertoire_groups_group",
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar
  );
  
  CREATE TABLE "pages_blocks_repertoire" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_repertoire_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_repertoire_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_contact_card" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"cta_label" varchar,
  	"cta_href" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_contact_card_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_contact_card_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_course_starts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"course_id" integer,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"rolling_text" jsonb,
  	"rolling_note" varchar,
  	"rolling_inquiry_label" varchar,
  	"rolling_inquiry_href" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_course_starts_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_course_starts_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_course_prices" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"course_id" integer,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_course_prices_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_course_prices_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_course_compare" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_course_compare_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_course_compare_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_upcoming_workshops" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_upcoming_workshops_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_upcoming_workshops_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_past_workshops" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"limit" numeric DEFAULT 3,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_past_workshops_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_past_workshops_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_open_workshop_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"title" varchar,
  	"limit" numeric DEFAULT 4,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_open_workshop_sessions_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_open_workshop_sessions_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_programmes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_programmes_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_programmes_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_quote_request_goals" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_quote_request" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"text" varchar,
  	"image_id" integer,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_quote_request_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_quote_request_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_contact_people" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"email_eyebrow" varchar,
  	"email_heading" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_contact_people_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_contact_people_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_location_address_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_location" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"text" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_location_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_location_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_legal_document" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"document_id" integer,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_legal_document_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_legal_document_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_bio_intro" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_bio_intro_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_bio_intro_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_bio_next_show" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_bio_next_show_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_bio_next_show_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_link_list_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "pages_blocks_link_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_link_list_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_link_list_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_social_links_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_social_links_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_contact_footer" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"spacing_top" "enum_pages_blocks_contact_footer_spacing_top",
  	"spacing_bottom" "enum_pages_blocks_contact_footer_spacing_bottom",
  	"block_name" varchar
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"path" varchar,
  	"layout" "enum_pages_layout" DEFAULT 'site',
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"import_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "pages_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"courses_id" integer
  );
  
  CREATE TABLE "_pages_v_blocks_home_hero_keywords" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_home_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"lead" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_href" varchar,
  	"secondary_cta_label" varchar,
  	"secondary_cta_href" varchar,
  	"image_large_id" integer,
  	"image_small_id" integer,
  	"next_show" boolean DEFAULT true,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_home_hero_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_home_hero_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_page_hero_switcher_pages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"page_id" integer,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_page_hero_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar,
  	"href" varchar,
  	"course_price_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_page_hero_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"variant" "enum__pages_v_blocks_page_hero_buttons_variant",
  	"show_if" "enum__pages_v_blocks_page_hero_buttons_show_if",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_page_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"lead" varchar,
  	"image_id" integer,
  	"layout_shape" "enum__pages_v_blocks_page_hero_layout_shape",
  	"layout_size" "enum__pages_v_blocks_page_hero_layout_size",
  	"layout_tilt" numeric,
  	"layout_position" "enum__pages_v_blocks_page_hero_layout_position",
  	"switcher_label" varchar,
  	"repertoire_filter" boolean,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_page_hero_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_page_hero_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cta_band" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"cta_band_id" integer,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_cta_band_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_cta_band_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_text_split_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar,
  	"href" varchar,
  	"course_price_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_text_split" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"size" "enum__pages_v_blocks_text_split_size",
  	"text" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_text_split_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_text_split_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_statement" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"text" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_statement_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_statement_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_image_text_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_image_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"quote" varchar,
  	"image_id" integer,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_image_text_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_image_text_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_link_cards_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"href" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_link_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_link_cards_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_link_cards_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_questions_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"closing" varchar,
  	"cta_label" varchar,
  	"cta_href" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_questions_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_questions_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_benefits_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"text" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_benefits_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_benefits_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_curriculum_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_curriculum" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"bonus_eyebrow" varchar,
  	"bonus_heading" varchar,
  	"bonus_text" varchar,
  	"image_id" integer,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_curriculum_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_curriculum_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_feature_cards_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"quote" varchar,
  	"quote_source" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_feature_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_feature_cards_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_feature_cards_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_path_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kicker" varchar,
  	"title" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_path_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_path" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"image_id" integer,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_path_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_path_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_checklist_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_checklist" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"closing" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_checklist_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_checklist_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_steps_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_steps_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_steps_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_mood_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"text" varchar,
  	"link_label" varchar,
  	"link_href" varchar,
  	"video_youtube_id" varchar,
  	"video_title" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_mood_video_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_mood_video_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_full_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_full_image_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_full_image_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_social_band" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"link_label" varchar,
  	"link_href" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_social_band_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_social_band_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_offerings_cards_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar,
  	"href" varchar,
  	"course_price_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_offerings_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"course_id" integer,
  	"badge" varchar,
  	"title" varchar,
  	"text" varchar,
  	"cta_label" varchar,
  	"cta_href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_offerings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"instructors_link_label" varchar,
  	"instructors_link_href" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_offerings_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_offerings_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_reviews_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_reviews_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_instructor_row" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"text" varchar,
  	"link_label" varchar,
  	"link_href" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_instructor_row_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_instructor_row_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_instructor_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_instructor_grid_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_instructor_grid_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_upcoming_shows_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_upcoming_shows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"variant" "enum__pages_v_blocks_upcoming_shows_variant" DEFAULT 'list',
  	"eyebrow" varchar,
  	"heading" varchar,
  	"header_link_label" varchar,
  	"header_link_href" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_upcoming_shows_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_upcoming_shows_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_next_show_banner" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"link_label" varchar,
  	"link_href" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_next_show_banner_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_next_show_banner_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_repertoire_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"group" "enum__pages_v_blocks_repertoire_groups_group",
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_repertoire" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_repertoire_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_repertoire_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_contact_card" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"cta_label" varchar,
  	"cta_href" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_contact_card_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_contact_card_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_course_starts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"course_id" integer,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"rolling_text" jsonb,
  	"rolling_note" varchar,
  	"rolling_inquiry_label" varchar,
  	"rolling_inquiry_href" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_course_starts_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_course_starts_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_course_prices" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"course_id" integer,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_course_prices_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_course_prices_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_course_compare" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_course_compare_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_course_compare_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_upcoming_workshops" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_upcoming_workshops_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_upcoming_workshops_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_past_workshops" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"limit" numeric DEFAULT 3,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_past_workshops_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_past_workshops_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_open_workshop_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"title" varchar,
  	"limit" numeric DEFAULT 4,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_open_workshop_sessions_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_open_workshop_sessions_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_programmes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_programmes_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_programmes_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_quote_request_goals" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_quote_request" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"text" varchar,
  	"image_id" integer,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_quote_request_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_quote_request_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_contact_people" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"email_eyebrow" varchar,
  	"email_heading" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_contact_people_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_contact_people_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_location_address_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_location" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"text" varchar,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_location_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_location_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_legal_document" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"document_id" integer,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_legal_document_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_legal_document_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_bio_intro" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_bio_intro_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_bio_intro_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_bio_next_show" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_bio_next_show_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_bio_next_show_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_link_list_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_link_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_link_list_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_link_list_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_social_links_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_social_links_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_contact_footer" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar,
  	"spacing_top" "enum__pages_v_blocks_contact_footer_spacing_top",
  	"spacing_bottom" "enum__pages_v_blocks_contact_footer_spacing_bottom",
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_path" varchar,
  	"version_layout" "enum__pages_v_version_layout" DEFAULT 'site',
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_import_id" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_pages_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"courses_id" integer
  );
  
  CREATE TABLE "cta_bands" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"eyebrow" varchar NOT NULL,
  	"heading" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"primary_label" varchar NOT NULL,
  	"primary_href" varchar NOT NULL,
  	"secondary_label" varchar NOT NULL,
  	"secondary_href" varchar NOT NULL,
  	"import_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "legal_pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"effective_date" timestamp(3) with time zone,
  	"body" jsonb,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"import_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_legal_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_legal_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_effective_date" timestamp(3) with time zone,
  	"version_body" jsonb,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_import_id" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__legal_pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "productions_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "productions_audience_quotes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"author" varchar
  );
  
  CREATE TABLE "productions_credits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"name" varchar
  );
  
  CREATE TABLE "productions_cast" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"role" varchar,
  	"role_note" varchar
  );
  
  CREATE TABLE "productions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"group" "enum_productions_group" DEFAULT 'company',
  	"genre" varchar,
  	"byline" varchar,
  	"summary" varchar,
  	"poster_id" integer,
  	"note" varchar,
  	"detail_page" boolean,
  	"tagline" varchar,
  	"description_heading" varchar,
  	"long_description" jsonb,
  	"video_url" varchar,
  	"hero_image_id" integer,
  	"hero_video_id" integer,
  	"invite_video_video_id" integer,
  	"invite_video_title" varchar,
  	"invite_video_poster_id" integer,
  	"cast_label" varchar,
  	"order" numeric,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"import_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_productions_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "productions_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "productions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_productions_v_version_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_productions_v_version_audience_quotes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"author" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_productions_v_version_credits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"name" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_productions_v_version_cast" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"role" varchar,
  	"role_note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_productions_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_group" "enum__productions_v_version_group" DEFAULT 'company',
  	"version_genre" varchar,
  	"version_byline" varchar,
  	"version_summary" varchar,
  	"version_poster_id" integer,
  	"version_note" varchar,
  	"version_detail_page" boolean,
  	"version_tagline" varchar,
  	"version_description_heading" varchar,
  	"version_long_description" jsonb,
  	"version_video_url" varchar,
  	"version_hero_image_id" integer,
  	"version_hero_video_id" integer,
  	"version_invite_video_video_id" integer,
  	"version_invite_video_title" varchar,
  	"version_invite_video_poster_id" integer,
  	"version_cast_label" varchar,
  	"version_order" numeric,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_import_id" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__productions_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_productions_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_productions_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "shows_info" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "shows" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"production_id" integer NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"time" varchar NOT NULL,
  	"venue_id" integer NOT NULL,
  	"label" varchar,
  	"ticket_url" varchar,
  	"registration_url" varchar,
  	"title" varchar,
  	"import_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "venues" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"short_name" varchar NOT NULL,
  	"import_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "courses_starts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"start_time" varchar NOT NULL,
  	"end_time" varchar NOT NULL
  );
  
  CREATE TABLE "courses_prices" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"amount" numeric NOT NULL,
  	"per" varchar,
  	"note" varchar,
  	"highlighted" boolean
  );
  
  CREATE TABLE "courses" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"signup_url" varchar NOT NULL,
  	"rhythm" varchar NOT NULL,
  	"length" varchar NOT NULL,
  	"admission" varchar NOT NULL,
  	"card_badge" varchar NOT NULL,
  	"card_text" varchar NOT NULL,
  	"card_cta_label" varchar NOT NULL,
  	"next_intake" timestamp(3) with time zone,
  	"import_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "open_workshop_sessions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"start_time" varchar NOT NULL,
  	"end_time" varchar NOT NULL,
  	"price" numeric NOT NULL,
  	"booking_url" varchar NOT NULL,
  	"booking_deadline" timestamp(3) with time zone NOT NULL,
  	"import_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "workshops_leader_bio" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "workshops" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"subtitle" varchar,
  	"start_date" timestamp(3) with time zone NOT NULL,
  	"end_date" timestamp(3) with time zone NOT NULL,
  	"start_time" varchar NOT NULL,
  	"end_time" varchar NOT NULL,
  	"intro" varchar,
  	"summary" varchar NOT NULL,
  	"leader_name" varchar,
  	"closing" varchar,
  	"signup_url" varchar NOT NULL,
  	"image_id" integer NOT NULL,
  	"import_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "workshops_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "team_building_programmes_description" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "team_building_programmes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"duration" varchar NOT NULL,
  	"venue" varchar NOT NULL,
  	"order" numeric,
  	"import_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "instructors_bio" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "instructors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" varchar NOT NULL,
  	"photo_id" integer NOT NULL,
  	"order" numeric NOT NULL,
  	"import_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "reviews_full_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar NOT NULL,
  	"quote" varchar NOT NULL,
  	"photo_id" integer,
  	"order" numeric,
  	"import_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "contact_people" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"photo_id" integer,
  	"order" numeric,
  	"import_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"import_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_poster_url" varchar,
  	"sizes_poster_width" numeric,
  	"sizes_poster_height" numeric,
  	"sizes_poster_mime_type" varchar,
  	"sizes_poster_filesize" numeric,
  	"sizes_poster_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_gallery_url" varchar,
  	"sizes_gallery_width" numeric,
  	"sizes_gallery_height" numeric,
  	"sizes_gallery_mime_type" varchar,
  	"sizes_gallery_filesize" numeric,
  	"sizes_gallery_filename" varchar,
  	"sizes_band_url" varchar,
  	"sizes_band_width" numeric,
  	"sizes_band_height" numeric,
  	"sizes_band_mime_type" varchar,
  	"sizes_band_filesize" numeric,
  	"sizes_band_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'editor' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"cta_bands_id" integer,
  	"legal_pages_id" integer,
  	"productions_id" integer,
  	"shows_id" integer,
  	"venues_id" integer,
  	"courses_id" integer,
  	"open_workshop_sessions_id" integer,
  	"workshops_id" integer,
  	"team_building_programmes_id" integer,
  	"instructors_id" integer,
  	"reviews_id" integer,
  	"contact_people_id" integer,
  	"media_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings_nav" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "site_settings_footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"social" boolean
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"tagline" varchar NOT NULL,
  	"copyright" varchar NOT NULL,
  	"header_cta_label" varchar NOT NULL,
  	"header_cta_href" varchar NOT NULL,
  	"privacy_label" varchar NOT NULL,
  	"privacy_href" varchar NOT NULL,
  	"contact_email" varchar NOT NULL,
  	"contact_address" varchar NOT NULL,
  	"contact_primary_person_id" integer NOT NULL,
  	"social_facebook" varchar NOT NULL,
  	"social_instagram" varchar NOT NULL,
  	"social_tixa" varchar,
  	"map_embed_url" varchar NOT NULL,
  	"map_directions_url" varchar NOT NULL,
  	"map_title" varchar NOT NULL,
  	"urls_upcoming_shows" varchar NOT NULL,
  	"urls_repertoire" varchar NOT NULL,
  	"production_page_cta_band_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_settings_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "ui" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"common_close" varchar NOT NULL,
  	"common_read_more" varchar NOT NULL,
  	"common_more" varchar NOT NULL,
  	"common_signup" varchar NOT NULL,
  	"common_main_nav" varchar NOT NULL,
  	"common_open_menu" varchar NOT NULL,
  	"common_close_menu" varchar NOT NULL,
  	"common_slider_page" varchar NOT NULL,
  	"common_slideshow" varchar NOT NULL,
  	"common_play_video" varchar NOT NULL,
  	"common_facebook" varchar NOT NULL,
  	"common_instagram" varchar NOT NULL,
  	"common_toc" varchar NOT NULL,
  	"common_toc_label" varchar NOT NULL,
  	"common_links" varchar NOT NULL,
  	"shows_ticket" varchar NOT NULL,
  	"shows_registration" varchar NOT NULL,
  	"shows_about" varchar NOT NULL,
  	"shows_info" varchar NOT NULL,
  	"shows_next_show" varchar NOT NULL,
  	"shows_on_stage" varchar NOT NULL,
  	"shows_upcoming_count" varchar NOT NULL,
  	"shows_empty" varchar NOT NULL,
  	"production_back_link" varchar NOT NULL,
  	"production_upcoming_link" varchar NOT NULL,
  	"production_about" varchar NOT NULL,
  	"production_highlights" varchar NOT NULL,
  	"production_quotes" varchar NOT NULL,
  	"production_video" varchar NOT NULL,
  	"production_gallery" varchar NOT NULL,
  	"production_gallery_label" varchar NOT NULL,
  	"production_dates" varchar NOT NULL,
  	"production_no_dates" varchar NOT NULL,
  	"production_cta_dates" varchar NOT NULL,
  	"production_cta_book" varchar NOT NULL,
  	"production_cta_convinced" varchar NOT NULL,
  	"production_invite" varchar NOT NULL,
  	"repertoire_filter" varchar NOT NULL,
  	"repertoire_all" varchar NOT NULL,
  	"repertoire_company" varchar NOT NULL,
  	"repertoire_students" varchar NOT NULL,
  	"reviews_previous" varchar NOT NULL,
  	"reviews_next" varchar NOT NULL,
  	"reviews_photo_placeholder" varchar NOT NULL,
  	"gallery_previous" varchar NOT NULL,
  	"gallery_next" varchar NOT NULL,
  	"gallery_previous_image" varchar NOT NULL,
  	"gallery_next_image" varchar NOT NULL,
  	"gallery_zoom" varchar NOT NULL,
  	"course_rhythm" varchar NOT NULL,
  	"course_length" varchar NOT NULL,
  	"course_admission" varchar NOT NULL,
  	"course_price" varchar NOT NULL,
  	"course_start" varchar NOT NULL,
  	"course_start_rolling" varchar NOT NULL,
  	"course_start_soon" varchar NOT NULL,
  	"course_details" varchar NOT NULL,
  	"course_next_intake" varchar NOT NULL,
  	"course_starts_empty" varchar NOT NULL,
  	"course_starts_empty_link_label" varchar NOT NULL,
  	"course_starts_empty_link_href" varchar NOT NULL,
  	"workshops_date" varchar NOT NULL,
  	"workshops_time" varchar NOT NULL,
  	"workshops_leader" varchar NOT NULL,
  	"workshops_leader_heading" varchar NOT NULL,
  	"workshops_empty" varchar NOT NULL,
  	"workshops_follow_us" varchar NOT NULL,
  	"sessions_book" varchar NOT NULL,
  	"sessions_closed" varchar NOT NULL,
  	"sessions_open" varchar NOT NULL,
  	"sessions_closed_text" varchar NOT NULL,
  	"sessions_empty" varchar NOT NULL,
  	"team_building_duration" varchar NOT NULL,
  	"team_building_venue" varchar NOT NULL,
  	"quote_form_title" varchar NOT NULL,
  	"quote_form_required" varchar NOT NULL,
  	"quote_form_fields_company" varchar NOT NULL,
  	"quote_form_fields_last_name" varchar NOT NULL,
  	"quote_form_fields_first_name" varchar NOT NULL,
  	"quote_form_fields_email" varchar NOT NULL,
  	"quote_form_fields_phone" varchar NOT NULL,
  	"quote_form_fields_message" varchar NOT NULL,
  	"quote_form_message_placeholder" varchar NOT NULL,
  	"quote_form_error" varchar NOT NULL,
  	"quote_form_submit" varchar NOT NULL,
  	"quote_form_note" varchar NOT NULL,
  	"quote_form_subject" varchar NOT NULL,
  	"quote_form_mail_company" varchar NOT NULL,
  	"quote_form_mail_contact" varchar NOT NULL,
  	"quote_form_mail_email" varchar NOT NULL,
  	"quote_form_mail_phone" varchar NOT NULL,
  	"contact_person" varchar NOT NULL,
  	"contact_directions" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_jobs_stats" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stats" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "pages_blocks_home_hero_keywords" ADD CONSTRAINT "pages_blocks_home_hero_keywords_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_home_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_hero" ADD CONSTRAINT "pages_blocks_home_hero_image_large_id_media_id_fk" FOREIGN KEY ("image_large_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_hero" ADD CONSTRAINT "pages_blocks_home_hero_image_small_id_media_id_fk" FOREIGN KEY ("image_small_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_home_hero" ADD CONSTRAINT "pages_blocks_home_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_page_hero_switcher_pages" ADD CONSTRAINT "pages_blocks_page_hero_switcher_pages_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_page_hero_switcher_pages" ADD CONSTRAINT "pages_blocks_page_hero_switcher_pages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_page_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_page_hero_facts" ADD CONSTRAINT "pages_blocks_page_hero_facts_course_price_id_courses_id_fk" FOREIGN KEY ("course_price_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_page_hero_facts" ADD CONSTRAINT "pages_blocks_page_hero_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_page_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_page_hero_buttons" ADD CONSTRAINT "pages_blocks_page_hero_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_page_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_page_hero" ADD CONSTRAINT "pages_blocks_page_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_page_hero" ADD CONSTRAINT "pages_blocks_page_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta_band" ADD CONSTRAINT "pages_blocks_cta_band_cta_band_id_cta_bands_id_fk" FOREIGN KEY ("cta_band_id") REFERENCES "public"."cta_bands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta_band" ADD CONSTRAINT "pages_blocks_cta_band_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_text_split_facts" ADD CONSTRAINT "pages_blocks_text_split_facts_course_price_id_courses_id_fk" FOREIGN KEY ("course_price_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_text_split_facts" ADD CONSTRAINT "pages_blocks_text_split_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_text_split"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_text_split" ADD CONSTRAINT "pages_blocks_text_split_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_statement" ADD CONSTRAINT "pages_blocks_statement_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_image_text_paragraphs" ADD CONSTRAINT "pages_blocks_image_text_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_image_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_image_text" ADD CONSTRAINT "pages_blocks_image_text_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_image_text" ADD CONSTRAINT "pages_blocks_image_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_link_cards_cards" ADD CONSTRAINT "pages_blocks_link_cards_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_link_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_link_cards" ADD CONSTRAINT "pages_blocks_link_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_questions_items" ADD CONSTRAINT "pages_blocks_questions_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_questions" ADD CONSTRAINT "pages_blocks_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_benefits_items" ADD CONSTRAINT "pages_blocks_benefits_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_benefits"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_benefits" ADD CONSTRAINT "pages_blocks_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_curriculum_items" ADD CONSTRAINT "pages_blocks_curriculum_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_curriculum"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_curriculum" ADD CONSTRAINT "pages_blocks_curriculum_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_curriculum" ADD CONSTRAINT "pages_blocks_curriculum_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_feature_cards_cards" ADD CONSTRAINT "pages_blocks_feature_cards_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_feature_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_feature_cards" ADD CONSTRAINT "pages_blocks_feature_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_path_steps" ADD CONSTRAINT "pages_blocks_path_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_path"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_path_paragraphs" ADD CONSTRAINT "pages_blocks_path_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_path"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_path" ADD CONSTRAINT "pages_blocks_path_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_path" ADD CONSTRAINT "pages_blocks_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_checklist_items" ADD CONSTRAINT "pages_blocks_checklist_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_checklist"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_checklist" ADD CONSTRAINT "pages_blocks_checklist_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_steps_steps" ADD CONSTRAINT "pages_blocks_steps_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_steps" ADD CONSTRAINT "pages_blocks_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_mood_video" ADD CONSTRAINT "pages_blocks_mood_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_full_image" ADD CONSTRAINT "pages_blocks_full_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_full_image" ADD CONSTRAINT "pages_blocks_full_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_social_band" ADD CONSTRAINT "pages_blocks_social_band_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_offerings_cards_facts" ADD CONSTRAINT "pages_blocks_offerings_cards_facts_course_price_id_courses_id_fk" FOREIGN KEY ("course_price_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_offerings_cards_facts" ADD CONSTRAINT "pages_blocks_offerings_cards_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_offerings_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_offerings_cards" ADD CONSTRAINT "pages_blocks_offerings_cards_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_offerings_cards" ADD CONSTRAINT "pages_blocks_offerings_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_offerings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_offerings" ADD CONSTRAINT "pages_blocks_offerings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_reviews" ADD CONSTRAINT "pages_blocks_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_instructor_row" ADD CONSTRAINT "pages_blocks_instructor_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_instructor_grid" ADD CONSTRAINT "pages_blocks_instructor_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_upcoming_shows_links" ADD CONSTRAINT "pages_blocks_upcoming_shows_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_upcoming_shows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_upcoming_shows" ADD CONSTRAINT "pages_blocks_upcoming_shows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_next_show_banner" ADD CONSTRAINT "pages_blocks_next_show_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_repertoire_groups" ADD CONSTRAINT "pages_blocks_repertoire_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_repertoire"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_repertoire" ADD CONSTRAINT "pages_blocks_repertoire_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_contact_card" ADD CONSTRAINT "pages_blocks_contact_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_course_starts" ADD CONSTRAINT "pages_blocks_course_starts_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_course_starts" ADD CONSTRAINT "pages_blocks_course_starts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_course_prices" ADD CONSTRAINT "pages_blocks_course_prices_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_course_prices" ADD CONSTRAINT "pages_blocks_course_prices_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_course_compare" ADD CONSTRAINT "pages_blocks_course_compare_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_upcoming_workshops" ADD CONSTRAINT "pages_blocks_upcoming_workshops_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_past_workshops" ADD CONSTRAINT "pages_blocks_past_workshops_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_open_workshop_sessions" ADD CONSTRAINT "pages_blocks_open_workshop_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_programmes" ADD CONSTRAINT "pages_blocks_programmes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_quote_request_goals" ADD CONSTRAINT "pages_blocks_quote_request_goals_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_quote_request"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_quote_request" ADD CONSTRAINT "pages_blocks_quote_request_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_quote_request" ADD CONSTRAINT "pages_blocks_quote_request_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_contact_people" ADD CONSTRAINT "pages_blocks_contact_people_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_location_address_lines" ADD CONSTRAINT "pages_blocks_location_address_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_location"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_location" ADD CONSTRAINT "pages_blocks_location_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_legal_document" ADD CONSTRAINT "pages_blocks_legal_document_document_id_legal_pages_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."legal_pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_legal_document" ADD CONSTRAINT "pages_blocks_legal_document_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_bio_intro" ADD CONSTRAINT "pages_blocks_bio_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_bio_next_show" ADD CONSTRAINT "pages_blocks_bio_next_show_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_link_list_links" ADD CONSTRAINT "pages_blocks_link_list_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_link_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_link_list" ADD CONSTRAINT "pages_blocks_link_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_social_links" ADD CONSTRAINT "pages_blocks_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_contact_footer" ADD CONSTRAINT "pages_blocks_contact_footer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_home_hero_keywords" ADD CONSTRAINT "_pages_v_blocks_home_hero_keywords_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_home_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_home_hero" ADD CONSTRAINT "_pages_v_blocks_home_hero_image_large_id_media_id_fk" FOREIGN KEY ("image_large_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_home_hero" ADD CONSTRAINT "_pages_v_blocks_home_hero_image_small_id_media_id_fk" FOREIGN KEY ("image_small_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_home_hero" ADD CONSTRAINT "_pages_v_blocks_home_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_page_hero_switcher_pages" ADD CONSTRAINT "_pages_v_blocks_page_hero_switcher_pages_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_page_hero_switcher_pages" ADD CONSTRAINT "_pages_v_blocks_page_hero_switcher_pages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_page_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_page_hero_facts" ADD CONSTRAINT "_pages_v_blocks_page_hero_facts_course_price_id_courses_id_fk" FOREIGN KEY ("course_price_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_page_hero_facts" ADD CONSTRAINT "_pages_v_blocks_page_hero_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_page_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_page_hero_buttons" ADD CONSTRAINT "_pages_v_blocks_page_hero_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_page_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_page_hero" ADD CONSTRAINT "_pages_v_blocks_page_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_page_hero" ADD CONSTRAINT "_pages_v_blocks_page_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta_band" ADD CONSTRAINT "_pages_v_blocks_cta_band_cta_band_id_cta_bands_id_fk" FOREIGN KEY ("cta_band_id") REFERENCES "public"."cta_bands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta_band" ADD CONSTRAINT "_pages_v_blocks_cta_band_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_text_split_facts" ADD CONSTRAINT "_pages_v_blocks_text_split_facts_course_price_id_courses_id_fk" FOREIGN KEY ("course_price_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_text_split_facts" ADD CONSTRAINT "_pages_v_blocks_text_split_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_text_split"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_text_split" ADD CONSTRAINT "_pages_v_blocks_text_split_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_statement" ADD CONSTRAINT "_pages_v_blocks_statement_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_image_text_paragraphs" ADD CONSTRAINT "_pages_v_blocks_image_text_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_image_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_image_text" ADD CONSTRAINT "_pages_v_blocks_image_text_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_image_text" ADD CONSTRAINT "_pages_v_blocks_image_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_link_cards_cards" ADD CONSTRAINT "_pages_v_blocks_link_cards_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_link_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_link_cards" ADD CONSTRAINT "_pages_v_blocks_link_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_questions_items" ADD CONSTRAINT "_pages_v_blocks_questions_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_questions" ADD CONSTRAINT "_pages_v_blocks_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_benefits_items" ADD CONSTRAINT "_pages_v_blocks_benefits_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_benefits"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_benefits" ADD CONSTRAINT "_pages_v_blocks_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_curriculum_items" ADD CONSTRAINT "_pages_v_blocks_curriculum_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_curriculum"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_curriculum" ADD CONSTRAINT "_pages_v_blocks_curriculum_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_curriculum" ADD CONSTRAINT "_pages_v_blocks_curriculum_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_feature_cards_cards" ADD CONSTRAINT "_pages_v_blocks_feature_cards_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_feature_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_feature_cards" ADD CONSTRAINT "_pages_v_blocks_feature_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_path_steps" ADD CONSTRAINT "_pages_v_blocks_path_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_path"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_path_paragraphs" ADD CONSTRAINT "_pages_v_blocks_path_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_path"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_path" ADD CONSTRAINT "_pages_v_blocks_path_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_path" ADD CONSTRAINT "_pages_v_blocks_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_checklist_items" ADD CONSTRAINT "_pages_v_blocks_checklist_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_checklist"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_checklist" ADD CONSTRAINT "_pages_v_blocks_checklist_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_steps_steps" ADD CONSTRAINT "_pages_v_blocks_steps_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_steps" ADD CONSTRAINT "_pages_v_blocks_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_mood_video" ADD CONSTRAINT "_pages_v_blocks_mood_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_full_image" ADD CONSTRAINT "_pages_v_blocks_full_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_full_image" ADD CONSTRAINT "_pages_v_blocks_full_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_social_band" ADD CONSTRAINT "_pages_v_blocks_social_band_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_offerings_cards_facts" ADD CONSTRAINT "_pages_v_blocks_offerings_cards_facts_course_price_id_courses_id_fk" FOREIGN KEY ("course_price_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_offerings_cards_facts" ADD CONSTRAINT "_pages_v_blocks_offerings_cards_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_offerings_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_offerings_cards" ADD CONSTRAINT "_pages_v_blocks_offerings_cards_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_offerings_cards" ADD CONSTRAINT "_pages_v_blocks_offerings_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_offerings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_offerings" ADD CONSTRAINT "_pages_v_blocks_offerings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_reviews" ADD CONSTRAINT "_pages_v_blocks_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_instructor_row" ADD CONSTRAINT "_pages_v_blocks_instructor_row_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_instructor_grid" ADD CONSTRAINT "_pages_v_blocks_instructor_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_upcoming_shows_links" ADD CONSTRAINT "_pages_v_blocks_upcoming_shows_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_upcoming_shows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_upcoming_shows" ADD CONSTRAINT "_pages_v_blocks_upcoming_shows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_next_show_banner" ADD CONSTRAINT "_pages_v_blocks_next_show_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_repertoire_groups" ADD CONSTRAINT "_pages_v_blocks_repertoire_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_repertoire"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_repertoire" ADD CONSTRAINT "_pages_v_blocks_repertoire_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_contact_card" ADD CONSTRAINT "_pages_v_blocks_contact_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_course_starts" ADD CONSTRAINT "_pages_v_blocks_course_starts_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_course_starts" ADD CONSTRAINT "_pages_v_blocks_course_starts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_course_prices" ADD CONSTRAINT "_pages_v_blocks_course_prices_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_course_prices" ADD CONSTRAINT "_pages_v_blocks_course_prices_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_course_compare" ADD CONSTRAINT "_pages_v_blocks_course_compare_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_upcoming_workshops" ADD CONSTRAINT "_pages_v_blocks_upcoming_workshops_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_past_workshops" ADD CONSTRAINT "_pages_v_blocks_past_workshops_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_open_workshop_sessions" ADD CONSTRAINT "_pages_v_blocks_open_workshop_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_programmes" ADD CONSTRAINT "_pages_v_blocks_programmes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_quote_request_goals" ADD CONSTRAINT "_pages_v_blocks_quote_request_goals_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_quote_request"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_quote_request" ADD CONSTRAINT "_pages_v_blocks_quote_request_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_quote_request" ADD CONSTRAINT "_pages_v_blocks_quote_request_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_contact_people" ADD CONSTRAINT "_pages_v_blocks_contact_people_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_location_address_lines" ADD CONSTRAINT "_pages_v_blocks_location_address_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_location"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_location" ADD CONSTRAINT "_pages_v_blocks_location_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_legal_document" ADD CONSTRAINT "_pages_v_blocks_legal_document_document_id_legal_pages_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."legal_pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_legal_document" ADD CONSTRAINT "_pages_v_blocks_legal_document_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_bio_intro" ADD CONSTRAINT "_pages_v_blocks_bio_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_bio_next_show" ADD CONSTRAINT "_pages_v_blocks_bio_next_show_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_link_list_links" ADD CONSTRAINT "_pages_v_blocks_link_list_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_link_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_link_list" ADD CONSTRAINT "_pages_v_blocks_link_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_social_links" ADD CONSTRAINT "_pages_v_blocks_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_contact_footer" ADD CONSTRAINT "_pages_v_blocks_contact_footer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_legal_pages_v" ADD CONSTRAINT "_legal_pages_v_parent_id_legal_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."legal_pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "productions_highlights" ADD CONSTRAINT "productions_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_audience_quotes" ADD CONSTRAINT "productions_audience_quotes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_credits" ADD CONSTRAINT "productions_credits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_cast" ADD CONSTRAINT "productions_cast_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions" ADD CONSTRAINT "productions_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "productions" ADD CONSTRAINT "productions_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "productions" ADD CONSTRAINT "productions_hero_video_id_media_id_fk" FOREIGN KEY ("hero_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "productions" ADD CONSTRAINT "productions_invite_video_video_id_media_id_fk" FOREIGN KEY ("invite_video_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "productions" ADD CONSTRAINT "productions_invite_video_poster_id_media_id_fk" FOREIGN KEY ("invite_video_poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "productions_texts" ADD CONSTRAINT "productions_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_rels" ADD CONSTRAINT "productions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productions_rels" ADD CONSTRAINT "productions_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_productions_v_version_highlights" ADD CONSTRAINT "_productions_v_version_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_productions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_productions_v_version_audience_quotes" ADD CONSTRAINT "_productions_v_version_audience_quotes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_productions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_productions_v_version_credits" ADD CONSTRAINT "_productions_v_version_credits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_productions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_productions_v_version_cast" ADD CONSTRAINT "_productions_v_version_cast_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_productions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_productions_v" ADD CONSTRAINT "_productions_v_parent_id_productions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."productions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_productions_v" ADD CONSTRAINT "_productions_v_version_poster_id_media_id_fk" FOREIGN KEY ("version_poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_productions_v" ADD CONSTRAINT "_productions_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_productions_v" ADD CONSTRAINT "_productions_v_version_hero_video_id_media_id_fk" FOREIGN KEY ("version_hero_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_productions_v" ADD CONSTRAINT "_productions_v_version_invite_video_video_id_media_id_fk" FOREIGN KEY ("version_invite_video_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_productions_v" ADD CONSTRAINT "_productions_v_version_invite_video_poster_id_media_id_fk" FOREIGN KEY ("version_invite_video_poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_productions_v_texts" ADD CONSTRAINT "_productions_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_productions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_productions_v_rels" ADD CONSTRAINT "_productions_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_productions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_productions_v_rels" ADD CONSTRAINT "_productions_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "shows_info" ADD CONSTRAINT "shows_info_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "shows" ADD CONSTRAINT "shows_production_id_productions_id_fk" FOREIGN KEY ("production_id") REFERENCES "public"."productions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "shows" ADD CONSTRAINT "shows_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_starts" ADD CONSTRAINT "courses_starts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_prices" ADD CONSTRAINT "courses_prices_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_leader_bio" ADD CONSTRAINT "workshops_leader_bio_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops" ADD CONSTRAINT "workshops_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "workshops_rels" ADD CONSTRAINT "workshops_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "workshops_rels" ADD CONSTRAINT "workshops_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_building_programmes_description" ADD CONSTRAINT "team_building_programmes_description_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_building_programmes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "instructors_bio" ADD CONSTRAINT "instructors_bio_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."instructors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "instructors" ADD CONSTRAINT "instructors_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reviews_full_text" ADD CONSTRAINT "reviews_full_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contact_people" ADD CONSTRAINT "contact_people_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cta_bands_fk" FOREIGN KEY ("cta_bands_id") REFERENCES "public"."cta_bands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_legal_pages_fk" FOREIGN KEY ("legal_pages_id") REFERENCES "public"."legal_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_productions_fk" FOREIGN KEY ("productions_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_shows_fk" FOREIGN KEY ("shows_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_venues_fk" FOREIGN KEY ("venues_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_open_workshop_sessions_fk" FOREIGN KEY ("open_workshop_sessions_id") REFERENCES "public"."open_workshop_sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_workshops_fk" FOREIGN KEY ("workshops_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_team_building_programmes_fk" FOREIGN KEY ("team_building_programmes_id") REFERENCES "public"."team_building_programmes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_instructors_fk" FOREIGN KEY ("instructors_id") REFERENCES "public"."instructors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contact_people_fk" FOREIGN KEY ("contact_people_id") REFERENCES "public"."contact_people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_nav" ADD CONSTRAINT "site_settings_nav_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_footer_columns_links" ADD CONSTRAINT "site_settings_footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_footer_columns" ADD CONSTRAINT "site_settings_footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_contact_primary_person_id_contact_people_id_fk" FOREIGN KEY ("contact_primary_person_id") REFERENCES "public"."contact_people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_production_page_cta_band_id_cta_bands_id_fk" FOREIGN KEY ("production_page_cta_band_id") REFERENCES "public"."cta_bands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_texts" ADD CONSTRAINT "site_settings_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_home_hero_keywords_order_idx" ON "pages_blocks_home_hero_keywords" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_hero_keywords_parent_id_idx" ON "pages_blocks_home_hero_keywords" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_hero_order_idx" ON "pages_blocks_home_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_home_hero_parent_id_idx" ON "pages_blocks_home_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_home_hero_path_idx" ON "pages_blocks_home_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_home_hero_image_large_idx" ON "pages_blocks_home_hero" USING btree ("image_large_id");
  CREATE INDEX "pages_blocks_home_hero_image_small_idx" ON "pages_blocks_home_hero" USING btree ("image_small_id");
  CREATE INDEX "pages_blocks_page_hero_switcher_pages_order_idx" ON "pages_blocks_page_hero_switcher_pages" USING btree ("_order");
  CREATE INDEX "pages_blocks_page_hero_switcher_pages_parent_id_idx" ON "pages_blocks_page_hero_switcher_pages" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_page_hero_switcher_pages_page_idx" ON "pages_blocks_page_hero_switcher_pages" USING btree ("page_id");
  CREATE INDEX "pages_blocks_page_hero_facts_order_idx" ON "pages_blocks_page_hero_facts" USING btree ("_order");
  CREATE INDEX "pages_blocks_page_hero_facts_parent_id_idx" ON "pages_blocks_page_hero_facts" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_page_hero_facts_course_price_idx" ON "pages_blocks_page_hero_facts" USING btree ("course_price_id");
  CREATE INDEX "pages_blocks_page_hero_buttons_order_idx" ON "pages_blocks_page_hero_buttons" USING btree ("_order");
  CREATE INDEX "pages_blocks_page_hero_buttons_parent_id_idx" ON "pages_blocks_page_hero_buttons" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_page_hero_order_idx" ON "pages_blocks_page_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_page_hero_parent_id_idx" ON "pages_blocks_page_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_page_hero_path_idx" ON "pages_blocks_page_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_page_hero_image_idx" ON "pages_blocks_page_hero" USING btree ("image_id");
  CREATE INDEX "pages_blocks_cta_band_order_idx" ON "pages_blocks_cta_band" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_band_parent_id_idx" ON "pages_blocks_cta_band" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_band_path_idx" ON "pages_blocks_cta_band" USING btree ("_path");
  CREATE INDEX "pages_blocks_cta_band_cta_band_idx" ON "pages_blocks_cta_band" USING btree ("cta_band_id");
  CREATE INDEX "pages_blocks_text_split_facts_order_idx" ON "pages_blocks_text_split_facts" USING btree ("_order");
  CREATE INDEX "pages_blocks_text_split_facts_parent_id_idx" ON "pages_blocks_text_split_facts" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_text_split_facts_course_price_idx" ON "pages_blocks_text_split_facts" USING btree ("course_price_id");
  CREATE INDEX "pages_blocks_text_split_order_idx" ON "pages_blocks_text_split" USING btree ("_order");
  CREATE INDEX "pages_blocks_text_split_parent_id_idx" ON "pages_blocks_text_split" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_text_split_path_idx" ON "pages_blocks_text_split" USING btree ("_path");
  CREATE INDEX "pages_blocks_statement_order_idx" ON "pages_blocks_statement" USING btree ("_order");
  CREATE INDEX "pages_blocks_statement_parent_id_idx" ON "pages_blocks_statement" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_statement_path_idx" ON "pages_blocks_statement" USING btree ("_path");
  CREATE INDEX "pages_blocks_image_text_paragraphs_order_idx" ON "pages_blocks_image_text_paragraphs" USING btree ("_order");
  CREATE INDEX "pages_blocks_image_text_paragraphs_parent_id_idx" ON "pages_blocks_image_text_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_image_text_order_idx" ON "pages_blocks_image_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_image_text_parent_id_idx" ON "pages_blocks_image_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_image_text_path_idx" ON "pages_blocks_image_text" USING btree ("_path");
  CREATE INDEX "pages_blocks_image_text_image_idx" ON "pages_blocks_image_text" USING btree ("image_id");
  CREATE INDEX "pages_blocks_link_cards_cards_order_idx" ON "pages_blocks_link_cards_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_link_cards_cards_parent_id_idx" ON "pages_blocks_link_cards_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_link_cards_order_idx" ON "pages_blocks_link_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_link_cards_parent_id_idx" ON "pages_blocks_link_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_link_cards_path_idx" ON "pages_blocks_link_cards" USING btree ("_path");
  CREATE INDEX "pages_blocks_questions_items_order_idx" ON "pages_blocks_questions_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_questions_items_parent_id_idx" ON "pages_blocks_questions_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_questions_order_idx" ON "pages_blocks_questions" USING btree ("_order");
  CREATE INDEX "pages_blocks_questions_parent_id_idx" ON "pages_blocks_questions" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_questions_path_idx" ON "pages_blocks_questions" USING btree ("_path");
  CREATE INDEX "pages_blocks_benefits_items_order_idx" ON "pages_blocks_benefits_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_benefits_items_parent_id_idx" ON "pages_blocks_benefits_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_benefits_order_idx" ON "pages_blocks_benefits" USING btree ("_order");
  CREATE INDEX "pages_blocks_benefits_parent_id_idx" ON "pages_blocks_benefits" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_benefits_path_idx" ON "pages_blocks_benefits" USING btree ("_path");
  CREATE INDEX "pages_blocks_curriculum_items_order_idx" ON "pages_blocks_curriculum_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_curriculum_items_parent_id_idx" ON "pages_blocks_curriculum_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_curriculum_order_idx" ON "pages_blocks_curriculum" USING btree ("_order");
  CREATE INDEX "pages_blocks_curriculum_parent_id_idx" ON "pages_blocks_curriculum" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_curriculum_path_idx" ON "pages_blocks_curriculum" USING btree ("_path");
  CREATE INDEX "pages_blocks_curriculum_image_idx" ON "pages_blocks_curriculum" USING btree ("image_id");
  CREATE INDEX "pages_blocks_feature_cards_cards_order_idx" ON "pages_blocks_feature_cards_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_feature_cards_cards_parent_id_idx" ON "pages_blocks_feature_cards_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_feature_cards_order_idx" ON "pages_blocks_feature_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_feature_cards_parent_id_idx" ON "pages_blocks_feature_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_feature_cards_path_idx" ON "pages_blocks_feature_cards" USING btree ("_path");
  CREATE INDEX "pages_blocks_path_steps_order_idx" ON "pages_blocks_path_steps" USING btree ("_order");
  CREATE INDEX "pages_blocks_path_steps_parent_id_idx" ON "pages_blocks_path_steps" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_path_paragraphs_order_idx" ON "pages_blocks_path_paragraphs" USING btree ("_order");
  CREATE INDEX "pages_blocks_path_paragraphs_parent_id_idx" ON "pages_blocks_path_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_path_order_idx" ON "pages_blocks_path" USING btree ("_order");
  CREATE INDEX "pages_blocks_path_parent_id_idx" ON "pages_blocks_path" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_path_path_idx" ON "pages_blocks_path" USING btree ("_path");
  CREATE INDEX "pages_blocks_path_image_idx" ON "pages_blocks_path" USING btree ("image_id");
  CREATE INDEX "pages_blocks_checklist_items_order_idx" ON "pages_blocks_checklist_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_checklist_items_parent_id_idx" ON "pages_blocks_checklist_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_checklist_order_idx" ON "pages_blocks_checklist" USING btree ("_order");
  CREATE INDEX "pages_blocks_checklist_parent_id_idx" ON "pages_blocks_checklist" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_checklist_path_idx" ON "pages_blocks_checklist" USING btree ("_path");
  CREATE INDEX "pages_blocks_steps_steps_order_idx" ON "pages_blocks_steps_steps" USING btree ("_order");
  CREATE INDEX "pages_blocks_steps_steps_parent_id_idx" ON "pages_blocks_steps_steps" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_steps_order_idx" ON "pages_blocks_steps" USING btree ("_order");
  CREATE INDEX "pages_blocks_steps_parent_id_idx" ON "pages_blocks_steps" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_steps_path_idx" ON "pages_blocks_steps" USING btree ("_path");
  CREATE INDEX "pages_blocks_mood_video_order_idx" ON "pages_blocks_mood_video" USING btree ("_order");
  CREATE INDEX "pages_blocks_mood_video_parent_id_idx" ON "pages_blocks_mood_video" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_mood_video_path_idx" ON "pages_blocks_mood_video" USING btree ("_path");
  CREATE INDEX "pages_blocks_full_image_order_idx" ON "pages_blocks_full_image" USING btree ("_order");
  CREATE INDEX "pages_blocks_full_image_parent_id_idx" ON "pages_blocks_full_image" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_full_image_path_idx" ON "pages_blocks_full_image" USING btree ("_path");
  CREATE INDEX "pages_blocks_full_image_image_idx" ON "pages_blocks_full_image" USING btree ("image_id");
  CREATE INDEX "pages_blocks_social_band_order_idx" ON "pages_blocks_social_band" USING btree ("_order");
  CREATE INDEX "pages_blocks_social_band_parent_id_idx" ON "pages_blocks_social_band" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_social_band_path_idx" ON "pages_blocks_social_band" USING btree ("_path");
  CREATE INDEX "pages_blocks_offerings_cards_facts_order_idx" ON "pages_blocks_offerings_cards_facts" USING btree ("_order");
  CREATE INDEX "pages_blocks_offerings_cards_facts_parent_id_idx" ON "pages_blocks_offerings_cards_facts" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_offerings_cards_facts_course_price_idx" ON "pages_blocks_offerings_cards_facts" USING btree ("course_price_id");
  CREATE INDEX "pages_blocks_offerings_cards_order_idx" ON "pages_blocks_offerings_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_offerings_cards_parent_id_idx" ON "pages_blocks_offerings_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_offerings_cards_course_idx" ON "pages_blocks_offerings_cards" USING btree ("course_id");
  CREATE INDEX "pages_blocks_offerings_order_idx" ON "pages_blocks_offerings" USING btree ("_order");
  CREATE INDEX "pages_blocks_offerings_parent_id_idx" ON "pages_blocks_offerings" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_offerings_path_idx" ON "pages_blocks_offerings" USING btree ("_path");
  CREATE INDEX "pages_blocks_reviews_order_idx" ON "pages_blocks_reviews" USING btree ("_order");
  CREATE INDEX "pages_blocks_reviews_parent_id_idx" ON "pages_blocks_reviews" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_reviews_path_idx" ON "pages_blocks_reviews" USING btree ("_path");
  CREATE INDEX "pages_blocks_instructor_row_order_idx" ON "pages_blocks_instructor_row" USING btree ("_order");
  CREATE INDEX "pages_blocks_instructor_row_parent_id_idx" ON "pages_blocks_instructor_row" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_instructor_row_path_idx" ON "pages_blocks_instructor_row" USING btree ("_path");
  CREATE INDEX "pages_blocks_instructor_grid_order_idx" ON "pages_blocks_instructor_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_instructor_grid_parent_id_idx" ON "pages_blocks_instructor_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_instructor_grid_path_idx" ON "pages_blocks_instructor_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_upcoming_shows_links_order_idx" ON "pages_blocks_upcoming_shows_links" USING btree ("_order");
  CREATE INDEX "pages_blocks_upcoming_shows_links_parent_id_idx" ON "pages_blocks_upcoming_shows_links" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_upcoming_shows_order_idx" ON "pages_blocks_upcoming_shows" USING btree ("_order");
  CREATE INDEX "pages_blocks_upcoming_shows_parent_id_idx" ON "pages_blocks_upcoming_shows" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_upcoming_shows_path_idx" ON "pages_blocks_upcoming_shows" USING btree ("_path");
  CREATE INDEX "pages_blocks_next_show_banner_order_idx" ON "pages_blocks_next_show_banner" USING btree ("_order");
  CREATE INDEX "pages_blocks_next_show_banner_parent_id_idx" ON "pages_blocks_next_show_banner" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_next_show_banner_path_idx" ON "pages_blocks_next_show_banner" USING btree ("_path");
  CREATE INDEX "pages_blocks_repertoire_groups_order_idx" ON "pages_blocks_repertoire_groups" USING btree ("_order");
  CREATE INDEX "pages_blocks_repertoire_groups_parent_id_idx" ON "pages_blocks_repertoire_groups" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_repertoire_order_idx" ON "pages_blocks_repertoire" USING btree ("_order");
  CREATE INDEX "pages_blocks_repertoire_parent_id_idx" ON "pages_blocks_repertoire" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_repertoire_path_idx" ON "pages_blocks_repertoire" USING btree ("_path");
  CREATE INDEX "pages_blocks_contact_card_order_idx" ON "pages_blocks_contact_card" USING btree ("_order");
  CREATE INDEX "pages_blocks_contact_card_parent_id_idx" ON "pages_blocks_contact_card" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_contact_card_path_idx" ON "pages_blocks_contact_card" USING btree ("_path");
  CREATE INDEX "pages_blocks_course_starts_order_idx" ON "pages_blocks_course_starts" USING btree ("_order");
  CREATE INDEX "pages_blocks_course_starts_parent_id_idx" ON "pages_blocks_course_starts" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_course_starts_path_idx" ON "pages_blocks_course_starts" USING btree ("_path");
  CREATE INDEX "pages_blocks_course_starts_course_idx" ON "pages_blocks_course_starts" USING btree ("course_id");
  CREATE INDEX "pages_blocks_course_prices_order_idx" ON "pages_blocks_course_prices" USING btree ("_order");
  CREATE INDEX "pages_blocks_course_prices_parent_id_idx" ON "pages_blocks_course_prices" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_course_prices_path_idx" ON "pages_blocks_course_prices" USING btree ("_path");
  CREATE INDEX "pages_blocks_course_prices_course_idx" ON "pages_blocks_course_prices" USING btree ("course_id");
  CREATE INDEX "pages_blocks_course_compare_order_idx" ON "pages_blocks_course_compare" USING btree ("_order");
  CREATE INDEX "pages_blocks_course_compare_parent_id_idx" ON "pages_blocks_course_compare" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_course_compare_path_idx" ON "pages_blocks_course_compare" USING btree ("_path");
  CREATE INDEX "pages_blocks_upcoming_workshops_order_idx" ON "pages_blocks_upcoming_workshops" USING btree ("_order");
  CREATE INDEX "pages_blocks_upcoming_workshops_parent_id_idx" ON "pages_blocks_upcoming_workshops" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_upcoming_workshops_path_idx" ON "pages_blocks_upcoming_workshops" USING btree ("_path");
  CREATE INDEX "pages_blocks_past_workshops_order_idx" ON "pages_blocks_past_workshops" USING btree ("_order");
  CREATE INDEX "pages_blocks_past_workshops_parent_id_idx" ON "pages_blocks_past_workshops" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_past_workshops_path_idx" ON "pages_blocks_past_workshops" USING btree ("_path");
  CREATE INDEX "pages_blocks_open_workshop_sessions_order_idx" ON "pages_blocks_open_workshop_sessions" USING btree ("_order");
  CREATE INDEX "pages_blocks_open_workshop_sessions_parent_id_idx" ON "pages_blocks_open_workshop_sessions" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_open_workshop_sessions_path_idx" ON "pages_blocks_open_workshop_sessions" USING btree ("_path");
  CREATE INDEX "pages_blocks_programmes_order_idx" ON "pages_blocks_programmes" USING btree ("_order");
  CREATE INDEX "pages_blocks_programmes_parent_id_idx" ON "pages_blocks_programmes" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_programmes_path_idx" ON "pages_blocks_programmes" USING btree ("_path");
  CREATE INDEX "pages_blocks_quote_request_goals_order_idx" ON "pages_blocks_quote_request_goals" USING btree ("_order");
  CREATE INDEX "pages_blocks_quote_request_goals_parent_id_idx" ON "pages_blocks_quote_request_goals" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_quote_request_order_idx" ON "pages_blocks_quote_request" USING btree ("_order");
  CREATE INDEX "pages_blocks_quote_request_parent_id_idx" ON "pages_blocks_quote_request" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_quote_request_path_idx" ON "pages_blocks_quote_request" USING btree ("_path");
  CREATE INDEX "pages_blocks_quote_request_image_idx" ON "pages_blocks_quote_request" USING btree ("image_id");
  CREATE INDEX "pages_blocks_contact_people_order_idx" ON "pages_blocks_contact_people" USING btree ("_order");
  CREATE INDEX "pages_blocks_contact_people_parent_id_idx" ON "pages_blocks_contact_people" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_contact_people_path_idx" ON "pages_blocks_contact_people" USING btree ("_path");
  CREATE INDEX "pages_blocks_location_address_lines_order_idx" ON "pages_blocks_location_address_lines" USING btree ("_order");
  CREATE INDEX "pages_blocks_location_address_lines_parent_id_idx" ON "pages_blocks_location_address_lines" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_location_order_idx" ON "pages_blocks_location" USING btree ("_order");
  CREATE INDEX "pages_blocks_location_parent_id_idx" ON "pages_blocks_location" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_location_path_idx" ON "pages_blocks_location" USING btree ("_path");
  CREATE INDEX "pages_blocks_legal_document_order_idx" ON "pages_blocks_legal_document" USING btree ("_order");
  CREATE INDEX "pages_blocks_legal_document_parent_id_idx" ON "pages_blocks_legal_document" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_legal_document_path_idx" ON "pages_blocks_legal_document" USING btree ("_path");
  CREATE INDEX "pages_blocks_legal_document_document_idx" ON "pages_blocks_legal_document" USING btree ("document_id");
  CREATE INDEX "pages_blocks_bio_intro_order_idx" ON "pages_blocks_bio_intro" USING btree ("_order");
  CREATE INDEX "pages_blocks_bio_intro_parent_id_idx" ON "pages_blocks_bio_intro" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_bio_intro_path_idx" ON "pages_blocks_bio_intro" USING btree ("_path");
  CREATE INDEX "pages_blocks_bio_next_show_order_idx" ON "pages_blocks_bio_next_show" USING btree ("_order");
  CREATE INDEX "pages_blocks_bio_next_show_parent_id_idx" ON "pages_blocks_bio_next_show" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_bio_next_show_path_idx" ON "pages_blocks_bio_next_show" USING btree ("_path");
  CREATE INDEX "pages_blocks_link_list_links_order_idx" ON "pages_blocks_link_list_links" USING btree ("_order");
  CREATE INDEX "pages_blocks_link_list_links_parent_id_idx" ON "pages_blocks_link_list_links" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_link_list_order_idx" ON "pages_blocks_link_list" USING btree ("_order");
  CREATE INDEX "pages_blocks_link_list_parent_id_idx" ON "pages_blocks_link_list" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_link_list_path_idx" ON "pages_blocks_link_list" USING btree ("_path");
  CREATE INDEX "pages_blocks_social_links_order_idx" ON "pages_blocks_social_links" USING btree ("_order");
  CREATE INDEX "pages_blocks_social_links_parent_id_idx" ON "pages_blocks_social_links" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_social_links_path_idx" ON "pages_blocks_social_links" USING btree ("_path");
  CREATE INDEX "pages_blocks_contact_footer_order_idx" ON "pages_blocks_contact_footer" USING btree ("_order");
  CREATE INDEX "pages_blocks_contact_footer_parent_id_idx" ON "pages_blocks_contact_footer" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_contact_footer_path_idx" ON "pages_blocks_contact_footer" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_path_idx" ON "pages" USING btree ("path");
  CREATE UNIQUE INDEX "pages_import_id_idx" ON "pages" USING btree ("import_id");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE INDEX "pages_rels_order_idx" ON "pages_rels" USING btree ("order");
  CREATE INDEX "pages_rels_parent_idx" ON "pages_rels" USING btree ("parent_id");
  CREATE INDEX "pages_rels_path_idx" ON "pages_rels" USING btree ("path");
  CREATE INDEX "pages_rels_courses_id_idx" ON "pages_rels" USING btree ("courses_id");
  CREATE INDEX "_pages_v_blocks_home_hero_keywords_order_idx" ON "_pages_v_blocks_home_hero_keywords" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_home_hero_keywords_parent_id_idx" ON "_pages_v_blocks_home_hero_keywords" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_home_hero_order_idx" ON "_pages_v_blocks_home_hero" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_home_hero_parent_id_idx" ON "_pages_v_blocks_home_hero" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_home_hero_path_idx" ON "_pages_v_blocks_home_hero" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_home_hero_image_large_idx" ON "_pages_v_blocks_home_hero" USING btree ("image_large_id");
  CREATE INDEX "_pages_v_blocks_home_hero_image_small_idx" ON "_pages_v_blocks_home_hero" USING btree ("image_small_id");
  CREATE INDEX "_pages_v_blocks_page_hero_switcher_pages_order_idx" ON "_pages_v_blocks_page_hero_switcher_pages" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_page_hero_switcher_pages_parent_id_idx" ON "_pages_v_blocks_page_hero_switcher_pages" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_page_hero_switcher_pages_page_idx" ON "_pages_v_blocks_page_hero_switcher_pages" USING btree ("page_id");
  CREATE INDEX "_pages_v_blocks_page_hero_facts_order_idx" ON "_pages_v_blocks_page_hero_facts" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_page_hero_facts_parent_id_idx" ON "_pages_v_blocks_page_hero_facts" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_page_hero_facts_course_price_idx" ON "_pages_v_blocks_page_hero_facts" USING btree ("course_price_id");
  CREATE INDEX "_pages_v_blocks_page_hero_buttons_order_idx" ON "_pages_v_blocks_page_hero_buttons" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_page_hero_buttons_parent_id_idx" ON "_pages_v_blocks_page_hero_buttons" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_page_hero_order_idx" ON "_pages_v_blocks_page_hero" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_page_hero_parent_id_idx" ON "_pages_v_blocks_page_hero" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_page_hero_path_idx" ON "_pages_v_blocks_page_hero" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_page_hero_image_idx" ON "_pages_v_blocks_page_hero" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_cta_band_order_idx" ON "_pages_v_blocks_cta_band" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta_band_parent_id_idx" ON "_pages_v_blocks_cta_band" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_band_path_idx" ON "_pages_v_blocks_cta_band" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_cta_band_cta_band_idx" ON "_pages_v_blocks_cta_band" USING btree ("cta_band_id");
  CREATE INDEX "_pages_v_blocks_text_split_facts_order_idx" ON "_pages_v_blocks_text_split_facts" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_text_split_facts_parent_id_idx" ON "_pages_v_blocks_text_split_facts" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_text_split_facts_course_price_idx" ON "_pages_v_blocks_text_split_facts" USING btree ("course_price_id");
  CREATE INDEX "_pages_v_blocks_text_split_order_idx" ON "_pages_v_blocks_text_split" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_text_split_parent_id_idx" ON "_pages_v_blocks_text_split" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_text_split_path_idx" ON "_pages_v_blocks_text_split" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_statement_order_idx" ON "_pages_v_blocks_statement" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_statement_parent_id_idx" ON "_pages_v_blocks_statement" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_statement_path_idx" ON "_pages_v_blocks_statement" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_image_text_paragraphs_order_idx" ON "_pages_v_blocks_image_text_paragraphs" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_image_text_paragraphs_parent_id_idx" ON "_pages_v_blocks_image_text_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_image_text_order_idx" ON "_pages_v_blocks_image_text" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_image_text_parent_id_idx" ON "_pages_v_blocks_image_text" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_image_text_path_idx" ON "_pages_v_blocks_image_text" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_image_text_image_idx" ON "_pages_v_blocks_image_text" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_link_cards_cards_order_idx" ON "_pages_v_blocks_link_cards_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_link_cards_cards_parent_id_idx" ON "_pages_v_blocks_link_cards_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_link_cards_order_idx" ON "_pages_v_blocks_link_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_link_cards_parent_id_idx" ON "_pages_v_blocks_link_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_link_cards_path_idx" ON "_pages_v_blocks_link_cards" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_questions_items_order_idx" ON "_pages_v_blocks_questions_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_questions_items_parent_id_idx" ON "_pages_v_blocks_questions_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_questions_order_idx" ON "_pages_v_blocks_questions" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_questions_parent_id_idx" ON "_pages_v_blocks_questions" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_questions_path_idx" ON "_pages_v_blocks_questions" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_benefits_items_order_idx" ON "_pages_v_blocks_benefits_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_benefits_items_parent_id_idx" ON "_pages_v_blocks_benefits_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_benefits_order_idx" ON "_pages_v_blocks_benefits" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_benefits_parent_id_idx" ON "_pages_v_blocks_benefits" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_benefits_path_idx" ON "_pages_v_blocks_benefits" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_curriculum_items_order_idx" ON "_pages_v_blocks_curriculum_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_curriculum_items_parent_id_idx" ON "_pages_v_blocks_curriculum_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_curriculum_order_idx" ON "_pages_v_blocks_curriculum" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_curriculum_parent_id_idx" ON "_pages_v_blocks_curriculum" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_curriculum_path_idx" ON "_pages_v_blocks_curriculum" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_curriculum_image_idx" ON "_pages_v_blocks_curriculum" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_feature_cards_cards_order_idx" ON "_pages_v_blocks_feature_cards_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_feature_cards_cards_parent_id_idx" ON "_pages_v_blocks_feature_cards_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_feature_cards_order_idx" ON "_pages_v_blocks_feature_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_feature_cards_parent_id_idx" ON "_pages_v_blocks_feature_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_feature_cards_path_idx" ON "_pages_v_blocks_feature_cards" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_path_steps_order_idx" ON "_pages_v_blocks_path_steps" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_path_steps_parent_id_idx" ON "_pages_v_blocks_path_steps" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_path_paragraphs_order_idx" ON "_pages_v_blocks_path_paragraphs" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_path_paragraphs_parent_id_idx" ON "_pages_v_blocks_path_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_path_order_idx" ON "_pages_v_blocks_path" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_path_parent_id_idx" ON "_pages_v_blocks_path" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_path_path_idx" ON "_pages_v_blocks_path" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_path_image_idx" ON "_pages_v_blocks_path" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_checklist_items_order_idx" ON "_pages_v_blocks_checklist_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_checklist_items_parent_id_idx" ON "_pages_v_blocks_checklist_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_checklist_order_idx" ON "_pages_v_blocks_checklist" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_checklist_parent_id_idx" ON "_pages_v_blocks_checklist" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_checklist_path_idx" ON "_pages_v_blocks_checklist" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_steps_steps_order_idx" ON "_pages_v_blocks_steps_steps" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_steps_steps_parent_id_idx" ON "_pages_v_blocks_steps_steps" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_steps_order_idx" ON "_pages_v_blocks_steps" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_steps_parent_id_idx" ON "_pages_v_blocks_steps" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_steps_path_idx" ON "_pages_v_blocks_steps" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_mood_video_order_idx" ON "_pages_v_blocks_mood_video" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_mood_video_parent_id_idx" ON "_pages_v_blocks_mood_video" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_mood_video_path_idx" ON "_pages_v_blocks_mood_video" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_full_image_order_idx" ON "_pages_v_blocks_full_image" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_full_image_parent_id_idx" ON "_pages_v_blocks_full_image" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_full_image_path_idx" ON "_pages_v_blocks_full_image" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_full_image_image_idx" ON "_pages_v_blocks_full_image" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_social_band_order_idx" ON "_pages_v_blocks_social_band" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_social_band_parent_id_idx" ON "_pages_v_blocks_social_band" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_social_band_path_idx" ON "_pages_v_blocks_social_band" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_offerings_cards_facts_order_idx" ON "_pages_v_blocks_offerings_cards_facts" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_offerings_cards_facts_parent_id_idx" ON "_pages_v_blocks_offerings_cards_facts" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_offerings_cards_facts_course_price_idx" ON "_pages_v_blocks_offerings_cards_facts" USING btree ("course_price_id");
  CREATE INDEX "_pages_v_blocks_offerings_cards_order_idx" ON "_pages_v_blocks_offerings_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_offerings_cards_parent_id_idx" ON "_pages_v_blocks_offerings_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_offerings_cards_course_idx" ON "_pages_v_blocks_offerings_cards" USING btree ("course_id");
  CREATE INDEX "_pages_v_blocks_offerings_order_idx" ON "_pages_v_blocks_offerings" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_offerings_parent_id_idx" ON "_pages_v_blocks_offerings" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_offerings_path_idx" ON "_pages_v_blocks_offerings" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_reviews_order_idx" ON "_pages_v_blocks_reviews" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_reviews_parent_id_idx" ON "_pages_v_blocks_reviews" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_reviews_path_idx" ON "_pages_v_blocks_reviews" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_instructor_row_order_idx" ON "_pages_v_blocks_instructor_row" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_instructor_row_parent_id_idx" ON "_pages_v_blocks_instructor_row" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_instructor_row_path_idx" ON "_pages_v_blocks_instructor_row" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_instructor_grid_order_idx" ON "_pages_v_blocks_instructor_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_instructor_grid_parent_id_idx" ON "_pages_v_blocks_instructor_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_instructor_grid_path_idx" ON "_pages_v_blocks_instructor_grid" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_upcoming_shows_links_order_idx" ON "_pages_v_blocks_upcoming_shows_links" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_upcoming_shows_links_parent_id_idx" ON "_pages_v_blocks_upcoming_shows_links" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_upcoming_shows_order_idx" ON "_pages_v_blocks_upcoming_shows" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_upcoming_shows_parent_id_idx" ON "_pages_v_blocks_upcoming_shows" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_upcoming_shows_path_idx" ON "_pages_v_blocks_upcoming_shows" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_next_show_banner_order_idx" ON "_pages_v_blocks_next_show_banner" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_next_show_banner_parent_id_idx" ON "_pages_v_blocks_next_show_banner" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_next_show_banner_path_idx" ON "_pages_v_blocks_next_show_banner" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_repertoire_groups_order_idx" ON "_pages_v_blocks_repertoire_groups" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_repertoire_groups_parent_id_idx" ON "_pages_v_blocks_repertoire_groups" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_repertoire_order_idx" ON "_pages_v_blocks_repertoire" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_repertoire_parent_id_idx" ON "_pages_v_blocks_repertoire" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_repertoire_path_idx" ON "_pages_v_blocks_repertoire" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_contact_card_order_idx" ON "_pages_v_blocks_contact_card" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_contact_card_parent_id_idx" ON "_pages_v_blocks_contact_card" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_contact_card_path_idx" ON "_pages_v_blocks_contact_card" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_course_starts_order_idx" ON "_pages_v_blocks_course_starts" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_course_starts_parent_id_idx" ON "_pages_v_blocks_course_starts" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_course_starts_path_idx" ON "_pages_v_blocks_course_starts" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_course_starts_course_idx" ON "_pages_v_blocks_course_starts" USING btree ("course_id");
  CREATE INDEX "_pages_v_blocks_course_prices_order_idx" ON "_pages_v_blocks_course_prices" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_course_prices_parent_id_idx" ON "_pages_v_blocks_course_prices" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_course_prices_path_idx" ON "_pages_v_blocks_course_prices" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_course_prices_course_idx" ON "_pages_v_blocks_course_prices" USING btree ("course_id");
  CREATE INDEX "_pages_v_blocks_course_compare_order_idx" ON "_pages_v_blocks_course_compare" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_course_compare_parent_id_idx" ON "_pages_v_blocks_course_compare" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_course_compare_path_idx" ON "_pages_v_blocks_course_compare" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_upcoming_workshops_order_idx" ON "_pages_v_blocks_upcoming_workshops" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_upcoming_workshops_parent_id_idx" ON "_pages_v_blocks_upcoming_workshops" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_upcoming_workshops_path_idx" ON "_pages_v_blocks_upcoming_workshops" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_past_workshops_order_idx" ON "_pages_v_blocks_past_workshops" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_past_workshops_parent_id_idx" ON "_pages_v_blocks_past_workshops" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_past_workshops_path_idx" ON "_pages_v_blocks_past_workshops" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_open_workshop_sessions_order_idx" ON "_pages_v_blocks_open_workshop_sessions" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_open_workshop_sessions_parent_id_idx" ON "_pages_v_blocks_open_workshop_sessions" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_open_workshop_sessions_path_idx" ON "_pages_v_blocks_open_workshop_sessions" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_programmes_order_idx" ON "_pages_v_blocks_programmes" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_programmes_parent_id_idx" ON "_pages_v_blocks_programmes" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_programmes_path_idx" ON "_pages_v_blocks_programmes" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_quote_request_goals_order_idx" ON "_pages_v_blocks_quote_request_goals" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_quote_request_goals_parent_id_idx" ON "_pages_v_blocks_quote_request_goals" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_quote_request_order_idx" ON "_pages_v_blocks_quote_request" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_quote_request_parent_id_idx" ON "_pages_v_blocks_quote_request" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_quote_request_path_idx" ON "_pages_v_blocks_quote_request" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_quote_request_image_idx" ON "_pages_v_blocks_quote_request" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_contact_people_order_idx" ON "_pages_v_blocks_contact_people" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_contact_people_parent_id_idx" ON "_pages_v_blocks_contact_people" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_contact_people_path_idx" ON "_pages_v_blocks_contact_people" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_location_address_lines_order_idx" ON "_pages_v_blocks_location_address_lines" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_location_address_lines_parent_id_idx" ON "_pages_v_blocks_location_address_lines" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_location_order_idx" ON "_pages_v_blocks_location" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_location_parent_id_idx" ON "_pages_v_blocks_location" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_location_path_idx" ON "_pages_v_blocks_location" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_legal_document_order_idx" ON "_pages_v_blocks_legal_document" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_legal_document_parent_id_idx" ON "_pages_v_blocks_legal_document" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_legal_document_path_idx" ON "_pages_v_blocks_legal_document" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_legal_document_document_idx" ON "_pages_v_blocks_legal_document" USING btree ("document_id");
  CREATE INDEX "_pages_v_blocks_bio_intro_order_idx" ON "_pages_v_blocks_bio_intro" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_bio_intro_parent_id_idx" ON "_pages_v_blocks_bio_intro" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_bio_intro_path_idx" ON "_pages_v_blocks_bio_intro" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_bio_next_show_order_idx" ON "_pages_v_blocks_bio_next_show" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_bio_next_show_parent_id_idx" ON "_pages_v_blocks_bio_next_show" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_bio_next_show_path_idx" ON "_pages_v_blocks_bio_next_show" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_link_list_links_order_idx" ON "_pages_v_blocks_link_list_links" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_link_list_links_parent_id_idx" ON "_pages_v_blocks_link_list_links" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_link_list_order_idx" ON "_pages_v_blocks_link_list" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_link_list_parent_id_idx" ON "_pages_v_blocks_link_list" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_link_list_path_idx" ON "_pages_v_blocks_link_list" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_social_links_order_idx" ON "_pages_v_blocks_social_links" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_social_links_parent_id_idx" ON "_pages_v_blocks_social_links" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_social_links_path_idx" ON "_pages_v_blocks_social_links" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_contact_footer_order_idx" ON "_pages_v_blocks_contact_footer" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_contact_footer_parent_id_idx" ON "_pages_v_blocks_contact_footer" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_contact_footer_path_idx" ON "_pages_v_blocks_contact_footer" USING btree ("_path");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_path_idx" ON "_pages_v" USING btree ("version_path");
  CREATE INDEX "_pages_v_version_version_import_id_idx" ON "_pages_v" USING btree ("version_import_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE INDEX "_pages_v_autosave_idx" ON "_pages_v" USING btree ("autosave");
  CREATE INDEX "_pages_v_rels_order_idx" ON "_pages_v_rels" USING btree ("order");
  CREATE INDEX "_pages_v_rels_parent_idx" ON "_pages_v_rels" USING btree ("parent_id");
  CREATE INDEX "_pages_v_rels_path_idx" ON "_pages_v_rels" USING btree ("path");
  CREATE INDEX "_pages_v_rels_courses_id_idx" ON "_pages_v_rels" USING btree ("courses_id");
  CREATE UNIQUE INDEX "cta_bands_import_id_idx" ON "cta_bands" USING btree ("import_id");
  CREATE INDEX "cta_bands_updated_at_idx" ON "cta_bands" USING btree ("updated_at");
  CREATE INDEX "cta_bands_created_at_idx" ON "cta_bands" USING btree ("created_at");
  CREATE INDEX "legal_pages_effective_date_idx" ON "legal_pages" USING btree ("effective_date");
  CREATE UNIQUE INDEX "legal_pages_slug_idx" ON "legal_pages" USING btree ("slug");
  CREATE UNIQUE INDEX "legal_pages_import_id_idx" ON "legal_pages" USING btree ("import_id");
  CREATE INDEX "legal_pages_updated_at_idx" ON "legal_pages" USING btree ("updated_at");
  CREATE INDEX "legal_pages_created_at_idx" ON "legal_pages" USING btree ("created_at");
  CREATE INDEX "legal_pages__status_idx" ON "legal_pages" USING btree ("_status");
  CREATE INDEX "_legal_pages_v_parent_idx" ON "_legal_pages_v" USING btree ("parent_id");
  CREATE INDEX "_legal_pages_v_version_version_effective_date_idx" ON "_legal_pages_v" USING btree ("version_effective_date");
  CREATE INDEX "_legal_pages_v_version_version_slug_idx" ON "_legal_pages_v" USING btree ("version_slug");
  CREATE INDEX "_legal_pages_v_version_version_import_id_idx" ON "_legal_pages_v" USING btree ("version_import_id");
  CREATE INDEX "_legal_pages_v_version_version_updated_at_idx" ON "_legal_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_legal_pages_v_version_version_created_at_idx" ON "_legal_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_legal_pages_v_version_version__status_idx" ON "_legal_pages_v" USING btree ("version__status");
  CREATE INDEX "_legal_pages_v_created_at_idx" ON "_legal_pages_v" USING btree ("created_at");
  CREATE INDEX "_legal_pages_v_updated_at_idx" ON "_legal_pages_v" USING btree ("updated_at");
  CREATE INDEX "_legal_pages_v_latest_idx" ON "_legal_pages_v" USING btree ("latest");
  CREATE INDEX "productions_highlights_order_idx" ON "productions_highlights" USING btree ("_order");
  CREATE INDEX "productions_highlights_parent_id_idx" ON "productions_highlights" USING btree ("_parent_id");
  CREATE INDEX "productions_audience_quotes_order_idx" ON "productions_audience_quotes" USING btree ("_order");
  CREATE INDEX "productions_audience_quotes_parent_id_idx" ON "productions_audience_quotes" USING btree ("_parent_id");
  CREATE INDEX "productions_credits_order_idx" ON "productions_credits" USING btree ("_order");
  CREATE INDEX "productions_credits_parent_id_idx" ON "productions_credits" USING btree ("_parent_id");
  CREATE INDEX "productions_cast_order_idx" ON "productions_cast" USING btree ("_order");
  CREATE INDEX "productions_cast_parent_id_idx" ON "productions_cast" USING btree ("_parent_id");
  CREATE INDEX "productions_poster_idx" ON "productions" USING btree ("poster_id");
  CREATE INDEX "productions_hero_image_idx" ON "productions" USING btree ("hero_image_id");
  CREATE INDEX "productions_hero_video_idx" ON "productions" USING btree ("hero_video_id");
  CREATE INDEX "productions_invite_video_invite_video_video_idx" ON "productions" USING btree ("invite_video_video_id");
  CREATE INDEX "productions_invite_video_invite_video_poster_idx" ON "productions" USING btree ("invite_video_poster_id");
  CREATE UNIQUE INDEX "productions_slug_idx" ON "productions" USING btree ("slug");
  CREATE UNIQUE INDEX "productions_import_id_idx" ON "productions" USING btree ("import_id");
  CREATE INDEX "productions_updated_at_idx" ON "productions" USING btree ("updated_at");
  CREATE INDEX "productions_created_at_idx" ON "productions" USING btree ("created_at");
  CREATE INDEX "productions__status_idx" ON "productions" USING btree ("_status");
  CREATE INDEX "productions_texts_order_parent" ON "productions_texts" USING btree ("order","parent_id");
  CREATE INDEX "productions_rels_order_idx" ON "productions_rels" USING btree ("order");
  CREATE INDEX "productions_rels_parent_idx" ON "productions_rels" USING btree ("parent_id");
  CREATE INDEX "productions_rels_path_idx" ON "productions_rels" USING btree ("path");
  CREATE INDEX "productions_rels_media_id_idx" ON "productions_rels" USING btree ("media_id");
  CREATE INDEX "_productions_v_version_highlights_order_idx" ON "_productions_v_version_highlights" USING btree ("_order");
  CREATE INDEX "_productions_v_version_highlights_parent_id_idx" ON "_productions_v_version_highlights" USING btree ("_parent_id");
  CREATE INDEX "_productions_v_version_audience_quotes_order_idx" ON "_productions_v_version_audience_quotes" USING btree ("_order");
  CREATE INDEX "_productions_v_version_audience_quotes_parent_id_idx" ON "_productions_v_version_audience_quotes" USING btree ("_parent_id");
  CREATE INDEX "_productions_v_version_credits_order_idx" ON "_productions_v_version_credits" USING btree ("_order");
  CREATE INDEX "_productions_v_version_credits_parent_id_idx" ON "_productions_v_version_credits" USING btree ("_parent_id");
  CREATE INDEX "_productions_v_version_cast_order_idx" ON "_productions_v_version_cast" USING btree ("_order");
  CREATE INDEX "_productions_v_version_cast_parent_id_idx" ON "_productions_v_version_cast" USING btree ("_parent_id");
  CREATE INDEX "_productions_v_parent_idx" ON "_productions_v" USING btree ("parent_id");
  CREATE INDEX "_productions_v_version_version_poster_idx" ON "_productions_v" USING btree ("version_poster_id");
  CREATE INDEX "_productions_v_version_version_hero_image_idx" ON "_productions_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_productions_v_version_version_hero_video_idx" ON "_productions_v" USING btree ("version_hero_video_id");
  CREATE INDEX "_productions_v_version_invite_video_version_invite_video_idx" ON "_productions_v" USING btree ("version_invite_video_video_id");
  CREATE INDEX "_productions_v_version_invite_video_version_invite_vid_1_idx" ON "_productions_v" USING btree ("version_invite_video_poster_id");
  CREATE INDEX "_productions_v_version_version_slug_idx" ON "_productions_v" USING btree ("version_slug");
  CREATE INDEX "_productions_v_version_version_import_id_idx" ON "_productions_v" USING btree ("version_import_id");
  CREATE INDEX "_productions_v_version_version_updated_at_idx" ON "_productions_v" USING btree ("version_updated_at");
  CREATE INDEX "_productions_v_version_version_created_at_idx" ON "_productions_v" USING btree ("version_created_at");
  CREATE INDEX "_productions_v_version_version__status_idx" ON "_productions_v" USING btree ("version__status");
  CREATE INDEX "_productions_v_created_at_idx" ON "_productions_v" USING btree ("created_at");
  CREATE INDEX "_productions_v_updated_at_idx" ON "_productions_v" USING btree ("updated_at");
  CREATE INDEX "_productions_v_latest_idx" ON "_productions_v" USING btree ("latest");
  CREATE INDEX "_productions_v_autosave_idx" ON "_productions_v" USING btree ("autosave");
  CREATE INDEX "_productions_v_texts_order_parent" ON "_productions_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "_productions_v_rels_order_idx" ON "_productions_v_rels" USING btree ("order");
  CREATE INDEX "_productions_v_rels_parent_idx" ON "_productions_v_rels" USING btree ("parent_id");
  CREATE INDEX "_productions_v_rels_path_idx" ON "_productions_v_rels" USING btree ("path");
  CREATE INDEX "_productions_v_rels_media_id_idx" ON "_productions_v_rels" USING btree ("media_id");
  CREATE INDEX "shows_info_order_idx" ON "shows_info" USING btree ("_order");
  CREATE INDEX "shows_info_parent_id_idx" ON "shows_info" USING btree ("_parent_id");
  CREATE INDEX "shows_production_idx" ON "shows" USING btree ("production_id");
  CREATE INDEX "shows_date_idx" ON "shows" USING btree ("date");
  CREATE INDEX "shows_venue_idx" ON "shows" USING btree ("venue_id");
  CREATE UNIQUE INDEX "shows_import_id_idx" ON "shows" USING btree ("import_id");
  CREATE INDEX "shows_updated_at_idx" ON "shows" USING btree ("updated_at");
  CREATE INDEX "shows_created_at_idx" ON "shows" USING btree ("created_at");
  CREATE UNIQUE INDEX "venues_import_id_idx" ON "venues" USING btree ("import_id");
  CREATE INDEX "venues_updated_at_idx" ON "venues" USING btree ("updated_at");
  CREATE INDEX "venues_created_at_idx" ON "venues" USING btree ("created_at");
  CREATE INDEX "courses_starts_order_idx" ON "courses_starts" USING btree ("_order");
  CREATE INDEX "courses_starts_parent_id_idx" ON "courses_starts" USING btree ("_parent_id");
  CREATE INDEX "courses_starts_date_idx" ON "courses_starts" USING btree ("date");
  CREATE INDEX "courses_prices_order_idx" ON "courses_prices" USING btree ("_order");
  CREATE INDEX "courses_prices_parent_id_idx" ON "courses_prices" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_import_id_idx" ON "courses" USING btree ("import_id");
  CREATE INDEX "courses_updated_at_idx" ON "courses" USING btree ("updated_at");
  CREATE INDEX "courses_created_at_idx" ON "courses" USING btree ("created_at");
  CREATE INDEX "open_workshop_sessions_date_idx" ON "open_workshop_sessions" USING btree ("date");
  CREATE INDEX "open_workshop_sessions_booking_deadline_idx" ON "open_workshop_sessions" USING btree ("booking_deadline");
  CREATE UNIQUE INDEX "open_workshop_sessions_import_id_idx" ON "open_workshop_sessions" USING btree ("import_id");
  CREATE INDEX "open_workshop_sessions_updated_at_idx" ON "open_workshop_sessions" USING btree ("updated_at");
  CREATE INDEX "open_workshop_sessions_created_at_idx" ON "open_workshop_sessions" USING btree ("created_at");
  CREATE INDEX "workshops_leader_bio_order_idx" ON "workshops_leader_bio" USING btree ("_order");
  CREATE INDEX "workshops_leader_bio_parent_id_idx" ON "workshops_leader_bio" USING btree ("_parent_id");
  CREATE INDEX "workshops_start_date_idx" ON "workshops" USING btree ("start_date");
  CREATE INDEX "workshops_end_date_idx" ON "workshops" USING btree ("end_date");
  CREATE INDEX "workshops_image_idx" ON "workshops" USING btree ("image_id");
  CREATE UNIQUE INDEX "workshops_import_id_idx" ON "workshops" USING btree ("import_id");
  CREATE INDEX "workshops_updated_at_idx" ON "workshops" USING btree ("updated_at");
  CREATE INDEX "workshops_created_at_idx" ON "workshops" USING btree ("created_at");
  CREATE INDEX "workshops_rels_order_idx" ON "workshops_rels" USING btree ("order");
  CREATE INDEX "workshops_rels_parent_idx" ON "workshops_rels" USING btree ("parent_id");
  CREATE INDEX "workshops_rels_path_idx" ON "workshops_rels" USING btree ("path");
  CREATE INDEX "workshops_rels_media_id_idx" ON "workshops_rels" USING btree ("media_id");
  CREATE INDEX "team_building_programmes_description_order_idx" ON "team_building_programmes_description" USING btree ("_order");
  CREATE INDEX "team_building_programmes_description_parent_id_idx" ON "team_building_programmes_description" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "team_building_programmes_import_id_idx" ON "team_building_programmes" USING btree ("import_id");
  CREATE INDEX "team_building_programmes_updated_at_idx" ON "team_building_programmes" USING btree ("updated_at");
  CREATE INDEX "team_building_programmes_created_at_idx" ON "team_building_programmes" USING btree ("created_at");
  CREATE INDEX "instructors_bio_order_idx" ON "instructors_bio" USING btree ("_order");
  CREATE INDEX "instructors_bio_parent_id_idx" ON "instructors_bio" USING btree ("_parent_id");
  CREATE INDEX "instructors_photo_idx" ON "instructors" USING btree ("photo_id");
  CREATE UNIQUE INDEX "instructors_import_id_idx" ON "instructors" USING btree ("import_id");
  CREATE INDEX "instructors_updated_at_idx" ON "instructors" USING btree ("updated_at");
  CREATE INDEX "instructors_created_at_idx" ON "instructors" USING btree ("created_at");
  CREATE INDEX "reviews_full_text_order_idx" ON "reviews_full_text" USING btree ("_order");
  CREATE INDEX "reviews_full_text_parent_id_idx" ON "reviews_full_text" USING btree ("_parent_id");
  CREATE INDEX "reviews_photo_idx" ON "reviews" USING btree ("photo_id");
  CREATE UNIQUE INDEX "reviews_import_id_idx" ON "reviews" USING btree ("import_id");
  CREATE INDEX "reviews_updated_at_idx" ON "reviews" USING btree ("updated_at");
  CREATE INDEX "reviews_created_at_idx" ON "reviews" USING btree ("created_at");
  CREATE INDEX "contact_people_photo_idx" ON "contact_people" USING btree ("photo_id");
  CREATE UNIQUE INDEX "contact_people_import_id_idx" ON "contact_people" USING btree ("import_id");
  CREATE INDEX "contact_people_updated_at_idx" ON "contact_people" USING btree ("updated_at");
  CREATE INDEX "contact_people_created_at_idx" ON "contact_people" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_import_id_idx" ON "media" USING btree ("import_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_poster_sizes_poster_filename_idx" ON "media" USING btree ("sizes_poster_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_gallery_sizes_gallery_filename_idx" ON "media" USING btree ("sizes_gallery_filename");
  CREATE INDEX "media_sizes_band_sizes_band_filename_idx" ON "media" USING btree ("sizes_band_filename");
  CREATE INDEX "media_sizes_og_sizes_og_filename_idx" ON "media" USING btree ("sizes_og_filename");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_cta_bands_id_idx" ON "payload_locked_documents_rels" USING btree ("cta_bands_id");
  CREATE INDEX "payload_locked_documents_rels_legal_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("legal_pages_id");
  CREATE INDEX "payload_locked_documents_rels_productions_id_idx" ON "payload_locked_documents_rels" USING btree ("productions_id");
  CREATE INDEX "payload_locked_documents_rels_shows_id_idx" ON "payload_locked_documents_rels" USING btree ("shows_id");
  CREATE INDEX "payload_locked_documents_rels_venues_id_idx" ON "payload_locked_documents_rels" USING btree ("venues_id");
  CREATE INDEX "payload_locked_documents_rels_courses_id_idx" ON "payload_locked_documents_rels" USING btree ("courses_id");
  CREATE INDEX "payload_locked_documents_rels_open_workshop_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("open_workshop_sessions_id");
  CREATE INDEX "payload_locked_documents_rels_workshops_id_idx" ON "payload_locked_documents_rels" USING btree ("workshops_id");
  CREATE INDEX "payload_locked_documents_rels_team_building_programmes_i_idx" ON "payload_locked_documents_rels" USING btree ("team_building_programmes_id");
  CREATE INDEX "payload_locked_documents_rels_instructors_id_idx" ON "payload_locked_documents_rels" USING btree ("instructors_id");
  CREATE INDEX "payload_locked_documents_rels_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("reviews_id");
  CREATE INDEX "payload_locked_documents_rels_contact_people_id_idx" ON "payload_locked_documents_rels" USING btree ("contact_people_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_nav_order_idx" ON "site_settings_nav" USING btree ("_order");
  CREATE INDEX "site_settings_nav_parent_id_idx" ON "site_settings_nav" USING btree ("_parent_id");
  CREATE INDEX "site_settings_footer_columns_links_order_idx" ON "site_settings_footer_columns_links" USING btree ("_order");
  CREATE INDEX "site_settings_footer_columns_links_parent_id_idx" ON "site_settings_footer_columns_links" USING btree ("_parent_id");
  CREATE INDEX "site_settings_footer_columns_order_idx" ON "site_settings_footer_columns" USING btree ("_order");
  CREATE INDEX "site_settings_footer_columns_parent_id_idx" ON "site_settings_footer_columns" USING btree ("_parent_id");
  CREATE INDEX "site_settings_contact_contact_primary_person_idx" ON "site_settings" USING btree ("contact_primary_person_id");
  CREATE INDEX "site_settings_production_page_production_page_cta_band_idx" ON "site_settings" USING btree ("production_page_cta_band_id");
  CREATE INDEX "site_settings_texts_order_parent" ON "site_settings_texts" USING btree ("order","parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_home_hero_keywords" CASCADE;
  DROP TABLE "pages_blocks_home_hero" CASCADE;
  DROP TABLE "pages_blocks_page_hero_switcher_pages" CASCADE;
  DROP TABLE "pages_blocks_page_hero_facts" CASCADE;
  DROP TABLE "pages_blocks_page_hero_buttons" CASCADE;
  DROP TABLE "pages_blocks_page_hero" CASCADE;
  DROP TABLE "pages_blocks_cta_band" CASCADE;
  DROP TABLE "pages_blocks_text_split_facts" CASCADE;
  DROP TABLE "pages_blocks_text_split" CASCADE;
  DROP TABLE "pages_blocks_statement" CASCADE;
  DROP TABLE "pages_blocks_image_text_paragraphs" CASCADE;
  DROP TABLE "pages_blocks_image_text" CASCADE;
  DROP TABLE "pages_blocks_link_cards_cards" CASCADE;
  DROP TABLE "pages_blocks_link_cards" CASCADE;
  DROP TABLE "pages_blocks_questions_items" CASCADE;
  DROP TABLE "pages_blocks_questions" CASCADE;
  DROP TABLE "pages_blocks_benefits_items" CASCADE;
  DROP TABLE "pages_blocks_benefits" CASCADE;
  DROP TABLE "pages_blocks_curriculum_items" CASCADE;
  DROP TABLE "pages_blocks_curriculum" CASCADE;
  DROP TABLE "pages_blocks_feature_cards_cards" CASCADE;
  DROP TABLE "pages_blocks_feature_cards" CASCADE;
  DROP TABLE "pages_blocks_path_steps" CASCADE;
  DROP TABLE "pages_blocks_path_paragraphs" CASCADE;
  DROP TABLE "pages_blocks_path" CASCADE;
  DROP TABLE "pages_blocks_checklist_items" CASCADE;
  DROP TABLE "pages_blocks_checklist" CASCADE;
  DROP TABLE "pages_blocks_steps_steps" CASCADE;
  DROP TABLE "pages_blocks_steps" CASCADE;
  DROP TABLE "pages_blocks_mood_video" CASCADE;
  DROP TABLE "pages_blocks_full_image" CASCADE;
  DROP TABLE "pages_blocks_social_band" CASCADE;
  DROP TABLE "pages_blocks_offerings_cards_facts" CASCADE;
  DROP TABLE "pages_blocks_offerings_cards" CASCADE;
  DROP TABLE "pages_blocks_offerings" CASCADE;
  DROP TABLE "pages_blocks_reviews" CASCADE;
  DROP TABLE "pages_blocks_instructor_row" CASCADE;
  DROP TABLE "pages_blocks_instructor_grid" CASCADE;
  DROP TABLE "pages_blocks_upcoming_shows_links" CASCADE;
  DROP TABLE "pages_blocks_upcoming_shows" CASCADE;
  DROP TABLE "pages_blocks_next_show_banner" CASCADE;
  DROP TABLE "pages_blocks_repertoire_groups" CASCADE;
  DROP TABLE "pages_blocks_repertoire" CASCADE;
  DROP TABLE "pages_blocks_contact_card" CASCADE;
  DROP TABLE "pages_blocks_course_starts" CASCADE;
  DROP TABLE "pages_blocks_course_prices" CASCADE;
  DROP TABLE "pages_blocks_course_compare" CASCADE;
  DROP TABLE "pages_blocks_upcoming_workshops" CASCADE;
  DROP TABLE "pages_blocks_past_workshops" CASCADE;
  DROP TABLE "pages_blocks_open_workshop_sessions" CASCADE;
  DROP TABLE "pages_blocks_programmes" CASCADE;
  DROP TABLE "pages_blocks_quote_request_goals" CASCADE;
  DROP TABLE "pages_blocks_quote_request" CASCADE;
  DROP TABLE "pages_blocks_contact_people" CASCADE;
  DROP TABLE "pages_blocks_location_address_lines" CASCADE;
  DROP TABLE "pages_blocks_location" CASCADE;
  DROP TABLE "pages_blocks_legal_document" CASCADE;
  DROP TABLE "pages_blocks_bio_intro" CASCADE;
  DROP TABLE "pages_blocks_bio_next_show" CASCADE;
  DROP TABLE "pages_blocks_link_list_links" CASCADE;
  DROP TABLE "pages_blocks_link_list" CASCADE;
  DROP TABLE "pages_blocks_social_links" CASCADE;
  DROP TABLE "pages_blocks_contact_footer" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "pages_rels" CASCADE;
  DROP TABLE "_pages_v_blocks_home_hero_keywords" CASCADE;
  DROP TABLE "_pages_v_blocks_home_hero" CASCADE;
  DROP TABLE "_pages_v_blocks_page_hero_switcher_pages" CASCADE;
  DROP TABLE "_pages_v_blocks_page_hero_facts" CASCADE;
  DROP TABLE "_pages_v_blocks_page_hero_buttons" CASCADE;
  DROP TABLE "_pages_v_blocks_page_hero" CASCADE;
  DROP TABLE "_pages_v_blocks_cta_band" CASCADE;
  DROP TABLE "_pages_v_blocks_text_split_facts" CASCADE;
  DROP TABLE "_pages_v_blocks_text_split" CASCADE;
  DROP TABLE "_pages_v_blocks_statement" CASCADE;
  DROP TABLE "_pages_v_blocks_image_text_paragraphs" CASCADE;
  DROP TABLE "_pages_v_blocks_image_text" CASCADE;
  DROP TABLE "_pages_v_blocks_link_cards_cards" CASCADE;
  DROP TABLE "_pages_v_blocks_link_cards" CASCADE;
  DROP TABLE "_pages_v_blocks_questions_items" CASCADE;
  DROP TABLE "_pages_v_blocks_questions" CASCADE;
  DROP TABLE "_pages_v_blocks_benefits_items" CASCADE;
  DROP TABLE "_pages_v_blocks_benefits" CASCADE;
  DROP TABLE "_pages_v_blocks_curriculum_items" CASCADE;
  DROP TABLE "_pages_v_blocks_curriculum" CASCADE;
  DROP TABLE "_pages_v_blocks_feature_cards_cards" CASCADE;
  DROP TABLE "_pages_v_blocks_feature_cards" CASCADE;
  DROP TABLE "_pages_v_blocks_path_steps" CASCADE;
  DROP TABLE "_pages_v_blocks_path_paragraphs" CASCADE;
  DROP TABLE "_pages_v_blocks_path" CASCADE;
  DROP TABLE "_pages_v_blocks_checklist_items" CASCADE;
  DROP TABLE "_pages_v_blocks_checklist" CASCADE;
  DROP TABLE "_pages_v_blocks_steps_steps" CASCADE;
  DROP TABLE "_pages_v_blocks_steps" CASCADE;
  DROP TABLE "_pages_v_blocks_mood_video" CASCADE;
  DROP TABLE "_pages_v_blocks_full_image" CASCADE;
  DROP TABLE "_pages_v_blocks_social_band" CASCADE;
  DROP TABLE "_pages_v_blocks_offerings_cards_facts" CASCADE;
  DROP TABLE "_pages_v_blocks_offerings_cards" CASCADE;
  DROP TABLE "_pages_v_blocks_offerings" CASCADE;
  DROP TABLE "_pages_v_blocks_reviews" CASCADE;
  DROP TABLE "_pages_v_blocks_instructor_row" CASCADE;
  DROP TABLE "_pages_v_blocks_instructor_grid" CASCADE;
  DROP TABLE "_pages_v_blocks_upcoming_shows_links" CASCADE;
  DROP TABLE "_pages_v_blocks_upcoming_shows" CASCADE;
  DROP TABLE "_pages_v_blocks_next_show_banner" CASCADE;
  DROP TABLE "_pages_v_blocks_repertoire_groups" CASCADE;
  DROP TABLE "_pages_v_blocks_repertoire" CASCADE;
  DROP TABLE "_pages_v_blocks_contact_card" CASCADE;
  DROP TABLE "_pages_v_blocks_course_starts" CASCADE;
  DROP TABLE "_pages_v_blocks_course_prices" CASCADE;
  DROP TABLE "_pages_v_blocks_course_compare" CASCADE;
  DROP TABLE "_pages_v_blocks_upcoming_workshops" CASCADE;
  DROP TABLE "_pages_v_blocks_past_workshops" CASCADE;
  DROP TABLE "_pages_v_blocks_open_workshop_sessions" CASCADE;
  DROP TABLE "_pages_v_blocks_programmes" CASCADE;
  DROP TABLE "_pages_v_blocks_quote_request_goals" CASCADE;
  DROP TABLE "_pages_v_blocks_quote_request" CASCADE;
  DROP TABLE "_pages_v_blocks_contact_people" CASCADE;
  DROP TABLE "_pages_v_blocks_location_address_lines" CASCADE;
  DROP TABLE "_pages_v_blocks_location" CASCADE;
  DROP TABLE "_pages_v_blocks_legal_document" CASCADE;
  DROP TABLE "_pages_v_blocks_bio_intro" CASCADE;
  DROP TABLE "_pages_v_blocks_bio_next_show" CASCADE;
  DROP TABLE "_pages_v_blocks_link_list_links" CASCADE;
  DROP TABLE "_pages_v_blocks_link_list" CASCADE;
  DROP TABLE "_pages_v_blocks_social_links" CASCADE;
  DROP TABLE "_pages_v_blocks_contact_footer" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "_pages_v_rels" CASCADE;
  DROP TABLE "cta_bands" CASCADE;
  DROP TABLE "legal_pages" CASCADE;
  DROP TABLE "_legal_pages_v" CASCADE;
  DROP TABLE "productions_highlights" CASCADE;
  DROP TABLE "productions_audience_quotes" CASCADE;
  DROP TABLE "productions_credits" CASCADE;
  DROP TABLE "productions_cast" CASCADE;
  DROP TABLE "productions" CASCADE;
  DROP TABLE "productions_texts" CASCADE;
  DROP TABLE "productions_rels" CASCADE;
  DROP TABLE "_productions_v_version_highlights" CASCADE;
  DROP TABLE "_productions_v_version_audience_quotes" CASCADE;
  DROP TABLE "_productions_v_version_credits" CASCADE;
  DROP TABLE "_productions_v_version_cast" CASCADE;
  DROP TABLE "_productions_v" CASCADE;
  DROP TABLE "_productions_v_texts" CASCADE;
  DROP TABLE "_productions_v_rels" CASCADE;
  DROP TABLE "shows_info" CASCADE;
  DROP TABLE "shows" CASCADE;
  DROP TABLE "venues" CASCADE;
  DROP TABLE "courses_starts" CASCADE;
  DROP TABLE "courses_prices" CASCADE;
  DROP TABLE "courses" CASCADE;
  DROP TABLE "open_workshop_sessions" CASCADE;
  DROP TABLE "workshops_leader_bio" CASCADE;
  DROP TABLE "workshops" CASCADE;
  DROP TABLE "workshops_rels" CASCADE;
  DROP TABLE "team_building_programmes_description" CASCADE;
  DROP TABLE "team_building_programmes" CASCADE;
  DROP TABLE "instructors_bio" CASCADE;
  DROP TABLE "instructors" CASCADE;
  DROP TABLE "reviews_full_text" CASCADE;
  DROP TABLE "reviews" CASCADE;
  DROP TABLE "contact_people" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings_nav" CASCADE;
  DROP TABLE "site_settings_footer_columns_links" CASCADE;
  DROP TABLE "site_settings_footer_columns" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "site_settings_texts" CASCADE;
  DROP TABLE "ui" CASCADE;
  DROP TABLE "payload_jobs_stats" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_home_hero_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_home_hero_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_page_hero_buttons_variant";
  DROP TYPE "public"."enum_pages_blocks_page_hero_buttons_show_if";
  DROP TYPE "public"."enum_pages_blocks_page_hero_layout_shape";
  DROP TYPE "public"."enum_pages_blocks_page_hero_layout_size";
  DROP TYPE "public"."enum_pages_blocks_page_hero_layout_position";
  DROP TYPE "public"."enum_pages_blocks_page_hero_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_page_hero_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_cta_band_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_cta_band_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_text_split_size";
  DROP TYPE "public"."enum_pages_blocks_text_split_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_text_split_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_statement_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_statement_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_image_text_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_image_text_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_link_cards_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_link_cards_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_questions_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_questions_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_benefits_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_benefits_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_curriculum_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_curriculum_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_feature_cards_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_feature_cards_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_path_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_path_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_checklist_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_checklist_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_steps_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_steps_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_mood_video_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_mood_video_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_full_image_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_full_image_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_social_band_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_social_band_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_offerings_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_offerings_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_reviews_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_reviews_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_instructor_row_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_instructor_row_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_instructor_grid_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_instructor_grid_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_upcoming_shows_variant";
  DROP TYPE "public"."enum_pages_blocks_upcoming_shows_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_upcoming_shows_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_next_show_banner_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_next_show_banner_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_repertoire_groups_group";
  DROP TYPE "public"."enum_pages_blocks_repertoire_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_repertoire_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_contact_card_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_contact_card_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_course_starts_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_course_starts_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_course_prices_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_course_prices_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_course_compare_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_course_compare_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_upcoming_workshops_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_upcoming_workshops_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_past_workshops_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_past_workshops_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_open_workshop_sessions_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_open_workshop_sessions_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_programmes_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_programmes_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_quote_request_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_quote_request_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_contact_people_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_contact_people_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_location_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_location_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_legal_document_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_legal_document_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_bio_intro_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_bio_intro_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_bio_next_show_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_bio_next_show_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_link_list_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_link_list_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_social_links_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_social_links_spacing_bottom";
  DROP TYPE "public"."enum_pages_blocks_contact_footer_spacing_top";
  DROP TYPE "public"."enum_pages_blocks_contact_footer_spacing_bottom";
  DROP TYPE "public"."enum_pages_layout";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_blocks_home_hero_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_home_hero_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_page_hero_buttons_variant";
  DROP TYPE "public"."enum__pages_v_blocks_page_hero_buttons_show_if";
  DROP TYPE "public"."enum__pages_v_blocks_page_hero_layout_shape";
  DROP TYPE "public"."enum__pages_v_blocks_page_hero_layout_size";
  DROP TYPE "public"."enum__pages_v_blocks_page_hero_layout_position";
  DROP TYPE "public"."enum__pages_v_blocks_page_hero_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_page_hero_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_cta_band_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_cta_band_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_text_split_size";
  DROP TYPE "public"."enum__pages_v_blocks_text_split_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_text_split_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_statement_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_statement_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_image_text_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_image_text_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_link_cards_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_link_cards_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_questions_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_questions_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_benefits_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_benefits_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_curriculum_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_curriculum_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_feature_cards_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_feature_cards_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_path_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_path_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_checklist_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_checklist_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_steps_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_steps_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_mood_video_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_mood_video_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_full_image_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_full_image_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_social_band_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_social_band_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_offerings_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_offerings_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_reviews_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_reviews_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_instructor_row_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_instructor_row_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_instructor_grid_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_instructor_grid_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_upcoming_shows_variant";
  DROP TYPE "public"."enum__pages_v_blocks_upcoming_shows_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_upcoming_shows_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_next_show_banner_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_next_show_banner_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_repertoire_groups_group";
  DROP TYPE "public"."enum__pages_v_blocks_repertoire_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_repertoire_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_contact_card_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_contact_card_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_course_starts_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_course_starts_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_course_prices_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_course_prices_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_course_compare_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_course_compare_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_upcoming_workshops_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_upcoming_workshops_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_past_workshops_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_past_workshops_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_open_workshop_sessions_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_open_workshop_sessions_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_programmes_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_programmes_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_quote_request_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_quote_request_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_contact_people_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_contact_people_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_location_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_location_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_legal_document_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_legal_document_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_bio_intro_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_bio_intro_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_bio_next_show_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_bio_next_show_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_link_list_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_link_list_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_social_links_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_social_links_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_blocks_contact_footer_spacing_top";
  DROP TYPE "public"."enum__pages_v_blocks_contact_footer_spacing_bottom";
  DROP TYPE "public"."enum__pages_v_version_layout";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum_legal_pages_status";
  DROP TYPE "public"."enum__legal_pages_v_version_status";
  DROP TYPE "public"."enum_productions_group";
  DROP TYPE "public"."enum_productions_status";
  DROP TYPE "public"."enum__productions_v_version_group";
  DROP TYPE "public"."enum__productions_v_version_status";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";`)
}
