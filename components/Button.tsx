import styled from '@emotion/styled'

export const Button = styled.button<{ size: 'small' | 'large' }>`
  padding: ${({ size }) => (size === 'small' ? 'revert' : '2em')};
`
