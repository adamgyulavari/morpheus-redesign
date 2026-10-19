import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

// The e-mails' texts move to the admin (Beállítások → E-mailek, payload/email-texts.ts): the table,
// then their first version — the wording the code had (a free Nyitott Műhely sign-up now says the
// fee is paid on site). The six old intro overrides (Jelentkezési beállítások) go; none was set.
const TEXTS = {
  "signup": {
    "signupWorkshop": {
      "subject": "Jelentkezés: {cim}",
      "heading": "Megkaptuk a jelentkezésed",
      "text": "Köszönjük a jelentkezésed, rögzítettük a helyed. A részvételi díjat a helyszínen fizeted.\n\nAz alkalom legalább {minimum} jelentkezővel indul; ez {dontes}-kor dől el, és e-mailben értesítünk róla.\n\nHa mégsem tudsz jönni, a fiókodban mondhatod le, legkésőbb {lemondas} órával a kezdés előtt.",
      "preheader": "{cim} · {mikor}",
      "button": "Fiókom"
    },
    "signupBeginner": {
      "subject": "Jelentkezés: {cim}",
      "heading": "Megkaptuk a jelentkezésed",
      "text": "Köszönjük a jelentkezésed, rögzítettük a helyed.\n\nA felvételről és a fizetésről hamarosan írunk.",
      "preheader": "{cim} · {mikor}",
      "button": "Fiókom"
    },
    "signupBeginnerNoGroup": {
      "subject": "Jelentkezés: {cim}",
      "heading": "Megkaptuk a jelentkezésed",
      "text": "Köszönjük a jelentkezésed! Még nem soroltunk csoportba: hamarosan jelentkezünk, melyik csoportban kezdhetsz.",
      "preheader": "{cim}",
      "button": "Fiókom"
    },
    "applicationReceived": {
      "subject": "Megkaptuk a jelentkezésed",
      "heading": "Megkaptuk a jelentkezésed",
      "text": "Köszönjük a jelentkezésed a szakmai kurzusra! Elolvassuk, és hamarosan jelentkezünk az interjú részleteivel.",
      "preheader": "Hamarosan jelentkezünk.",
      "button": "Fiókom"
    },
    "moved": {
      "subject": "Áthelyezve: {cim}, {mikor}",
      "heading": "Áthelyeztük a jelentkezésed",
      "text": "A jelentkezésed átkerült az új időpontra.",
      "preheader": "{cim} · {mikor}",
      "button": "Fiókom"
    },
    "cancelledBySelf": {
      "subject": "Lemondva: {cim}",
      "heading": "Lemondtad a jelentkezésed",
      "text": "Rögzítettük a lemondásod. Reméljük, legközelebb találkozunk!",
      "preheader": "{cim} · {mikor}",
      "button": "Fiókom"
    },
    "cancelledByStaff": {
      "subject": "Lemondva: {cim}",
      "heading": "Lemondtuk a jelentkezésed",
      "text": "A jelentkezésed lemondtuk. Ha kérdésed van, írj nekünk.",
      "preheader": "{cim} · {mikor}",
      "button": "Fiókom"
    },
    "workshopConfirmed": {
      "subject": "Biztosan indul: {cim}, {mikor}",
      "heading": "Biztosan indul!",
      "text": "Összegyűlt a szükséges létszám, az alkalom biztosan megvalósul. Várunk szeretettel!",
      "preheader": "Megvan a létszám, találkozunk!",
      "button": "Fiókom"
    },
    "workshopCancelled": {
      "subject": "Elmarad: {cim}, {mikor}",
      "heading": "Elmarad az alkalom",
      "text": "Sajnos erre az időpontra nem gyűlt össze a szükséges létszám, ezért az alkalom elmarad.",
      "preheader": "Nem gyűlt össze a létszám — válassz másik időpontot.",
      "button": "Fiókom",
      "nextDates": "A fiókodban egy kattintással átteheted a jelentkezésed egy másik időpontra:",
      "noNextDates": "Új időpontokat hamarosan meghirdetünk a weboldalon.",
      "cancelledLabel": "Elmarad",
      "nextLabel": "Új időpont"
    },
    "accepted": {
      "subject": "Felvételt nyertél: {cim}",
      "heading": "Üdv a csoportban!",
      "text": "Örömmel értesítünk, hogy felvettünk a kurzusra. A fiókodban megtalálod a csoport időpontjait és tudnivalóit.",
      "preheader": "Üdv a csoportban!",
      "button": "Belépés a fiókomba"
    },
    "staffNew": {
      "subject": "Új jelentkezés: {nev} — {cim}",
      "heading": "Új jelentkezés",
      "text": "{nev} jelentkezett ({fajta}).",
      "preheader": "{fajta} · {cim}",
      "button": "Megnyitás az adminban"
    },
    "staffCancelled": {
      "subject": "Lemondás: {nev} — {cim}, {mikor}",
      "heading": "Egy résztvevő lemondta",
      "text": "{nev} lemondta a jelentkezését.",
      "preheader": "{nev} — {cim}"
    },
    "staffMoved": {
      "subject": "Áthelyezés: {nev} — {cim}, {regi}",
      "heading": "Egy résztvevő időpontot váltott",
      "text": "{nev} áttette a jelentkezését: {mikor}.",
      "preheader": "{nev} — {cim}"
    }
  },
  "payment": {
    "paymentLink": {
      "subject": "Jelentkezésed fizetése: {cim}",
      "heading": "Már csak a fizetés van hátra",
      "text": "Megkaptuk a jelentkezésed; a helyed a fizetéssel lesz biztos. {hatarido}-ig tartjuk neked.\n\nHa a fizetési oldal bezárult vagy a fizetés megszakadt, ezen a linken folytathatod — később is, amíg van szabad hely. Ha már fizettél, a link a fizetés állapotát mutatja.",
      "preheader": "A helyedet {hatarido}-ig tartjuk.",
      "button": "Fizetés"
    },
    "orderPaid": {
      "subject": "Sikeres fizetés: {cim}",
      "heading": "Megkaptuk a fizetést",
      "text": "Köszönjük, a fizetés rendben megérkezett — a helyed biztos.\n\nA jelentkezésed a fiókodban követheted.",
      "preheader": "{cim} · {mikor}",
      "button": "Fiókom",
      "calendarNote": "A naptáradba a mellékelt fájllal veheted fel.",
      "waitingForGroup": "Amint indul a következő csoport, beosztunk, és e-mailben írunk."
    },
    "lateRefund": {
      "subject": "Visszautaltuk a befizetésed: {cim}",
      "heading": "Visszautaltuk a befizetésed",
      "text": "A fizetésed a foglalási idő lejárta után érkezett meg, és a helyet közben más foglalta el. Az összeget teljes egészében visszautaltuk; néhány munkanapon belül jelenik meg a számládon.\n\nElnézést a kellemetlenségért! A többi időpontot a weboldalon találod.",
      "preheader": "A hely időközben betelt.",
      "button": "Időpontok"
    },
    "staffPaid": {
      "subject": "Új fizetett jelentkezés: {nev} — {cim}",
      "heading": "Új fizetett jelentkezés",
      "text": "{nev} ({email}) jelentkezett és fizetett.",
      "preheader": "{nev}, {osszeg}",
      "button": "Jelentkezések"
    }
  },
  "rooms": {
    "bookingConfirmed": {
      "subject": "Teremfoglalás visszaigazolása",
      "heading": "Lefoglaltad a termet",
      "text": "A teremfoglalásod rögzítettük. A csatolt fájllal felveheted a naptáradba.",
      "preheader": "{mikor} · {hol}",
      "button": "Foglalásaim",
      "footnote": "Ha mégsem jössz, mondd le a foglalást a fiókodban, hogy más használhassa a termet."
    },
    "bookingCancelledBySelf": {
      "subject": "Teremfoglalás lemondva",
      "heading": "Lemondott teremfoglalás",
      "text": "Lemondtad a teremfoglalásodat. A terem újra szabad mások számára.",
      "preheader": "{mikor} · {hol}",
      "button": "Foglalásaim"
    },
    "bookingCancelledByStaff": {
      "subject": "Teremfoglalás lemondva",
      "heading": "Lemondott teremfoglalás",
      "text": "Sajnos le kellett mondanunk a teremfoglalásodat. Elnézést kérünk; kérjük, foglalj másik időpontot.",
      "preheader": "{mikor} · {hol}",
      "button": "Foglalásaim"
    },
    "bookingMoved": {
      "subject": "Teremfoglalás módosítva",
      "heading": "Módosult a teremfoglalásod",
      "text": "A munkatársaink módosították a teremfoglalásodat. Az új adatok:",
      "preheader": "{mikor} · {hol}",
      "button": "Foglalásaim"
    },
    "sessionCancelled": {
      "subject": "Elmarad: {cim}",
      "heading": "Elmarad egy alkalom",
      "text": "Az alábbi alkalom elmarad: {cim}.",
      "preheader": "{cim} — {mikor}",
      "button": "Fiókom"
    },
    "sessionReinstated": {
      "subject": "Mégis lesz: {cim}",
      "heading": "Mégis lesz az alkalom",
      "text": "Az elmaradtnak jelzett alkalom mégis megtartásra kerül: {cim}.",
      "preheader": "{cim}: {mikor} · {hol}",
      "button": "Fiókom"
    },
    "sessionChanged": {
      "subject": "Változás: {cim}",
      "heading": "Változott egy alkalom",
      "text": "Változott a(z) {cim} alkalom {valtozas}.",
      "preheader": "{cim}: {mikor} · {hol}",
      "button": "Fiókom",
      "changedTime": "ideje",
      "changedPlace": "helyszíne",
      "changedBoth": "ideje és helyszíne"
    }
  },
  "account": {
    "verifyEmail": {
      "subject": "Erősítsd meg az e-mail-címed",
      "heading": "Erősítsd meg az e-mail-címed",
      "text": "Köszönjük, hogy regisztráltál a Morpheus Színműhely oldalán. A fiókod használatához erősítsd meg az e-mail-címed az alábbi gombbal.",
      "preheader": "Egy kattintás, és kész a Morpheus-fiókod.",
      "button": "E-mail-cím megerősítése",
      "footnote": "Ha nem te regisztráltál, nyugodtan hagyd figyelmen kívül ezt a levelet."
    },
    "resetPassword": {
      "subject": "Új jelszó beállítása",
      "heading": "Új jelszó beállítása",
      "text": "Valaki (remélhetőleg te) új jelszót kért a Morpheus-fiókodhoz. Az alábbi gombbal állíthatod be.",
      "preheader": "Állíts be új jelszót a Morpheus-fiókodhoz.",
      "button": "Új jelszó beállítása",
      "footnote": "A link egy órán át érvényes. Ha nem te kérted, hagyd figyelmen kívül ezt a levelet: a jelszavad nem változik."
    },
    "magicLink": {
      "subject": "Belépési link",
      "heading": "Belépés jelszó nélkül",
      "text": "Az alábbi gombbal jelszó nélkül beléphetsz a Morpheus-fiókodba.",
      "preheader": "Belépési kódod: {kod}",
      "button": "Belépés",
      "codeIntro": "Ha a belépést egy másik eszközön kérted, ott ezt a kódot írd be:",
      "footnote": "A link és a kód 15 percig érvényes, és csak egyszer használható. Ha nem te kérted, hagyd figyelmen kívül ezt a levelet."
    }
  },
  "common": {
    "greeting": "Kedves {keresztnev}!",
    "greetingNoName": "Kedves Jelentkezőnk!",
    "accountCreated": "Fiókod elkészült — a lenti gombbal belépve itt követheted a jelentkezésed.",
    "accountExisting": "A jelentkezésed a fiókodban követheted.",
    "myAccountButton": "Fiókom",
    "loginLinkNote": "A gomb egy hétig belépteti a fiókodba. Később a belépés oldalon kérhetsz új belépési linket.",
    "buttonHelp": "Ha a gomb nem működik, másold be ezt a címet a böngésződbe:",
    "footer": "Ezt a levelet a Morpheus Színműhely rendszere küldte automatikusan, kérjük, ne válaszolj rá.",
    "labelWhat": "Mire",
    "labelWhen": "Mikor",
    "labelWhere": "Hol",
    "labelPrice": "Ár",
    "labelPaid": "Fizetve",
    "labelDue": "Fizetendő",
    "labelRefunded": "Visszautalva",
    "labelPayment": "Fizetés",
    "labelName": "Név",
    "labelEmail": "E-mail",
    "labelPhone": "Telefon",
    "labelMessage": "Üzenet",
    "labelCount": "Létszám",
    "labelFor": "Mihez",
    "labelNote": "Megjegyzés",
    "labelReason": "Ok",
    "placePending": "Helyszín egyeztetés alatt"
  }
};

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "email_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"signup_signup_workshop_subject" varchar NOT NULL,
  	"signup_signup_workshop_preheader" varchar,
  	"signup_signup_workshop_heading" varchar NOT NULL,
  	"signup_signup_workshop_text" varchar NOT NULL,
  	"signup_signup_workshop_button" varchar NOT NULL,
  	"signup_signup_beginner_subject" varchar NOT NULL,
  	"signup_signup_beginner_preheader" varchar,
  	"signup_signup_beginner_heading" varchar NOT NULL,
  	"signup_signup_beginner_text" varchar NOT NULL,
  	"signup_signup_beginner_button" varchar NOT NULL,
  	"signup_signup_beginner_no_group_subject" varchar NOT NULL,
  	"signup_signup_beginner_no_group_preheader" varchar,
  	"signup_signup_beginner_no_group_heading" varchar NOT NULL,
  	"signup_signup_beginner_no_group_text" varchar NOT NULL,
  	"signup_signup_beginner_no_group_button" varchar NOT NULL,
  	"signup_application_received_subject" varchar NOT NULL,
  	"signup_application_received_preheader" varchar,
  	"signup_application_received_heading" varchar NOT NULL,
  	"signup_application_received_text" varchar NOT NULL,
  	"signup_application_received_button" varchar NOT NULL,
  	"signup_moved_subject" varchar NOT NULL,
  	"signup_moved_preheader" varchar,
  	"signup_moved_heading" varchar NOT NULL,
  	"signup_moved_text" varchar NOT NULL,
  	"signup_moved_button" varchar NOT NULL,
  	"signup_cancelled_by_self_subject" varchar NOT NULL,
  	"signup_cancelled_by_self_preheader" varchar,
  	"signup_cancelled_by_self_heading" varchar NOT NULL,
  	"signup_cancelled_by_self_text" varchar NOT NULL,
  	"signup_cancelled_by_self_button" varchar NOT NULL,
  	"signup_cancelled_by_staff_subject" varchar NOT NULL,
  	"signup_cancelled_by_staff_preheader" varchar,
  	"signup_cancelled_by_staff_heading" varchar NOT NULL,
  	"signup_cancelled_by_staff_text" varchar NOT NULL,
  	"signup_cancelled_by_staff_button" varchar NOT NULL,
  	"signup_workshop_confirmed_subject" varchar NOT NULL,
  	"signup_workshop_confirmed_preheader" varchar,
  	"signup_workshop_confirmed_heading" varchar NOT NULL,
  	"signup_workshop_confirmed_text" varchar NOT NULL,
  	"signup_workshop_confirmed_button" varchar NOT NULL,
  	"signup_workshop_cancelled_subject" varchar NOT NULL,
  	"signup_workshop_cancelled_preheader" varchar,
  	"signup_workshop_cancelled_heading" varchar NOT NULL,
  	"signup_workshop_cancelled_text" varchar NOT NULL,
  	"signup_workshop_cancelled_button" varchar NOT NULL,
  	"signup_workshop_cancelled_next_dates" varchar,
  	"signup_workshop_cancelled_no_next_dates" varchar,
  	"signup_workshop_cancelled_cancelled_label" varchar,
  	"signup_workshop_cancelled_next_label" varchar,
  	"signup_accepted_subject" varchar NOT NULL,
  	"signup_accepted_preheader" varchar,
  	"signup_accepted_heading" varchar NOT NULL,
  	"signup_accepted_text" varchar NOT NULL,
  	"signup_accepted_button" varchar NOT NULL,
  	"signup_staff_new_subject" varchar NOT NULL,
  	"signup_staff_new_preheader" varchar,
  	"signup_staff_new_heading" varchar NOT NULL,
  	"signup_staff_new_text" varchar NOT NULL,
  	"signup_staff_new_button" varchar NOT NULL,
  	"signup_staff_cancelled_subject" varchar NOT NULL,
  	"signup_staff_cancelled_preheader" varchar,
  	"signup_staff_cancelled_heading" varchar NOT NULL,
  	"signup_staff_cancelled_text" varchar NOT NULL,
  	"signup_staff_moved_subject" varchar NOT NULL,
  	"signup_staff_moved_preheader" varchar,
  	"signup_staff_moved_heading" varchar NOT NULL,
  	"signup_staff_moved_text" varchar NOT NULL,
  	"payment_payment_link_subject" varchar NOT NULL,
  	"payment_payment_link_preheader" varchar,
  	"payment_payment_link_heading" varchar NOT NULL,
  	"payment_payment_link_text" varchar NOT NULL,
  	"payment_payment_link_button" varchar NOT NULL,
  	"payment_order_paid_subject" varchar NOT NULL,
  	"payment_order_paid_preheader" varchar,
  	"payment_order_paid_heading" varchar NOT NULL,
  	"payment_order_paid_text" varchar NOT NULL,
  	"payment_order_paid_button" varchar NOT NULL,
  	"payment_order_paid_calendar_note" varchar,
  	"payment_order_paid_waiting_for_group" varchar,
  	"payment_late_refund_subject" varchar NOT NULL,
  	"payment_late_refund_preheader" varchar,
  	"payment_late_refund_heading" varchar NOT NULL,
  	"payment_late_refund_text" varchar NOT NULL,
  	"payment_late_refund_button" varchar NOT NULL,
  	"payment_staff_paid_subject" varchar NOT NULL,
  	"payment_staff_paid_preheader" varchar,
  	"payment_staff_paid_heading" varchar NOT NULL,
  	"payment_staff_paid_text" varchar NOT NULL,
  	"payment_staff_paid_button" varchar NOT NULL,
  	"rooms_booking_confirmed_subject" varchar NOT NULL,
  	"rooms_booking_confirmed_preheader" varchar,
  	"rooms_booking_confirmed_heading" varchar NOT NULL,
  	"rooms_booking_confirmed_text" varchar NOT NULL,
  	"rooms_booking_confirmed_button" varchar NOT NULL,
  	"rooms_booking_confirmed_footnote" varchar,
  	"rooms_booking_cancelled_by_self_subject" varchar NOT NULL,
  	"rooms_booking_cancelled_by_self_preheader" varchar,
  	"rooms_booking_cancelled_by_self_heading" varchar NOT NULL,
  	"rooms_booking_cancelled_by_self_text" varchar NOT NULL,
  	"rooms_booking_cancelled_by_self_button" varchar NOT NULL,
  	"rooms_booking_cancelled_by_staff_subject" varchar NOT NULL,
  	"rooms_booking_cancelled_by_staff_preheader" varchar,
  	"rooms_booking_cancelled_by_staff_heading" varchar NOT NULL,
  	"rooms_booking_cancelled_by_staff_text" varchar NOT NULL,
  	"rooms_booking_cancelled_by_staff_button" varchar NOT NULL,
  	"rooms_booking_moved_subject" varchar NOT NULL,
  	"rooms_booking_moved_preheader" varchar,
  	"rooms_booking_moved_heading" varchar NOT NULL,
  	"rooms_booking_moved_text" varchar NOT NULL,
  	"rooms_booking_moved_button" varchar NOT NULL,
  	"rooms_session_cancelled_subject" varchar NOT NULL,
  	"rooms_session_cancelled_preheader" varchar,
  	"rooms_session_cancelled_heading" varchar NOT NULL,
  	"rooms_session_cancelled_text" varchar NOT NULL,
  	"rooms_session_cancelled_button" varchar NOT NULL,
  	"rooms_session_reinstated_subject" varchar NOT NULL,
  	"rooms_session_reinstated_preheader" varchar,
  	"rooms_session_reinstated_heading" varchar NOT NULL,
  	"rooms_session_reinstated_text" varchar NOT NULL,
  	"rooms_session_reinstated_button" varchar NOT NULL,
  	"rooms_session_changed_subject" varchar NOT NULL,
  	"rooms_session_changed_preheader" varchar,
  	"rooms_session_changed_heading" varchar NOT NULL,
  	"rooms_session_changed_text" varchar NOT NULL,
  	"rooms_session_changed_button" varchar NOT NULL,
  	"rooms_session_changed_changed_time" varchar,
  	"rooms_session_changed_changed_place" varchar,
  	"rooms_session_changed_changed_both" varchar,
  	"account_verify_email_subject" varchar NOT NULL,
  	"account_verify_email_preheader" varchar,
  	"account_verify_email_heading" varchar NOT NULL,
  	"account_verify_email_text" varchar NOT NULL,
  	"account_verify_email_button" varchar NOT NULL,
  	"account_verify_email_footnote" varchar,
  	"account_reset_password_subject" varchar NOT NULL,
  	"account_reset_password_preheader" varchar,
  	"account_reset_password_heading" varchar NOT NULL,
  	"account_reset_password_text" varchar NOT NULL,
  	"account_reset_password_button" varchar NOT NULL,
  	"account_reset_password_footnote" varchar,
  	"account_magic_link_subject" varchar NOT NULL,
  	"account_magic_link_preheader" varchar,
  	"account_magic_link_heading" varchar NOT NULL,
  	"account_magic_link_text" varchar NOT NULL,
  	"account_magic_link_button" varchar NOT NULL,
  	"account_magic_link_footnote" varchar,
  	"account_magic_link_code_intro" varchar,
  	"common_greeting" varchar NOT NULL,
  	"common_greeting_no_name" varchar NOT NULL,
  	"common_account_created" varchar NOT NULL,
  	"common_account_existing" varchar NOT NULL,
  	"common_my_account_button" varchar NOT NULL,
  	"common_login_link_note" varchar NOT NULL,
  	"common_button_help" varchar NOT NULL,
  	"common_footer" varchar NOT NULL,
  	"common_label_what" varchar NOT NULL,
  	"common_label_when" varchar NOT NULL,
  	"common_label_where" varchar NOT NULL,
  	"common_label_price" varchar NOT NULL,
  	"common_label_paid" varchar NOT NULL,
  	"common_label_due" varchar NOT NULL,
  	"common_label_refunded" varchar NOT NULL,
  	"common_label_payment" varchar NOT NULL,
  	"common_label_name" varchar NOT NULL,
  	"common_label_email" varchar NOT NULL,
  	"common_label_phone" varchar NOT NULL,
  	"common_label_message" varchar NOT NULL,
  	"common_label_count" varchar NOT NULL,
  	"common_label_for" varchar NOT NULL,
  	"common_label_note" varchar NOT NULL,
  	"common_label_reason" varchar NOT NULL,
  	"common_place_pending" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "application_settings" DROP COLUMN "texts_signup_received";
  ALTER TABLE "application_settings" DROP COLUMN "texts_application_received";
  ALTER TABLE "application_settings" DROP COLUMN "texts_confirmed";
  ALTER TABLE "application_settings" DROP COLUMN "texts_cancelled_minimum";
  ALTER TABLE "application_settings" DROP COLUMN "texts_cancellation";
  ALTER TABLE "application_settings" DROP COLUMN "texts_accepted";`);
  await payload.updateGlobal({ slug: 'emailTexts', data: TEXTS as never, req });
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "email_texts" CASCADE;
  ALTER TABLE "application_settings" ADD COLUMN "texts_signup_received" varchar;
  ALTER TABLE "application_settings" ADD COLUMN "texts_application_received" varchar;
  ALTER TABLE "application_settings" ADD COLUMN "texts_confirmed" varchar;
  ALTER TABLE "application_settings" ADD COLUMN "texts_cancelled_minimum" varchar;
  ALTER TABLE "application_settings" ADD COLUMN "texts_cancellation" varchar;
  ALTER TABLE "application_settings" ADD COLUMN "texts_accepted" varchar;`);
}
