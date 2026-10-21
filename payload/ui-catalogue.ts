/**
 * The catalogue of the UI texts (Beállítások → Felületi szövegek): which texts the website has,
 * grouped, with each one's label in the admin. Only the keys and labels — the wording, per
 * language, is in the database (the `uiTexts` collection, payload/ui-texts.ts).
 *
 * The texts' syntax follows ICU MessageFormat, so they can be translated later: `{name}` is filled
 * in by the site. Headings mark the highlighted part with *asterisks*, as the page content does.
 * No server code here: the admin's form imports it.
 */

/** group → [label, { key: label }]; `{ long: label }`: a textarea. */
export type UiSpec = { readonly [key: string]: string | { readonly long: string } | readonly [string, UiSpec] };

const SITE = {
  common: [
    'Általános',
    {
      close: 'Bezárás',
      readMore: 'Tovább olvasom',
      more: 'Bővebben',
      signup: 'Jelentkezem gomb',
      mainNav: 'Főmenü (felolvasott név)',
      openMenu: 'Menü megnyitása (felolvasott)',
      closeMenu: 'Menü bezárása (felolvasott)',
      sliderPage: 'Csúszka oldala — {n} = szám',
      slideshow: 'Diavetítés (felolvasott)',
      playVideo: 'Videó lejátszása — {title} = cím',
      facebook: 'Facebook ikon (felolvasott)',
      instagram: 'Instagram ikon (felolvasott)',
      toc: 'Tartalom (felirat)',
      tocLabel: 'Tartalomjegyzék (felolvasott)',
      links: 'Linkek (felolvasott)',
      logo: 'Logó (felolvasott)',
      account: 'Fiókom link (fejléc, visszaigazolások)',
      login: 'Belépés link (fejléc)',
      wait: 'Gomb munka közben',
      cancel: 'Mégse gomb',
      save: 'Mentés gomb',
    },
  ],
  forms: [
    'Űrlapok',
    {
      required: 'A kötelező mezők jelölése',
      lastName: 'Vezetéknév',
      firstName: 'Keresztnév',
      email: 'E-mail-cím',
      phone: 'Telefonszám',
      password: 'Jelszó',
      optional: 'Nem kötelező mező (a felirat után)',
      privacy: 'Adatkezelés elfogadása — <link>…</link> = az adatkezelési tájékoztató linkje',
      loggedInAs: 'Bejelentkezve — <b>{name}</b> = név, {email} = e-mail-cím',
      haveAccount: 'Van már fiókod? (a „Lépj be” link előtt)',
      logIn: 'Lépj be link',
      loading: 'Betöltés',
      billingName: 'Számlázási név',
      zip: 'Irányítószám',
      city: 'Város',
      address: 'Cím',
      country: 'Ország',
      taxNumber: 'Adószám',
    },
  ],
  signup: [
    'Jelentkezés (ablak)',
    {
      eyebrow: 'Felcím',
      eyebrowProfessional: 'Felcím: szakmai kurzus',
      fee: 'Részvételi díj címke',
      done: { long: 'Jelentkezés után (Nyitott Műhely, kezdő)' },
      doneProfessional: { long: 'Jelentkezés után (szakmai)' },
      track: 'Jelentkezés után: a fiókban (a „Fiókom” link előtt)',
      trackGuest: 'Jelentkezés után, új fióknál (a „Fiókom” link után)',
      group: 'Melyik csoportba? (mező)',
      choose: 'Válassz… (üres választás)',
      motivation: 'Szakmai: motiváció (mező)',
      motivationHint: { long: 'Szakmai: motiváció kérdése' },
      motivationCount: 'Szakmai: karakterszám — {count} = eddig, {min} = legalább',
      submitProfessional: 'Szakmai: küldés gomb',
      loginAfter: 'A „Van már fiókod? Lépj be” után',
      groupLabel: 'Csoport a listában — {title} = csoport, {date} = indulás',
      starts: 'Indulás — {date} = nap, {time} = idő',
      startsAt: 'Indulás idővel — {date} = nap, {time} = idő',
      opensAt: 'Még nem nyílt meg — {time} = mikortól',
      noGroupProfessional: 'Szakmai: csoport nélkül (választás)',
      noGroupBeginner: 'Kezdő: csoport nélkül (választás)',
      noStart: { long: 'Kezdő: ha nincs induló csoport' },
    },
  ],
  shows: [
    'Előadások',
    {
      ticket: 'Jegyek gomb',
      registration: 'Regisztráció gomb',
      about: 'Az előadásról',
      info: 'Tudnivalók',
      nextShow: 'Következő előadás',
      onStage: 'Műsoron címke',
      upcomingCount: 'Előadások száma — {count} = szám',
      empty: 'Nincs közelgő előadás',
    },
  ],
  production: [
    'Előadás aloldal',
    {
      backLink: 'Vissza a repertoárhoz',
      upcomingLink: 'Közelgő előadások link',
      about: 'Az előadásról cím',
      highlights: 'Pontok címe',
      quotes: 'Nézői vélemények címe',
      video: 'Videó címe',
      gallery: 'Galéria címe',
      galleryLabel: 'Galéria (felolvasott) — {title} = cím',
      dates: 'Időpontok címe',
      noDates: 'Nincs időpont',
      ctaDates: 'Időpontok gomb',
      ctaBook: 'Foglalás gomb',
      ctaConvinced: 'Meggyőztetek gomb',
      invite: 'Meghívó videó címe',
    },
  ],
  repertoire: [
    'Repertoár szűrő',
    { filter: 'Szűrés (felolvasott)', all: 'Mind', company: 'Társulati', students: 'Hallgatói' },
  ],
  reviews: [
    'Vélemények',
    { previous: 'Előző (felolvasott)', next: 'Következő (felolvasott)', photoPlaceholder: 'Fotó helye — {name} = név' },
  ],
  gallery: [
    'Galéria',
    {
      previous: 'Előző képek',
      next: 'Következő képek',
      previousImage: 'Előző kép',
      nextImage: 'Következő kép',
      zoom: 'Nagyítás — {alt} = kép leírása',
    },
  ],
  course: [
    'Kurzusok',
    {
      rhythm: 'Ritmus',
      length: 'Hossz',
      admission: 'Felvétel',
      price: 'Díj',
      priceFrom: 'Legkisebb ár több fizetési lehetőségnél — {price} = ár',
      start: 'Indulás',
      startRolling: 'Folyamatos jelentkezés',
      startSoon: 'Hamarosan',
      details: 'Részletek',
      nextIntake: 'Következő indulás',
      startsEmpty: 'Nincs induló csoport',
      startsEmptyLink: ['Link üres állapotban', { label: 'Felirat', href: 'Cím (link)' }],
    },
  ],
  workshops: [
    'Workshopok',
    {
      date: 'Időpont',
      time: 'Napi időbeosztás',
      leader: 'Kurzusvezető',
      leaderHeading: 'A kurzusvezetőről',
      empty: 'Nincs workshop',
      followUs: 'Kövess minket',
    },
  ],
  sessions: [
    'Nyitott Műhely',
    {
      book: 'Jelentkezem gomb',
      closed: 'Lezárult',
      needed: 'Még kell jelentkező — {count} = szám',
      confirmed: 'Biztosan indul',
      full: 'Megtelt',
      left: 'Szabad helyek — {count} = szám',
      empty: 'Nincs időpont',
    },
  ],
  showBooking: [
    'Jegyfoglalás (saját foglalású előadások)',
    {
      seats: 'Jegyek száma (mező)',
      free: 'Ingyenes előadás (ár helyett)',
      perTicket: 'Jegyár — {price} = ár',
      submit: 'Ingyenes foglalás gomb',
      done: { long: 'Ingyenes foglalás után' },
      track: { long: 'Ingyenes foglalás után: a fiókban' },
      title: 'Jegyvásárlás oldal: böngésző címsor és felcím',
      noRefund: { long: 'Jegyvásárlás: feltétel (nem mondható le)' },
      closed: { long: 'Ha már nem lehet jegyet venni' },
      back: 'Vissza az előadáshoz link',
      loginAfter: 'Foglalás: a „Van már fiókod? Lépj be” után',
      checkoutLoginAfter: 'Jegyvásárlás: a „Van már fiókod? Lépj be” után',
      terms: 'Jegyvásárlás: nincs elfogadva az ÁSZF',
      orderHeading: 'Fizetés után: cím',
      orderCancelled: 'Fizetés után: megszakítva',
      orderAgain: 'Fizetés után: újra',
      ticket: 'Jegy oldal: felcím (és a „Jegy” sor)',
      ticketWhen: 'Jegy oldal: mikor',
      ticketWhere: 'Jegy oldal: hol',
      ticketName: 'Jegy oldal: név',
      ticketOf: 'Hányadik jegy — {n} = hányadik, {of} = összesen',
      ticketValid: 'Érvényes jegy',
      ticketUsed: 'Felhasznált jegy — {time} = mikor',
      ticketUsedShort: 'Felhasználva (a fiókban)',
      ticketInvalid: 'Érvénytelen jegy',
      ticketShow: 'A QR-kód alatt (nem munkatársnak)',
      ticketUse: 'Munkatárs: felhasználás gomb',
      ticketDone: 'Munkatárs: felhasználás után',
      ticketUsedAlready: 'Munkatárs: már felhasznált',
      myTickets: 'Fiók: jegyeim (cím)',
      myTicketsIntro: { long: 'Fiók: jegyeim (bevezető)' },
    },
  ],
  googleLogin: [
    'Google-belépés',
    {
      button: 'Gomb (belépés és regisztráció)',
      or: 'Elválasztó a gomb és az űrlap között',
      consent: 'A gomb alatt — <link>…</link> = az adatkezelési tájékoztató linkje',
      cancelled: 'Hiba: a Google-nál megszakította',
      failed: 'Hiba: nem sikerült (lejárt, újrapróbálható)',
      unverified: 'Hiba: nincs megerősített e-mail-cím a Google-fiókban',
      linked: 'Fiók adatai: csatolt Google-fiók',
    },
  ],
  teamBuilding: ['Csapatépítő', { duration: 'Időkeret', venue: 'Helyszín' }],
  quoteForm: [
    'Árajánlat űrlap',
    {
      title: 'Cím',
      required: 'Kötelező mezők',
      fields: [
        'Mezők',
        {
          company: 'Cég',
          lastName: 'Vezetéknév',
          firstName: 'Keresztnév',
          email: 'E-mail',
          phone: 'Telefon',
          message: 'Üzenet',
        },
      ],
      messagePlaceholder: 'Üzenet mintaszöveg',
      error: 'Hibaüzenet',
      submit: 'Küldés gomb',
      note: 'Megjegyzés a gomb alatt',
      subject: 'E-mail tárgya — {company} = cég',
      mail: ['Az e-mail címkéi', { company: 'Cég', contact: 'Kapcsolattartó', email: 'E-mail', phone: 'Telefon' }],
    },
  ],
  contact: ['Kapcsolat', { person: 'Kapcsolattartó', directions: 'Útvonaltervezés' }],
  notFound: [
    '404 oldal',
    {
      title: 'Böngésző címsor',
      eyebrow: 'Felcím',
      heading: 'Cím — *csillagok közé* írt rész kiemelve',
      text: 'Szöveg',
      primary: ['Fő gomb', { label: 'Felirat', href: 'Cím (link)' }],
      secondary: ['Másodlagos gomb', { label: 'Felirat', href: 'Cím (link)' }],
    },
  ],
} as const satisfies UiSpec;

