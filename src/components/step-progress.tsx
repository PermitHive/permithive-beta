import React from 'react'
import { Card, CardContent } from "@/components/ui/card"

interface Step {
  label: string;
  value: string;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: string;
  onStepClick?: (step: string) => void;
}

export const StepProgress: React.FC<StepProgressProps> = ({ steps, currentStep, onStepClick }) => {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex justify-center gap-24">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center cursor-pointer group"
              onClick={() => onStepClick?.(step.value)}
            >
              <div 
                className={`
                  w-10 h-10 rounded-full 
                  flex items-center justify-center
                  transition-colors duration-200
                  ${step.value === currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
                  }
                `}
              >
                <span className="text-base font-medium">{index + 1}</span>
              </div>
              <span className={`
                text-sm mt-3 text-center
                transition-colors duration-200
                ${step.value === currentStep ? 'text-primary font-medium' : 'text-gray-500 group-hover:text-gray-700'}
              `}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

