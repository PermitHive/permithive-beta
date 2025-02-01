'use client'

import * as React from "react"
import { DialogProps } from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"

const Dialog = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 flex items-center justify-center",
      className
    )}
    {...props}
  />
))
Dialog.displayName = "Dialog"

const DialogContent = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-white rounded-lg shadow-lg p-6",
      className
    )}
    {...props}
  />
))
DialogContent.displayName = "DialogContent"

interface CustomDialogProps extends DialogProps {}

const CustomDialog = ({ children, ...props }: CustomDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        {children}
      </DialogContent>
    </Dialog>
  )
}

export { CustomDialog, Dialog, DialogContent }