/** The account pages (belépés, regisztráció, /fiokom…) and the checkout. */
const ACCOUNT = {
  nav: [
    'Fiók menü',
    {
      eyebrow: 'Felcím a belépési oldalakon',
      myAccount: 'Felcím a fiók oldalain',
      label: 'Fiók menü (felolvasott)',
      overview: 'Áttekintés',
      rooms: 'Teremfoglalás',
      invoices: 'Számláim',
      profile: 'Adataim',
      admin: 'Admin felület',
      logout: 'Kilépés',
    },
  ],
  login: [
    'Belépés',
    {
      title: 'Böngésző címsor',
      heading: 'Cím',
      intro: 'Bevezető — <link>…</link> = a regisztráció linkje',
      linkInvalid: 'Hibás vagy lejárt belépési link',
      passwordHeading: 'Jelszavas belépés: cím',
      submit: 'Belépés gomb',
      forgot: 'Elfelejtett jelszó link',
      linkHeading: 'Belépési link: cím',
      linkIntro: { long: 'Belépési link: bevezető' },
      sendLink: 'Belépési link küldése gomb',
      sentHeading: 'Link elküldve: cím',
      sentIntro: { long: 'Link elküldve: a kód' },
      code: 'Belépési kód (mező)',
      codeSubmit: 'Belépés a kóddal gomb',
      toPassword: 'Vissza a jelszavas belépéshez',
      confirmHeading: 'Link megnyitva: cím',
      confirmAs: 'Link megnyitva: kié — <b>{email}</b> = e-mail-cím',
      notYou: 'Link megnyitva: nem te kérted?',
    },
  ],
  register: [
    'Regisztráció',
    {
      title: 'Böngésző címsor',
      heading: 'Cím',
      intro: { long: 'Bevezető' },
      passwordHint: 'Jelszó hossza — {min} = legalább',
      submit: 'Regisztrálok gomb',
      haveAccount: 'Van már fiókod? — <link>…</link> = a belépés linkje',
      notArrived: 'Elküldés után: nem jött meg a levél?',
    },
  ],
  password: [
    'Jelszó',
    {
      forgotTitle: 'Elfelejtett jelszó: böngésző címsor',
      forgotHeading: 'Elfelejtett jelszó: cím',
      forgotIntro: { long: 'Elfelejtett jelszó: bevezető' },
      send: 'Visszaállító link küldése gomb',
      back: 'Vissza a belépéshez link',
      resetTitle: 'Új jelszó: böngésző címsor',
      resetHeading: 'Új jelszó: cím',
      resetIntro: 'Új jelszó: bevezető',
      missing: 'Új jelszó: hiányzó kód',
      newLink: 'Új link kérése gomb',
      new: 'Új jelszó (mező)',
      confirm: 'Új jelszó még egyszer (mező)',
      submit: 'Jelszó mentése gomb',
    },
  ],
  verify: [
    'E-mail-cím megerősítése',
    {
      title: 'Böngésző címsor',
      heading: 'Cím',
      headingDone: 'Cím: megerősítve',
      done: 'Megerősítve',
      invalid: { long: 'Hibás link' },
      login: 'Belépés gomb',
    },
  ],
  overview: [
    'Fiókom: áttekintés',
    {
      title: 'Böngésző címsor',
      greeting: 'Üdvözlés — {name} = keresztnév',
      empty: { long: 'Ha nincs semmije' },
      emptyRooms: 'Ha nincs semmije: terem — <link>…</link> = a Teremfoglalás fül',
      emptyProfile: 'Ha nincs semmije: adatok — <link>…</link> = az Adataim fül',
      upcoming: 'Közelgő alkalmak cím',
      noUpcoming: 'Nincs közelgő alkalom',
      courses: 'Kurzusaim cím',
      links: 'Linkek cím',
      sent: 'Szakmai jelentkezés állapota',
      waiting: 'Kezdő jelentkezés állapota',
      interview: 'Szakmai: interjúra hívva (állapot)',
      withdraw: 'Szakmai: visszavonás gomb',
      pendingProfessional: { long: 'Szakmai jelentkezés: szöveg' },
      pendingBeginner: { long: 'Kezdő jelentkezés: szöveg' },
    },
  ],
  upcoming: [
    'Fiókom: közelgő alkalmak',
    {
      today: 'Ma',
      tomorrow: 'Holnap',
      bookedBy: 'Ki foglalta — {name} = név',
      noPlace: 'Nincs helyszín',
      cancelled: 'Elmarad (címke)',
      cancelledKind: 'Elmarad (sorban) — {kind} = fajta',
      practice: 'Gyakorlás lemondásakor — {title} = mi',
      tickets: 'Jegyek link',
      noRefund: { long: 'Nyitott Műhely lemondása előtt' },
      kinds: [
        'Fajták',
        {
          course: 'Óra',
          rehearsal: 'Próba',
          show: 'Előadás',
          exam: 'Vizsga',
          workshop: 'Nyitott Műhely',
          practice: 'Gyakorlás',
          other: 'Egyéb',
        },
      ],
    },
  ],
  actions: [
    'Fiókom: lemondás, áthelyezés',
    {
      move: 'Áthelyezés gomb',
      cancel: 'Lemondás gomb',
      moveHeading: 'Áthelyezés: cím',
      cancelHeading: 'Lemondás: cím',
      withdrawHeading: 'Visszavonás: cím',
      newDate: 'Új időpont (felolvasott)',
      chooseDate: 'Nincs kiválasztva időpont',
      failed: 'Hiba (ha a szerver nem mondja meg)',
      moveSubmit: 'Áthelyezés: megerősítés gomb',
      cancelSubmit: 'Lemondás: megerősítés gomb',
      withdrawSubmit: 'Visszavonás: megerősítés gomb',
      keep: 'Teremfoglalás: megtartom gomb',
    },
  ],
  rooms: [
    'Fiókom: teremfoglalás',
    {
      title: 'Böngésző címsor és cím',
      notAllowed: { long: 'Ha nincs engedélye' },
      rules: {
        long: 'A szabályok — {rules} = a lenti feltételek vesszővel, {cancel} = a lemondás határideje',
      },
      ruleMax: 'Feltétel: hossz — {hours} = óra',
      ruleHorizon: 'Feltétel: előre — {days} = nap',
      ruleSlot: 'Feltétel: egységek — {minutes} = perc',
      ruleHours: 'Feltétel: napi időszak — {from}, {to} = óra',
      ruleQuota: 'Feltétel: heti keret — {hours} = óra',
      cancelBefore: 'Lemondás határideje — {hours} = óra',
      cancelUntilStart: 'Lemondás határideje: a kezdésig',
      booked: 'Foglalás után',
      cancelled: 'Lemondás után',
      own: 'Saját foglalás (a naptárban)',
      unavailable: 'A naptár nem érhető el',
      failed: 'A naptár nem töltődött be',
      mine: 'Közelgő foglalásaim cím',
      none: 'Nincs foglalása',
      day: 'Nap (mező)',
      start: 'Kezdés (mező)',
      end: 'Vége (mező)',
      room: 'Terem (mező)',
      for: 'Mihez gyakorolsz? (mező)',
      forNote: { long: 'Mihez gyakorolsz? (magyarázat)' },
      course: 'Kurzus (csoport a listában)',
      production: 'Előadás (csoport a listában)',
      note: 'Megjegyzés (mező)',
      noteHint: 'Megjegyzés (a felirat után)',
      submit: 'Foglalás gomb',
    },
  ],
  invoices: [
    'Fiókom: számláim',
    {
      title: 'Böngésző címsor és cím',
      bills: 'Havidíjak és részletek cím',
      reversed: 'Sztornózva',
      paid: 'Befizetve',
      due: 'Átutalással fizetendő',
      dueBy: 'Átutalással fizetendő, határidővel — {date} = nap',
      invoice: 'Számla — {number} = sorszám',
      storno: 'Sztornó számla — {number} = sorszám',
      pdf: 'PDF (a számla után)',
      soon: 'A számla hamarosan elkészül',
      online: 'Online fizetések cím',
      none: 'Nincs online fizetés',
      statusPaid: 'Állapot: fizetve',
      statusRefunded: 'Állapot: visszatérítve',
      statusPartial: 'Állapot: részben visszatérítve',
      footer: { long: 'Lábjegyzet' },
      unpaid: 'Befejezetlen fizetés cím',
      unpaidHeld: 'Befejezetlen fizetés: a helyét tartjuk',
      unpaidLapsed: 'Befejezetlen fizetés: lejárt',
      continue: 'Fizetés folytatása gomb',
    },
  ],
  profile: [
    'Fiókom: adataim',
    {
      title: 'Böngésző címsor és cím',
      emailNote: 'E-mail-cím alatt',
      billing: 'Számlázási adatok cím',
      billingIntro: 'Számlázási adatok: bevezető',
    },
  ],
  checkout: [
    'Fizetés',
    {
      title: 'Böngésző címsor',
      eyebrow: 'Felcím',
      workshop: 'Nyitott Műhely: cím',
      details: 'Adataid cím',
      loginAfter: 'A „Van már fiókod? Lépj be” után',
      billingIntro: 'Számlázási adatok: bevezető',
      payMode: 'Fizetés módja',
      installments: 'Részletek — {parts} = hány, {amount} = egy részlet',
      due: 'Fizetendő',
      dueNow: 'Most fizetendő (részletnél)',
      terms: 'ÁSZF elfogadása — <terms>…</terms> = az ÁSZF, <cancel>…</cancel> = a lemondási feltételek linkje',
      pay: 'Fizetés gomb — {amount} = összeg',
      secure: 'Biztonságos fizetés (a szolgáltató előtt)',
      paused: 'Ha az online fizetés ki van kapcsolva',
      pausedWorkshop: { long: 'Nyitott Műhely: ha az online fizetés ki van kapcsolva' },
      full: 'Nyitott Műhely: megtelt',
      closed: 'Nyitott Műhely: lezárult',
      otherDates: 'Nyitott Műhely: a többi időpont link',
      policyCancel: { long: 'Nyitott Műhely: lemondás — {hours} = óra' },
      policyCutoff: { long: 'Nyitott Műhely: elmarad — {hours} = óra, {min} = legalább hány fő' },
      notOnline: 'Kurzus: nem online fizetéssel',
      backToCourse: 'Kurzus: vissza link',
      pick: 'Kurzus: ezt választom gomb',
      otherGroup: 'Kurzus: másik csoport link',
      policyAdmit: { long: 'Kurzus: felvétel a fizetéssel' },
      policyInstallments: { long: 'Kurzus: részletfizetés' },
      freeOther: 'Kurzus: más időpont? (fizetés nélküli jelentkezés előtt)',
      freeNone: 'Kurzus: egyik sem jó? (fizetés nélküli jelentkezés előtt)',
      freeSignup: 'Kurzus: jelentkezés link',
      freeWithoutGroup: 'Kurzus: jelentkezés csoport nélkül link',
      freeNoneDetails: { long: 'Kurzus: csoport nélküli jelentkezés' },
    },
  ],
  order: [
    'Fizetés után',
    {
      title: 'Böngésző címsor és felcím',
      heading: 'Cím',
      paid: 'Sikeres fizetés cím',
      received: 'Befizetés megérkezett — {amount} = összeg',
      confirmation: 'Visszaigazolás e-mailben',
      processing: 'Feldolgozás cím',
      processingText: 'Feldolgozás szöveg',
      failed: 'Sikertelen fizetés cím',
      waiting: 'Fizetésre vár cím',
      noCharge: 'Pénzt nem vontunk le',
      lapsed: 'Lejárt a foglalás',
      holdUntil: 'Meddig tartjuk a helyet — {time} = idő',
      waitedOut: { long: 'Ha sokáig nem jön visszajelzés' },
      cancelled: 'Megszakítva cím',
      again: 'Újra jelentkezem link',
      refunded: 'Visszautalva cím',
      refundedText: 'Visszautalva szöveg',
    },
  ],
} as const satisfies UiSpec;

