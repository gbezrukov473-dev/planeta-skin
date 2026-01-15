/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.html" 
  ],
  theme: {
    // Настройка контейнера ГЛОБАЛЬНО
    container: {
      center: true, // Автоматически добавляет mx-auto
      padding: {
        DEFAULT: '1.5rem',    // 24px на мобильных
        sm: '2rem',           // 32px на планшетах
        lg: '3rem',           // 48px на ноутбуках
        xl: '4rem',           // 64px на больших мониторах
        '2xl': '5rem',        // 80px на очень больших экранах
      },
      // Можно ограничить максимальную ширину, чтобы на 4K экранах сайт не разлетался
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1400px', // Ограничим контент шириной 1400px, это стандарт для современного веба
      },
    },
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
        sans: ['"Open Sans"', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['"Anticva"', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}