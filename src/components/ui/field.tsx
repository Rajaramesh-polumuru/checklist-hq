import * as React from "react"
import { Slot } from "@radix-ui/react-slot"


import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

/* -------------------------------------------------------------------------- */
/*                                 Field Root                                 */
/* -------------------------------------------------------------------------- */

const fieldBaseStyles = "flex flex-col gap-2"

const Field = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn(fieldBaseStyles, className)} {...props} />
))
Field.displayName = "Field"

/* -------------------------------------------------------------------------- */
/*                                Field Label                                 */
/* -------------------------------------------------------------------------- */

const FieldLabel = React.forwardRef<
    React.ElementRef<typeof Label>,
    React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => (
    <Label ref={ref} className={cn("text-foreground", className)} {...props} />
))
FieldLabel.displayName = "FieldLabel"

/* -------------------------------------------------------------------------- */
/*                                 Field Input                                */
/* -------------------------------------------------------------------------- */
// Wrapper to handle positioning if needed, or just a slot?
// Roadmap implies composition. Field.Input might just be a Slot if we want to support any input.
// But mostly it's just for structure.

const FieldInput = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ asChild, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "div"
    return (
        <Comp
            ref={ref}
            className={cn("relative", className)}
            {...props}
        />
    )
})
FieldInput.displayName = "FieldInput"

/* -------------------------------------------------------------------------- */
/*                                Field Error                                 */
/* -------------------------------------------------------------------------- */

const FieldError = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
    if (!children) return null

    return (
        <p
            ref={ref}
            className={cn("text-sm font-medium text-destructive animate-fade-in", className)}
            {...props}
        >
            {children}
        </p>
    )
})
FieldError.displayName = "FieldError"

/* -------------------------------------------------------------------------- */
/*                                Field Help                                  */
/* -------------------------------------------------------------------------- */

const FieldHelp = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
))
FieldHelp.displayName = "FieldHelp"

export { Field, FieldLabel, FieldInput, FieldError, FieldHelp }
