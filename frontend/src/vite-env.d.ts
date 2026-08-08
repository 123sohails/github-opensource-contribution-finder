/// <reference types="vite/client" />

interface CSSModule {
  [className: string]: string
}

declare module '*.css' {
  const classes: CSSModule
  export default classes
}

declare module '*.module.css' {
  const classes: CSSModule
  export default classes
}

declare module '*.scss' {
  const classes: CSSModule
  export default classes
}

declare module '*.module.scss' {
  const classes: CSSModule
  export default classes
}

declare module '*.sass' {
  const classes: CSSModule
  export default classes
}

declare module '*.module.sass' {
  const classes: CSSModule
  export default classes
}
