// components/ui/PageHeroTitle.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeroTitleProps {
   icon?: LucideIcon;
   titlePrefix: string | number;
   titleAccent?: string | number;
   iconColorClass?: string;
}

const PageHeroTitle: React.FC<PageHeroTitleProps> = ({
   icon: Icon,
   titlePrefix,
   titleAccent,
   iconColorClass = 'text-f1-red',
}) => (
   <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight text-f1-white uppercase flex flex-wrap items-center gap-2 sm:gap-3">
      {Icon && <Icon className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 ${iconColorClass}`} />}
      <span className="flex flex-wrap items-baseline gap-x-2">
         {titlePrefix}
         {titleAccent && <span className="gradient-text">{titleAccent}</span>}
      </span>
   </h1>
);

export default PageHeroTitle;