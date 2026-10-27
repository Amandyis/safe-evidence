import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { provideRouter } from '@angular/router'
import { providePrimeNG } from 'primeng/config'
import Aura from '@primeng/themes/aura'
import { definePreset } from '@primeng/themes'
import { routes } from './app.routes'
import { autenticacaoInterceptor } from './interceptors/autenticacao.interceptor'

const SafeEvidencePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: 'oklch(97% 0.014 254.604)',
      100: 'oklch(93.2% 0.032 255.585)',
      200: 'oklch(88.2% 0.059 254.128)',
      300: 'oklch(80.9% 0.105 251.813)',
      400: 'oklch(70.7% 0.165 254.624)',
      500: 'oklch(62.3% 0.214 259.815)',
      600: 'oklch(54.6% 0.245 262.881)',
      700: 'oklch(48.8% 0.243 264.376)',
      800: 'oklch(42.4% 0.199 265.638)',
      900: 'oklch(37.9% 0.146 265.522)',
      950: 'oklch(28.2% 0.091 267.935)',
    },
    colorScheme: {
      light: {
        primary: {
          color: 'oklch(37.9% 0.146 265.522)',
          hoverColor: 'oklch(28.2% 0.091 267.935)',
          activeColor: 'oklch(28.2% 0.091 267.935)',
          contrastColor: '#ffffff',
        },
      },
      dark: {
        primary: {
          color: 'oklch(48.8% 0.243 264.376)',
          hoverColor: 'oklch(42.4% 0.199 265.638)',
          activeColor: 'oklch(37.9% 0.146 265.522)',
          contrastColor: '#ffffff',
        },
      },
    },
  },
})

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    providePrimeNG({
      theme: {
        preset: SafeEvidencePreset,
        options: {
          darkModeSelector: false,
        },
      },
    }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([autenticacaoInterceptor])),
  ],
}
