/**
 * MCP (@payloadcms/plugin-mcp): an AI assistant (Claude…) edits the site's content through /api/mcp.
 * A key (Admin → MCP API kulcsok) acts as the staff member who made it, with their access, and its
 * checkboxes narrow what it may do. Only content is offered: no one's personal data (accounts,
 * applications, bookings, payments, invoices, groups), no settings with addresses or billing, and
 * nothing can be deleted. Pages and productions have drafts: changes can be saved as a draft, checked
 * in the preview and published in the admin.
 */
import type { MCPPluginConfig } from '@payloadcms/plugin-mcp';

import { isAdmin } from './access';
import { navGroup } from './nav';

const edit = { find: true, create: true, update: true, delete: false };
const change = { find: true, update: true, create: false, delete: false };

export const mcpConfig: MCPPluginConfig = {
  collections: {
    pages: {
      enabled: edit,
      description: 'A weboldal oldalai: útvonal (path), SEO (meta) és blokkok (blocks) sorrendben.',
    },
    productions: {
      enabled: edit,
      description: 'Előadások (darabok): történet, szereposztás, galéria, SEO; a /repertoar/<slug> oldal.',
    },
    shows: {
      enabled: edit,
      description: 'Az előadások időpontjai: dátum, idő, helyszín, jegylink vagy saját foglalás.',
    },
    venues: { enabled: edit, description: 'Helyszínek: teljes cím és rövid név.' },
    courses: { enabled: change, description: 'Kurzusok (kezdő, szakmai): leírások, árak, jelentkezési szövegek.' },
    workshops: { enabled: edit, description: 'Workshopok és táborok.' },
    instructors: { enabled: edit, description: 'Oktatók: név, szerep, bemutatkozás, fotó.' },
    reviews: { enabled: edit, description: 'Vélemények (hallgatók, nézők).' },
    contactPeople: { enabled: change, description: 'Kapcsolattartók a Kapcsolat oldalon (nyilvános telefonszám).' },
    teamBuildingProgrammes: { enabled: edit, description: 'Céges csapatépítő programok.' },
    ctaBands: { enabled: edit, description: 'Újrahasznosítható felhívás sávok (gombokkal), oldalakra hivatkozva.' },
    legalPages: { enabled: change, description: 'Jogi szövegek (ÁSZF, adatkezelés).' },
    redirects: {
      enabled: edit,
      description: 'Átirányítások: régi címek → mostani oldalak ("/regi/*": minden alatta).',
    },
    media: { enabled: change, description: 'Képek: alt szöveg és fókuszpont (feltöltés az adminban).' },
    uiTexts: { enabled: change, description: 'Felületi szövegek nyelvenként (ICU: {name}, <b>, <link>).' },
  },
  userCollection: 'users',
  // keys only by admins (the plugin's default lets any logged-in account, a student's too, make its own)
  overrideApiKeyCollection: (collection) => ({
    ...collection,
    labels: { singular: 'MCP API kulcs', plural: 'MCP API kulcsok' },
    access: { ...collection.access, create: isAdmin, read: isAdmin, update: isAdmin, delete: isAdmin },
    admin: {
      ...collection.admin,
      group: navGroup('payload-mcp-api-keys'),
      description:
        'Kulcs egy AI-asszisztensnek (pl. Claude), hogy a weboldal tartalmát szerkessze (/api/mcp). A kulcs a létrehozója nevében és jogaival dolgozik; a jelölőnégyzetek szűkítik, mit tehet. Ne oszd meg, és töröld, ha már nem kell.',
    },
  }),
  globals: {
    siteSettings: {
      enabled: { find: true, update: true },
      description: 'A weboldal egészére: név, menü, lábléc, elérhetőség.',
    },
    emailTexts: { enabled: { find: true, update: true }, description: 'Az e-mailek szövegei.' },
  },
};
