'use client';

import { useState } from 'react';
import { ChevronDownIcon } from '@/components/common/icons';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

/** 이용안내 페이지의 자주 묻는 질문 아코디언 */
export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-divider overflow-hidden rounded-2xl border border-divider">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-semibold text-text-primary transition-colors hover:bg-gray-50"
            >
              {item.question}
              <ChevronDownIcon
                size={16}
                className={`shrink-0 text-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isOpen && (
              <div className="animate-fade-in bg-gray-50 px-4 pb-4 pt-1 text-sm text-text-secondary">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
