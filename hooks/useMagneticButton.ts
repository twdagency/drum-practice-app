import { useEffect, useRef } from 'react';

export function useMagneticButton(strength: number = 0.3) {
  const buttonRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        if (button) {
          button.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
        }
      });
    };

    const handleMouseLeave = () => {
      if (!button) return;
      cancelAnimationFrame(animationFrameId);
      button.style.transform = 'translate(0px, 0px)';
    };

    button.addEventListener('mousemove', handleMouseMove);
    button.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      button.removeEventListener('mousemove', handleMouseMove);
      button.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
      if (button) {
        button.style.transform = '';
      }
    };
  }, [strength]);

  return buttonRef;
}




