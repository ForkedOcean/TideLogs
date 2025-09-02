/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                'tide-blue': '#0ea5e9',
                'tide-dark': '#0f172a',
                'tide-gray': '#64748b',
            },
        },
    },
    plugins: [],
};