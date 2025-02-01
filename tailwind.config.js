const { fontFamily } = require("tailwindcss/defaultTheme")

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontFamily: {
  			sans: [
  				'var(--font-sans)',
                    ...fontFamily.sans
                ],
  			heading: [
  				'var(--font-heading)',
                    ...fontFamily.sans
                ]
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'fade-in': {
  				'0%': {
  					opacity: 0
  				},
  				'100%': {
  					opacity: 1
  				}
  			},
  			'fade-out': {
  				'0%': {
  					opacity: 1
  				},
  				'100%': {
  					opacity: 0
  				}
  			},
  			'slide-in': {
  				'0%': {
  					transform: 'translateY(100%)'
  				},
  				'100%': {
  					transform: 'translateY(0)'
  				}
  			},
  			'spin-slow': {
  				'0%': { transform: 'rotate(0deg)' },
  				'100%': { transform: 'rotate(360deg)' }
  			},
  			'swim': {
  				'0%': { transform: 'translate(0px, 0px) rotate(0deg)' },
  				'25%': { transform: 'translate(5px, -5px) rotate(5deg)' },
  				'50%': { transform: 'translate(0px, 0px) rotate(0deg)' },
  				'75%': { transform: 'translate(-5px, -5px) rotate(-5deg)' },
  				'100%': { transform: 'translate(0px, 0px) rotate(0deg)' }
  			},
  			'paddle': {
  				'0%': { transform: 'translateY(0px)' },
  				'50%': { transform: 'translateY(2px)' },
  				'100%': { transform: 'translateY(0px)' }
  			},
  			'paddle-left': {
  				'0%': { transform: 'rotate(-10deg)' },
  				'50%': { transform: 'rotate(10deg)' },
  				'100%': { transform: 'rotate(-10deg)' }
  			},
  			'paddle-right': {
  				'0%': { transform: 'rotate(10deg)' },
  				'50%': { transform: 'rotate(-10deg)' },
  				'100%': { transform: 'rotate(10deg)' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fade-in': 'fade-in 0.3s ease-out',
  			'fade-out': 'fade-out 0.3s ease-out',
  			'slide-in': 'slide-in 0.3s ease-out',
  			'spin-slow': 'spin-slow 3s linear infinite',
  			'swim': 'swim 3s ease-in-out infinite',
  			'paddle': 'paddle 1.5s ease-in-out infinite',
  			'paddle-left': 'paddle-left 1.5s ease-in-out infinite',
  			'paddle-right': 'paddle-right 1.5s ease-in-out infinite'
  		},
  		spacing: {
  			'4.5': '1.125rem',
  			'5.5': '1.375rem'
  		},
  		boxShadow: {
  			'custom-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  			'custom-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  			'custom-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  		},
  		opacity: {
  			'15': '0.15',
  			'35': '0.35',
  			'85': '0.85'
  		},
  		zIndex: {
  			'1': '1',
  			'2': '2',
  			'3': '3',
  			'4': '4',
  			'5': '5'
  		},
  		transitionDuration: {
  			'250': '250ms',
  			'350': '350ms',
  			'450': '450ms'
  		}
  	}
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"), 
    require("@tailwindcss/forms"),
    require("@tailwindcss/aspect-ratio"),
    require("postcss-import"),
    require("autoprefixer"),
  ],
}
