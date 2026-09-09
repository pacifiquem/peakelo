import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

import type { PolymorphicComponentProps } from '@/utils/polymorphic';
import { recursiveCloneChildren } from '@/utils/recursive-clone-children';
import { tv, type VariantProps } from '@/utils/tv';

const INPUT_ROOT_NAME = 'InputRoot';
const INPUT_WRAPPER_NAME = 'InputWrapper';
const INPUT_EL_NAME = 'InputEl';
const INPUT_ICON_NAME = 'InputIcon';

export const inputVariants = tv({
  slots: {
    root: [
      'group relative flex w-full overflow-hidden border-2 border-ink bg-bg-white-0 text-text-strong-950 shadow-regular-xs',
      'transition duration-200 ease-out',
      'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink',
    ],
    wrapper: 'flex w-full cursor-text items-center bg-bg-white-0',
    input: [
      'w-full bg-transparent text-sm text-text-strong-950 outline-none',
      'placeholder:text-text-soft-400',
      'disabled:text-text-disabled-300',
    ],
    icon: 'flex size-5 shrink-0 items-center justify-center text-text-sub-600',
  },
  variants: {
    size: {
      medium: {
        root: 'rounded-10',
        wrapper: 'gap-2 px-3',
        input: 'h-10',
      },
    },
    hasError: {
      true: {
        root: 'border-error-base',
      },
    },
  },
  defaultVariants: {
    size: 'medium',
  },
});

type InputSharedProps = VariantProps<typeof inputVariants>;

function InputRoot({
  className,
  children,
  size,
  hasError,
  asChild,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> &
  InputSharedProps & {
    asChild?: boolean;
  }) {
  const uniqueId = React.useId();
  const Component = asChild ? Slot : 'div';
  const { root } = inputVariants({ size, hasError });
  const extendedChildren = recursiveCloneChildren(
    children as React.ReactElement[],
    { size, hasError },
    [INPUT_WRAPPER_NAME, INPUT_EL_NAME, INPUT_ICON_NAME],
    uniqueId,
    asChild,
  );

  return (
    <Component className={root({ class: className })} {...rest}>
      {extendedChildren}
    </Component>
  );
}
InputRoot.displayName = INPUT_ROOT_NAME;

function InputWrapper({
  className,
  children,
  size,
  hasError,
  ...rest
}: React.HTMLAttributes<HTMLLabelElement> & InputSharedProps) {
  const { wrapper } = inputVariants({ size, hasError });
  return (
    <label className={wrapper({ class: className })} {...rest}>
      {children}
    </label>
  );
}
InputWrapper.displayName = INPUT_WRAPPER_NAME;

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & InputSharedProps
>(({ className, type = 'text', size, hasError, ...rest }, forwardedRef) => {
  const { input } = inputVariants({ size, hasError });
  return <input type={type} className={input({ class: className })} ref={forwardedRef} {...rest} />;
});
Input.displayName = INPUT_EL_NAME;

function InputIcon<T extends React.ElementType = 'div'>({
  as,
  className,
  size,
  hasError,
  ...rest
}: PolymorphicComponentProps<T, InputSharedProps>) {
  const Component = as || 'div';
  const { icon } = inputVariants({ size, hasError });
  return <Component className={icon({ class: className })} {...rest} />;
}
InputIcon.displayName = INPUT_ICON_NAME;

export { InputRoot as Root, InputWrapper as Wrapper, Input, InputIcon as Icon };
