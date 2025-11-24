/**
 * Client Component to load and initialize VexFlow
 * Uses dynamic import to load VexFlow from npm package
 */

'use client';

import { useEffect } from 'react';

export function VexFlowLoader() {
  useEffect(() => {
    // Dynamically import VexFlow
    import('vexflow').then((VexFlowModule) => {
      // VexFlow 4.2.2 exports structure
      // Try different ways to access it
      let VF: any = null;
      
      // Check if it's the Flow namespace directly
      if ((VexFlowModule as any).Flow) {
        VF = (VexFlowModule as any).Flow;
      }
      // Check default export
      else if ((VexFlowModule as any).default) {
        const defaultExport = (VexFlowModule as any).default;
        if (defaultExport.Flow) {
          VF = defaultExport.Flow;
        } else {
          VF = defaultExport;
        }
      }
      // Try the whole module
      else {
        VF = VexFlowModule;
      }
      
      if (VF && VF.Renderer && VF.Stave) {
        (window as any).VF = VF;
        (window as any).Vex = { Flow: VF };
        // Trigger a custom event to notify that VexFlow is ready
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('vexflow-loaded'));
        }
      } else {
        console.error('[VexFlowLoader] VexFlow loaded but structure is incorrect:', {
          VF: !!VF,
          hasRenderer: !!(VF && VF.Renderer),
          hasStave: !!(VF && VF.Stave),
          moduleKeys: Object.keys(VexFlowModule),
        });
      }
    }).catch((error) => {
      console.error('[VexFlowLoader] Failed to load VexFlow from npm package:', error);
    });
  }, []);

  return null; // This component doesn't render anything
}

