import Emph from '@/components/Emph';
import SiteLayout from '@/components/layouts/SiteLayout';
import Logo from '@/components/Logo';
import { ButtonLink, Eyebrow } from '@/components/ui';
import { getUi } from '@/lib/data';

/**
 * 404 for unknown paths and missing productions, in the regular site frame. Its texts are in the
 * UI dictionary (Felületi szövegek → 404 oldal); the visual echoes the home hero (logo + rings).
 */
export default async function NotFound() {
  const { notFound: t } = await getUi();
  return (
    <SiteLayout>
      <title>{t.title}</title>
      <section className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 pb-16 pt-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16 lg:px-20 lg:pb-[120px] lg:pt-20">
        <div className="order-2 flex flex-col gap-6 lg:order-1 lg:gap-8">
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h1 className="text-balance font-display text-[54px] leading-[0.98] lg:text-[96px] lg:leading-[0.95]">
            <Emph text={t.heading} />
          </h1>
          <p className="max-w-[560px] text-[17px] leading-relaxed text-ink2 lg:text-xl lg:leading-[30px]">{t.text}</p>
          <div className="flex flex-col gap-3 sm:flex-row lg:gap-4">
            <ButtonLink link={t.primary} variant="primary" arrow />
            <ButtonLink link={t.secondary} variant="outline" />
          </div>
        </div>

        <div className="relative order-1 lg:order-2" aria-hidden="true">
          <div className="relative mx-auto aspect-square w-full max-w-[260px] lg:max-w-[440px]">
            <div className="pulse-ring" />
            <div className="pulse-ring" />
            <div className="pulse-ring" />
            <Logo animated title={null} className="absolute inset-[16%] h-[68%] w-[68%]" />
            <span className="absolute -bottom-2 right-0 rotate-[-6deg] rounded-full bg-deep px-5 py-2 font-display text-[40px] leading-none text-gold shadow-[0_18px_40px_-18px_rgba(11,58,63,0.6)] lg:px-7 lg:text-[64px]">
              404
            </span>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
