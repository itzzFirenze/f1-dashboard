import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
   children: ReactNode;
}
interface State {
   hasError: boolean;
   error: Error | null;
}

/** Error boundary catches rendering errors and shows a friendly fallback. */
class ErrorBoundary extends Component<Props, State> {
   constructor(props: Props) {
      super(props);
      this.state = { hasError: false, error: null };
   }

   static getDerivedStateFromError(error: Error): State {
      return { hasError: true, error };
   }

   render() {
      if (this.state.hasError) {
         return (
            <div className="flex items-center justify-center py-20 px-4">
               <div className="telemetry-card max-w-md w-full p-8 sm:p-10 text-center relative overflow-hidden dot-grid">
                  {/* Top accent bar, mirrors StatGaugeCard treatment */}
                  <div className="absolute top-0 inset-x-0 h-[2px] opacity-75 bg-gradient-to-r from-transparent via-f1-red to-transparent" />
                  <div className="absolute -top-16 -right-16 w-56 h-56 bg-f1-red/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10">
                     <div className="w-16 h-16 bg-f1-red/10 border border-f1-red/20 rounded-2xl flex items-center justify-center mb-5 mx-auto">
                        <AlertTriangle className="w-8 h-8 text-f1-red-light" />
                     </div>

                     <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white/[0.04] text-f1-silver/60 border border-white/[0.06] uppercase tracking-[0.2em]">
                        System Fault
                     </span>

                     <h2 className="text-xl sm:text-2xl font-display font-black text-f1-white uppercase tracking-tight mt-4 mb-2">
                        Something Went Wrong
                     </h2>
                     <p className="text-f1-silver/70 text-sm font-mono mb-7 max-w-sm mx-auto leading-relaxed">
                        {this.state.error?.message || 'An unexpected error occurred.'}
                     </p>

                     <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-f1-red rounded-xl text-white text-sm font-mono font-semibold uppercase tracking-wider
                             hover:bg-f1-red-dark transition-colors shadow-lg shadow-f1-red/20"
                     >
                        <RefreshCw className="w-4 h-4" />
                        Reload Page
                     </button>
                  </div>
               </div>
            </div>
         );
      }
      return this.props.children;
   }
}

export default ErrorBoundary;