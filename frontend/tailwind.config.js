/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#0ea5e9', // Sky Blue - Professional accent
                    dark: '#0284c7',
                    light: '#38bdf8',
                },
                accent: {
                    DEFAULT: '#ea580c', // Orange accent for important actions
                    dark: '#c2410c',
                    light: '#fb923c',
                },
                sidebar: {
                    DEFAULT: '#1e293b', // Slate 800 - Dark professional sidebar
                    dark: '#0f172a', // Slate 900
                    light: '#334155', // Slate 700
                },
                text: {
                    DEFAULT: '#0f172a',
                    muted: '#64748b',
                    light: '#94a3b8',
                },
                border: {
                    DEFAULT: '#e2e8f0',
                    dark: '#334155',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            }
        },
    },
    plugins: [],
}
