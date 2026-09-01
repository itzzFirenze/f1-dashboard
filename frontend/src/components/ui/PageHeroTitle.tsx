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
   <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight text-f1-white uppercase">
      {Icon && (
         <Icon
            className={`inline-block w-7 h-7 sm:w-8 sm:h-8 mr-2 sm:mr-3 mb-1 align-middle shrink-0 ${iconColorClass}`}
         />
      )}
      <span className="align-middle">
         {titlePrefix}
         {titleAccent && ' '}
         {titleAccent && <span className="gradient-text">{titleAccent}</span>}
      </span>
   </h1>
);

export default PageHeroTitle;