/** What the server answers (errors and notices): words the site shows, never sent as a dictionary. */
const MESSAGES = {
  accountErrors: [
    'Fiók',
    {
      tooMany: 'Túl sok kérés',
      missingLogin: 'Belépés: hiányzó adatok',
      failed: 'Váratlan hiba',
      unverified: { long: 'Belépés: nincs megerősítve' },
      locked: { long: 'Belépés: zárolt fiók' },
      wrongLogin: 'Belépés: hibás adatok',
      missingEmail: 'Hiányzó e-mail-cím',
      linkSent: { long: 'Belépési link elküldve' },
      badCode: 'Hibás belépési kód',
      registered: { long: 'Regisztráció után' },
      required: 'Regisztráció: hiányzó mezők',
      passwordShort: 'Rövid jelszó — {min} = legalább',
      privacy: 'Regisztráció: adatkezelés nincs elfogadva',
      emailTaken: 'Regisztráció: már van ilyen fiók',
      resetSent: { long: 'Visszaállító link elküldve' },
      mismatch: 'A két jelszó nem egyezik',
      resetInvalid: 'Hibás vagy lejárt visszaállító link',
      nameEmpty: 'Adatok: üres név',
      saveFailed: 'Mentés nem sikerült',
      saved: 'Mentés után',
      billingSaved: 'Számlázási adatok mentése után',
      loginAgain: 'Lejárt belépés',
    },
  ],
  signupErrors: [
    'Jelentkezés',
    {
      privacy: 'Adatkezelés nincs elfogadva (jelentkezés)',
      privacyShow: 'Adatkezelés nincs elfogadva (foglalás)',
      tooMany: 'Túl sok jelentkezés',
      tooManyShow: 'Túl sok foglalás',
      invalid: 'Hibás kérés',
      name: 'Hiányzó név',
      email: 'Hibás e-mail-cím',
      phone: 'Hiányzó telefonszám',
      motivation: 'Szakmai: rövid motiváció — {min} = legalább',
      payWorkshop: 'Nyitott Műhely: csak fizetéssel',
      payGroup: 'Kezdő: csak fizetéssel',
      payShow: 'Előadás: csak fizetéssel',
      noSession: 'Nincs ilyen alkalom',
      noCourse: 'Nincs ilyen kurzus',
      noGroup: 'Nincs ilyen csoport',
      noShow: 'Nincs ilyen előadás',
      wrongKind: 'Erre a kurzusra így nem lehet jelentkezni',
      courseClosed: 'Kurzus: most nem lehet jelentkezni',
      noApplication: 'Nincs ilyen jelentkezés',
    },
  ],
  signupRules: [
    'Jelentkezési szabályok',
    {
      sessionCancelled: 'Az alkalom elmarad',
      sessionFull: 'Az alkalom megtelt',
      sessionClosed: 'Az alkalomra már nem lehet jelentkezni',
      cancelDeadline: 'Lemondási határidő — {hours} = óra',
      sameSession: 'Áthelyezés ugyanarra',
      notMovable: 'Már nem helyezhető át',
      moveDeadline: 'Áthelyezési határidő — {hours} = óra',
      courseFull: 'A kurzus megtelt',
      courseNotYet: 'A kurzusra még nem nyílt meg a jelentkezés',
      courseClosed: 'A kurzusra most nem lehet jelentkezni',
      courseStarted: 'A kurzus elkezdődött (lemondás)',
      notWithdrawable: 'Szakmai: már nem vonható vissza',
      notCancellable: 'Már nem mondható le',
      showClosed: 'Előadás: lezárult',
      showFull: 'Előadás: elfogytak a jegyek',
      seatsRange: 'Előadás: jegyek száma — {max} = legfeljebb',
      seatsLeft: 'Előadás: kevés jegy — {count} = maradt',
      ticketNoCancel: { long: 'Előadás: a megvett jegy nem mondható le' },
      showStarted: 'Előadás: elkezdődött',
    },
  ],
  roomRules: [
    'Teremfoglalási szabályok',
    {
      notPermitted: { long: 'Nincs engedélye' },
      chooseRoom: 'Nincs terem kiválasztva',
      unknownRoom: 'Ismeretlen terem',
      roomInactive: 'A terem nem foglalható — {room} = terem',
      roomNotForStudents: 'A terem diákoknak nem foglalható — {room} = terem',
      endBeforeStart: 'A vége a kezdés előtt',
      slot: 'Egységek — {minutes} = perc, {example} = példa',
      maxHours: 'Túl hosszú — {hours} = óra',
      past: 'Múltbeli időpont',
      notice: 'Túl közeli — {hours} = óra',
      horizon: 'Túl távoli — {days} = nap, {day} = utolsó nap',
      hours: 'Napi időszakon kívül — {from}, {to} = óra',
      quota: 'Heti keret — {quota} = keret, {left} = maradt',
      oneLink: 'Csoport és előadás egyszerre',
      ownCourse: 'Nem a saját kurzusa',
      ownProduction: 'Nem a kurzusa előadása',
      started: 'Lemondás: már elkezdődött',
      cancelDeadline: 'Lemondás: határidő — {hours} = óra',
      invalidTime: 'Hibás időpont',
      noBooking: 'Nincs ilyen foglalás',
      taken: { long: 'Közben más foglalta — {rooms} = termek, {when} = mikor' },
    },
  ],
  checkoutErrors: [
    'Fizetés',
    {
      terms: 'ÁSZF nincs elfogadva',
      invalid: 'Hibás kérés',
      tooMany: 'Túl sok próbálkozás',
      chooseOption: 'Nincs fizetési mód kiválasztva',
      notThisWay: 'Kurzus: így nem lehet jelentkezni',
      showNotThisWay: 'Előadás: így nem lehet jegyet venni',
      holdGone: 'Lejárt foglalás',
      showSoldOut: 'Előadás: közben elfogyott',
      sessionFull: 'Nyitott Műhely: közben megtelt',
      groupFull: 'Kurzus: közben megtelt',
      orderClosed: 'A rendelés már le van zárva',
      noOrder: 'Nincs ilyen rendelés',
      startFailed: 'A fizetés indítása nem sikerült',
    },
  ],
  billingErrors: [
    'Számlázási adatok',
    {
      name: 'Hiányzó név',
      country: 'Hibás országkód',
      zip: 'Hiányzó irányítószám',
      city: 'Hiányzó város',
      address: 'Hiányzó cím',
    },
  ],
  invoiceErrors: [
    'Számla letöltése',
    { notFound: 'Nincs ilyen számla', forbidden: 'Nem az övé', unavailable: 'A PDF most nem érhető el' },
  ],
} as const satisfies UiSpec;

