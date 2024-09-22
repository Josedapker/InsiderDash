declare module '@radix-ui/react-dialog' {
    import * as React from 'react';
    import * as DialogPrimitive from '@radix-ui/react-dialog';

    export const Root: React.FC<React.ComponentProps<typeof DialogPrimitive.Root>>;
    export const Trigger: React.FC<React.ComponentProps<typeof DialogPrimitive.Trigger>>;
    export const Overlay: React.ForwardRefExoticComponent<
        React.ComponentProps<typeof DialogPrimitive.Overlay> & React.RefAttributes<HTMLDivElement>
    >;
    export const Content: React.ForwardRefExoticComponent<
        React.ComponentProps<typeof DialogPrimitive.Content> & React.RefAttributes<HTMLDivElement>
    >;
    export const Title: React.FC<React.ComponentProps<typeof DialogPrimitive.Title>>;
    export const Description: React.FC<React.ComponentProps<typeof DialogPrimitive.Description>>;
    export const Close: React.FC<React.ComponentProps<typeof DialogPrimitive.Close>>;
}