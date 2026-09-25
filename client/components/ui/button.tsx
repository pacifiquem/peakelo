// AlignUI Button v0.0.0 — Peakelo restyle (ink border, offset shadow)

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

import type { PolymorphicComponentProps } from '@/utils/polymorphic';
import { recursiveCloneChildren } from '@/utils/recursive-clone-children';
import { tv, type VariantProps } from '@/utils/tv';

const BUTTON_ROOT_NAME = 'ButtonRoot';
const BUTTON_ICON_NAME = 'ButtonIcon';

export const buttonVariants = tv({
  slots: {
    root: [
      'group relative inline-flex cursor-pointer items-center justify-center whitespace-nowrap outline-none',
      'border-2 border-ink font-display font-bold',
      'transition duration-200 ease-out',
      'focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
      'disabled:cursor-not-allowed disabled:opacity-60',
    ],
    icon: ['flex size-5 shrink-0 items-center justify-center'],
  },
  variants: {
    variant: {
      primary: {},
      neutral: {},
      error: {},
    },
    mode: {
      filled: {},
      stroke: {},
      lighter: {},
      ghost: {
        root: 'border-transparent shadow-none',
      },
    },
    size: {
      medium: {
        root: 'h-10 gap-3 rounded-10 px-3.5 text-sm',
        icon: '-mx-1',
      },
      small: {
        root: 'h-9 gap-3 rounded-10 px-3 text-sm',
        icon: '-mx-1',
      },
      xsmall: {
        root: 'h-8 gap-2.5 rounded-10 px-2.5 text-sm',
        icon: '-mx-1',
      },
      xxsmall: {
        root: 'h-7 gap-2.5 rounded-10 px-2 text-sm',
        icon: '-mx-1',
      },
    },
  },
  compoundVariants: [
    {
      variant: 'primary',
      mode: 'filled',
      class: {
        root: ['bg-primary-base text-text-white-0 shadow-regular-sm', 'hover:bg-primary-dark'],
      },
    },
    {
      variant: 'primary',
      mode: 'stroke',
      class: {
        root: ['bg-bg-white-0 text-primary-base shadow-regular-xs', 'hover:bg-primary-alpha-10'],
      },
    },
    {
      variant: 'primary',
      mode: 'lighter',
      class: {
        root: ['bg-primary-alpha-10 text-primary-base shadow-none', 'hover:bg-bg-white-0'],
      },
    },
    {
      variant: 'primary',
      mode: 'ghost',
      class: {
        root: ['bg-transparent text-primary-base', 'hover:bg-primary-alpha-10'],
      },
    },
    {
      variant: 'neutral',
      mode: 'filled',
      class: {
        root: ['bg-bg-strong-950 text-text-white-0 shadow-regular-sm', 'hover:bg-bg-surface-800'],
      },
    },
    {
      variant: 'neutral',
      mode: 'stroke',
      class: {
        root: ['bg-bg-white-0 text-text-strong-950 shadow-regular-xs', 'hover:bg-bg-weak-50'],
      },
    },
    {
      variant: 'neutral',
      mode: 'lighter',
      class: {
        root: ['bg-bg-weak-50 text-text-sub-600 shadow-none', 'hover:bg-bg-white-0'],
      },
    },
    {
      variant: 'neutral',
      mode: 'ghost',
      class: {
        root: ['bg-transparent text-text-sub-600', 'hover:bg-bg-weak-50'],
      },
    },
    {
      variant: 'error',
      mode: 'filled',
      class: {
        root: ['bg-error-base text-text-white-0 shadow-regular-sm', 'hover:opacity-90'],
      },
    },
    {
      variant: 'error',
      mode: 'stroke',
      class: {
        root: ['bg-bg-white-0 text-error-base shadow-regular-xs', 'hover:bg-bg-weak-50'],
      },
    },
    {
      variant: 'error',
      mode: 'lighter',
      class: {
        root: ['bg-bg-weak-50 text-error-base shadow-none', 'hover:bg-bg-white-0'],
      },
    },
    {
      variant: 'error',
      mode: 'ghost',
      class: {
        root: ['bg-transparent text-error-base', 'hover:bg-bg-weak-50'],
      },
    },
  ],
  defaultVariants: {
    variant: 'primary',
    mode: 'filled',
    size: 'medium',
  },
});

type ButtonSharedProps = VariantProps<typeof buttonVariants>;

type ButtonRootProps = VariantProps<typeof buttonVariants> &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
  };

const ButtonRoot = React.forwardRef<HTMLButtonElement, ButtonRootProps>(
  ({ children, variant, mode, size, asChild, className, ...rest }, forwardedRef) => {
    const uniqueId = React.useId();
    const Component = asChild ? Slot : 'button';
    const { root } = buttonVariants({ variant, mode, size });

    const sharedProps: ButtonSharedProps = {
      variant,
      mode,
      size,
    };

    const extendedChildren = recursiveCloneChildren(
      children,
      sharedProps,
      [BUTTON_ICON_NAME],
      uniqueId,
      asChild,
    );

    return (
      <Component ref={forwardedRef} className={root({ class: className })} {...rest}>
        {extendedChildren}
      </Component>
    );
  },
);
ButtonRoot.displayName = BUTTON_ROOT_NAME;

function ButtonIcon<T extends React.ElementType>({
  variant,
  mode,
  size,
  as,
  className,
  ...rest
}: PolymorphicComponentProps<T, ButtonSharedProps>) {
  const Component = as || 'div';
  const { icon } = buttonVariants({ mode, variant, size });

  return <Component className={icon({ class: className })} {...rest} />;
}
ButtonIcon.displayName = BUTTON_ICON_NAME;

export { ButtonRoot as Root, ButtonIcon as Icon };
