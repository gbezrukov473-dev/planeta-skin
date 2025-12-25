/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.html" // Добавим это, чтобы Tailwind видел классы во всех HTML файлах
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          peach: '#E5C1AC',
          light: '#FDF6F3',
          turquoise: '#44C8D2',
          tiffany: '#017B8C',
          dark: '#333333'
        }
      },
      fontFamily: {
        // Указываем наши новые шрифты
        // sans - это шрифт по умолчанию для всего сайта
        sans: ['"Open Sans"', 'Helvetica', 'Arial', 'sans-serif'],
        // serif - это шрифт для заголовков (где мы пишем class="font-serif")
        serif: ['"Anticva"', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}