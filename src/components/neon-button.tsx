
"use client";

import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NeonButtonProps extends ButtonProps {
  neonColor: 'primary' | 'secondary';
  glowIntense?: boolean;
}

const NeonButton = React.forwardRef<HTMLButtonElement, NeonButtonProps>(
  ({ className, neonColor, children, glowIntense = false, disabled, ...props }, ref) => {
    const shadowIntensity = glowIntense ? '20px' : '10px';
    const hoverShadowIntensity = glowIntense ? '30px' : '15px';

    return (
      <Button
        ref={ref}
        className={cn(
          "font-headline text-2xl tracking-wider py-3 px-6",
          "border-2 rounded-lg",
          "transition-all duration-300 ease-in-out transform hover:scale-105",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none",
          !disabled && neonColor === 'primary' &&
            `border-primary text-foreground neon-text-primary shadow-[0_0_${shadowIntensity}_theme(colors.primary.DEFAULT)] 
             hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_10px_theme(colors.primary.DEFAULT),_0_0_${hoverShadowIntensity}_theme(colors.primary.DEFAULT)]`,
          !disabled && neonColor === 'secondary' &&
            `border-secondary text-foreground neon-text-secondary shadow-[0_0_${shadowIntensity}_theme(colors.secondary.DEFAULT)] 
             hover:bg-secondary hover:text-secondary-foreground hover:shadow-[0_0_10px_theme(colors.secondary.DEFAULT),_0_0_${hoverShadowIntensity}_theme(colors.secondary.DEFAULT)]`,
          disabled && "border-muted text-muted",
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </Button>
    );
  }
);
NeonButton.displayName = "NeonButton";

export default NeonButton;
