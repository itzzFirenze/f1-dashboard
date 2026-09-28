import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
   onClick?: () => void;
   label?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ onClick, label = 'Back' }) => {
   const navigate = useNavigate();

   return (
      <button
         onClick={onClick ?? (() => navigate(-1))}
         className="inline-flex items-center gap-2 text-f1-silver hover:text-f1-white transition-colors shrink-0 group w-fit"
      >
         <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
         <span className="text-xs font-mono uppercase tracking-widest">{label}</span>
      </button>
   );
};

export default BackButton;
