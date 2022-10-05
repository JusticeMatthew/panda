import { describe, expect, test } from 'vitest'
import { AtomicRule, ProcessOptions } from '../src/atomic-rule'
import { createContext } from './fixture'

function css(obj: ProcessOptions) {
  const ruleset = new AtomicRule(createContext())
  ruleset.process(obj)
  return ruleset.toCss()
}

describe('AtomicRule', () => {
  test('should work with basic', () => {
    expect(css({ styles: { bg: 'red.300' } })).toMatchInlineSnapshot(`
      ".background-red\\\\.300 {
          background: red.300
      }"
    `)
  })

  test('should resolve shorthand', () => {
    expect(css({ styles: { width: '50px', w: '20px' } })).toMatchInlineSnapshot(`
      ".w-20px {
          width: 20px
      }"
    `)

    expect(css({ styles: { width: { _: '50px', md: '60px' }, w: '70px' } })).toMatchInlineSnapshot(`
      ".w-70px {
          width: 70px
      }"
    `)
  })

  test('should work with inner responsive', () => {
    expect(
      css({
        styles: {
          ml: { ltr: { sm: '4' }, rtl: '-4' },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@screen sm {
          [dir=ltr] .ltr\\\\:sm\\\\:marginLeft-4 {
              margin-left: 4
          }
      }
      [dir=rtl] .rtl\\\\:marginLeft--4 {
          margin-left: -4
      }"
    `)
  })

  test('respect color mode', () => {
    expect(
      css({
        styles: {
          color: { light: 'red', dark: 'green' },
          opacity: { dark: 'slate400' },
        },
      }),
    ).toMatchInlineSnapshot(`
      "[data-theme=light] .light\\\\:color-red {
          color: red
      }
      [data-theme=dark] .dark\\\\:color-green {
          color: green
      }
      [data-theme=dark] .dark\\\\:opacity-slate400 {
          opacity: slate400
      }"
    `)
  })

  test('should work with outer responsive', () => {
    expect(
      css({
        styles: {
          top: { sm: { rtl: '20px', hover: '50px' }, lg: '120px' },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@screen sm {
          [dir=rtl] .sm\\\\:rtl\\\\:top-20px {
              top: 20px
          }
      }
      @screen sm {
          .sm\\\\:hover\\\\:top-50px:hover {
              top: 50px
          }
      }
      @screen lg {
          .lg\\\\:top-120px {
              top: 120px
          }
      }"
    `)
  })

  test('should skip `_` notation', () => {
    expect(
      css({
        styles: {
          left: { _: '20px', md: '40px' },
        },
      }),
    ).toMatchInlineSnapshot(`
      ".left-20px {
          left: 20px
      }
      @screen md {
          .md\\\\:left-40px {
              left: 40px
          }
      }"
    `)
  })

  test('[pseudo] should work with nested selector', () => {
    expect(
      css({
        scope: ['& > p'],
        styles: {
          left: { _: '20px', md: '40px' },
          bg: { light: 'red400', dark: 'green500' },
          font: { rtl: 'sans', ltr: { dark: { sm: { hover: 'serif' } } } },
        },
      }),
    ).toMatchInlineSnapshot(`
      ".\\\\[\\\\&_\\\\>_p\\\\]\\\\:left-20px > p {
          left: 20px
      }
      @screen md {
          .\\\\[\\\\&_\\\\>_p\\\\]\\\\:md\\\\:left-40px > p {
              left: 40px
          }
      }
      [data-theme=light] .\\\\[\\\\&_\\\\>_p\\\\]\\\\:light\\\\:background-red400 > p {
          background: red400
      }
      [data-theme=dark] .\\\\[\\\\&_\\\\>_p\\\\]\\\\:dark\\\\:background-green500 > p {
          background: green500
      }
      [dir=rtl] .\\\\[\\\\&_\\\\>_p\\\\]\\\\:rtl\\\\:font-sans > p {
          font: sans
      }
      @screen sm {
          [data-theme=dark] [dir=ltr] .\\\\[\\\\&_\\\\>_p\\\\]\\\\:ltr\\\\:dark\\\\:sm\\\\:hover\\\\:font-serif:hover > p {
              font: serif
          }
      }"
    `)
  })

  test('[parent selector] should work with nested selector', () => {
    expect(
      css({
        scope: ['input:hover &'],
        styles: {
          bg: 'red400',
          fontSize: { sm: '14px', lg: '18px' },
        },
      }),
    ).toMatchInlineSnapshot(`
      "input:hover .\\\\[input\\\\:hover_\\\\&\\\\]\\\\:background-red400 {
          background: red400
      }
      @screen sm {
          input:hover .\\\\[input\\\\:hover_\\\\&\\\\]\\\\:sm\\\\:fontSize-14px {
              font-size: 14px
          }
      }
      @screen lg {
          input:hover .\\\\[input\\\\:hover_\\\\&\\\\]\\\\:lg\\\\:fontSize-18px {
              font-size: 18px
          }
      }"
    `)
  })

  test('[selector] should work with nested selector', () => {
    expect(
      css({
        scope: ['&::placeholder'],
        styles: {
          left: '40px',
          bg: 'red400',
          textAlign: { sm: 'left' },
        },
      }),
    ).toMatchInlineSnapshot(`
      ".\\\\[\\\\&\\\\:\\\\:placeholder\\\\]\\\\:left-40px::placeholder {
          left: 40px
      }
      .\\\\[\\\\&\\\\:\\\\:placeholder\\\\]\\\\:background-red400::placeholder {
          background: red400
      }
      @screen sm {
          .\\\\[\\\\&\\\\:\\\\:placeholder\\\\]\\\\:sm\\\\:ta-left::placeholder {
              text-align: left
          }
      }"
    `)
  })

  test('[@media] should work with nested selector', () => {
    expect(
      css({
        scope: ['@media base'],
        styles: {
          left: '40px',
          textAlign: { sm: 'left' },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@media base {
          .\\\\[\\\\@media_base\\\\]\\\\:left-40px {
              left: 40px
          }
      }
      @media base {
          @screen sm {
              .\\\\[\\\\@media_base\\\\]\\\\:sm\\\\:ta-left {
                  text-align: left
              }
          }
      }"
    `)
  })
})

describe('grouped conditions styles', () => {
  test('simple', () => {
    expect(
      css({
        styles: {
          hover: { bg: 'pink.400' },
        },
      }),
    ).toMatchInlineSnapshot(`
      ".hover\\\\:background-pink\\\\.400:hover {
          background: pink.400
      }"
    `)
  })

  test('nested > property', () => {
    expect(
      css({
        styles: {
          hover: { bg: { sm: { dark: 'red.300' } }, color: 'pink.400' },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@screen sm {
          [data-theme=dark] .hover\\\\:sm\\\\:dark\\\\:background-red\\\\.300:hover {
              background: red.300
          }
      }
      .hover\\\\:color-pink\\\\.400:hover {
          color: pink.400
      }"
    `)
  })

  test('nested > nested > property', () => {
    expect(
      css({
        styles: {
          hover: { disabled: { bg: { sm: 'red.300' } } },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@screen sm {
          .hover\\\\:disabled\\\\:sm\\\\:background-red\\\\.300:hover:disabled {
              background: red.300
          }
      }"
    `)
  })

  test('multiple scopes', () => {
    expect(
      css({
        scope: ['@media base', '&:hover'],
        styles: {
          left: '40px',
          textAlign: { sm: 'left' },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@media base {
          .\\\\[\\\\@media_base__\\\\&\\\\:hover\\\\]\\\\:left-40px:hover {
              left: 40px
          }
      }
      @media base {
          @screen sm {
              .\\\\[\\\\@media_base__\\\\&\\\\:hover\\\\]\\\\:sm\\\\:ta-left:hover {
                  text-align: left
              }
          }
      }"
    `)
  })
})
