import { Button as HeadlessButton } from '@headlessui/react'
import React from 'react'

interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  size: 'small' | 'large'
}

export const Button = ({ size, ...rest }: ButtonProps) => {
  return (
    <HeadlessButton
      className="rounded bg-sky-600 py-2 px-4 text-sm text-white data-[hover]:bg-sky-500 data-[active]:bg-sky-700"
      style={{ padding: size === 'small' ? 'revert' : '2em' }}
      {...rest}
    />
  )
}