/**
 * The admin's tabs, and how the site sends them: `site` to every page's browser code, `account`
 * also on the account and checkout pages (AccountShell), `messages` never — only the server uses them.
 */
export const UI_TABS = [
  { key: 'site', label: 'Weboldal', spec: SITE },
  { key: 'account', label: 'Fiók és fizetés', spec: ACCOUNT },
  { key: 'messages', label: 'Üzenetek', spec: MESSAGES },
] as const satisfies readonly { key: string; label: string; spec: UiSpec }[];

export type UiTab = (typeof UI_TABS)[number]['key'];

type Strings<S> = { -readonly [K in keyof S]: S[K] extends readonly [string, infer G] ? Strings<G> : string };
type Specs = { site: typeof SITE; account: typeof ACCOUNT; messages: typeof MESSAGES };

/** The texts of one language, complete. */
export type UiStrings = Strings<typeof SITE & typeof ACCOUNT & typeof MESSAGES>;

/** One tab's groups of `ui` (what a page sends to its browser code). */
export function uiTab<T extends UiTab>(ui: UiStrings, tab: T): Strings<Specs[T]> {
  const spec = UI_TABS.find((t) => t.key === tab)?.spec ?? {};
  return Object.fromEntries(Object.keys(spec).map((g) => [g, ui[g as keyof UiStrings]])) as Strings<Specs[T]>;
}

