import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center py-4",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-muted">
      <SliderPrimitive.Range className="absolute h-full bg-orange-400" />
    </SliderPrimitive.Track>
    
    {/* Interval markers */}
    <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
      {[0, 1, 2, 3, 4].map((step) => (
        <div 
          key={step}
          className="w-2 h-2 rounded-full bg-orange-400 border border-background"
          style={{ 
            left: `${(step / 4) * 100}%`,
            transform: 'translateX(-50%)'
          }}
        />
      ))}
    </div>
    
    <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-2 border-orange-400 bg-orange-400 ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative z-10" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
