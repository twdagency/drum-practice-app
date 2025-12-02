'use client'

import { useEffect } from 'react'

const CLARITY_PROJECT_ID = 'ufadn9m6jo'

export function ClarityLoader() {
  useEffect(() => {
    // Only initialize on client side
    if (typeof window === 'undefined') return;

    // Check if Clarity is already initialized or script already exists
    if ((window as any).clarity || document.querySelector(`script[data-clarity-id="${CLARITY_PROJECT_ID}"]`)) {
      return;
    }

    // Use script tag method which is more reliable
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.setAttribute('data-clarity-id', CLARITY_PROJECT_ID);
    script.innerHTML = `
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
    `;
    
    try {
      document.head.appendChild(script);
    } catch (error) {
      console.debug('Failed to load Clarity script:', error);
    }
  }, [])

  return null
}