/** Every text: its path ("common.close"), label and whether it is long. */
export type UiText = { path: string[]; label: string; long: boolean };
const leaves = (spec: UiSpec, path: string[] = []): UiText[] =>
  Object.entries(spec).flatMap(([key, v]): UiText[] =>
    typeof v === 'string'
      ? [{ path: [...path, key], label: v, long: false }]
      : 'long' in v
        ? [{ path: [...path, key], label: v.long, long: true }]
        : leaves(v[1], [...path, key]),
  );
export const UI_TEXTS: UiText[] = UI_TABS.flatMap((t) => leaves(t.spec));

type Tree = { [key: string]: string | Tree | undefined };
export const textAt = (tree: unknown, path: string[]): string | undefined => {
  const v = path.reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Tree)[k] : undefined), tree);
  return typeof v === 'string' ? v : undefined;
};
const setAt = (tree: Tree, path: string[], value: string) => {
  let o = tree;
  for (const k of path.slice(0, -1)) {
    o[k] ??= {};
    o = o[k] as Tree;
  }
  o[path.at(-1) as string] = value;
};

/**
 * The catalogue's texts from `stored` (one language's JSON), anything else dropped: blank or missing
 * ones from `fallback`, then the path itself ("common.close" shows on the page, not a crash).
 */
export function uiStrings(stored: unknown, fallback?: unknown): UiStrings {
  const tree: Tree = {};
  for (const { path } of UI_TEXTS)
    setAt(tree, path, textAt(stored, path)?.trim() || textAt(fallback, path)?.trim() || path.join('.'));
  return tree as unknown as UiStrings;
}

/** The texts a language has (blank ones left out) — what is saved. */
export function storedTexts(texts: unknown): Tree {
  const tree: Tree = {};
  for (const { path } of UI_TEXTS) {
    const v = textAt(texts, path)?.trim();
    if (v) setAt(tree, path, v);
  }
  return tree;
}
