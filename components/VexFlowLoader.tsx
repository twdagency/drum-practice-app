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
      console.log('VexFlow module loaded:', VexFlowModule);
      
      // VexFlow 4.2.2 exports structure
      // Try different ways to access it
      let VF: any = null;
      
      // Check if it's the Flow namespace directly
      if ((VexFlowModule as any).Flow) {
        VF = (VexFlowModule as any).Flow;
        console.log('Found VexFlow.Flow');
      }
      // Check default export
      else if ((VexFlowModule as any).default) {
        const defaultExport = (VexFlowModule as any).default;
        if (defaultExport.Flow) {
          VF = defaultExport.Flow;
          console.log('Found default.Flow');
        } else {
          VF = defaultExport;
          console.log('Using default export as VF');
        }
      }
      // Try the whole module
      else {
        VF = VexFlowModule;
        console.log('Using whole module as VF');
      }
      
      if (VF && VF.Renderer && VF.Stave) {
        (window as any).VF = VF;
        (window as any).Vex = { Flow: VF };
        console.log('VexFlow loaded from npm package and assigned to window.VF');
        console.log('VF has Renderer:', !!VF.Renderer, 'Stave:', !!VF.Stave);
      } else {
        console.error('VexFlow loaded but structure is incorrect:', {
          VF: !!VF,
          hasRenderer: !!(VF && VF.Renderer),
          hasStave: !!(VF && VF.Stave),
          moduleKeys: Object.keys(VexFlowModule),
        });
      }
    }).catch((error) => {
      console.error('Failed to load VexFlow from npm package:', error);
    });
  }, []);

  return null; // This component doesn't render anything
}

