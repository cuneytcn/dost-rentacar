import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { Faq } from '@/payload-types'

import { SiteRichText } from './site-rich-text'

export function FaqList({ faqs, tokens }: { faqs: Faq[]; tokens: Record<string, string> }) {
  return (
    <Accordion type="single" collapsible className="divide-y rounded-2xl border bg-white">
      {faqs.map((faq) => (
        <AccordionItem key={faq.id} value={String(faq.id)} className="border-b-0 px-5 sm:px-6">
          <AccordionTrigger className="text-brand-950 py-5 text-base font-bold hover:no-underline">{faq.question}</AccordionTrigger>
          <AccordionContent className="prose-site text-muted-foreground pb-5 text-[0.95rem]">
            <SiteRichText data={faq.answer} tokens={tokens} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
