/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        status: {
          available: "#16a34a",
          onTrip: "#2563eb",
          inShop: "#d97706",
          retired: "#6b7280",
          suspended: "#dc2626",
          offDuty: "#6b7280",
        },
      },
    },
  },
  plugins: [],
};
