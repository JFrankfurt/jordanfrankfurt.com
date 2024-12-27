import { lighten } from 'polished'

const black = '#000'

export const theme = {
  palette: {
    black,
    grey15: lighten(0.9, black),
    grey30: lighten(0.7, black),
    grey45: lighten(0.6, black),
    grey60: lighten(0.4, black),
    grey75: lighten(0.25, black),
    grey90: lighten(0.1, black),
    linkHoverRed: 'hsl(360, 100%, 60%)',
    white: '#fff',
  },
  width: {
    desktopLarge: '2160px',
    desktop: '1440px',
    desktopSmall: '1024px',
    tablet: '768px',
    mobile: '375px',
  },
}
