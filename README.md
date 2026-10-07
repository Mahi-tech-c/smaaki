# Smaakenzzoo ☕🧇
> **Artisanal Cafe, Warangal, Telangana**  
> *"Flourishing Hearts, Blooming Dreams"*

---

## 🌟 Overview

Smaakenzzoo is a modern cafe ordering platform crafted for an artisanal dining experience in Warangal. The platform offers a rich, mobile-first digital menu, customizable items, seamless cart ordering, and a real-time admin management portal.

All cafe contact details, operational hours, UPI payment IDs, and menu offerings are dynamically configured via Firestore settings.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4 (`@tailwindcss/vite`)
- **Routing**: React Router DOM (v7)
- **Database & Auth**: Firebase Firestore (real-time sync + offline caching), Firebase Authentication
- **Icons & UI**: Lucide React
- **Hosting & Deployment**: Vercel

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Mahi-tech-c/smaaki.git
   cd smaaki
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env` and fill in your Firebase project credentials:
   ```bash
   cp .env.example .env
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## 📂 Project Structure

```text
├── src/
│   ├── components/
│   │   ├── Admin/            # Admin dashboard, editors, auth, and QR generator (lazy-loaded)
│   │   ├── Customer/         # Product cards, item detail sheet, cart drawer
│   │   ├── Navbar.jsx        # Navigation bar
│   │   ├── MenuSection.jsx   # Menu catalog and category sections
│   │   └── Hero.jsx          # Cafe hero banner
│   ├── context/
│   │   └── AppContext.jsx    # Global state, optimistic updates, and Firestore listeners
│   ├── data/
│   │   └── menu.js           # Local fallback menu dataset
│   ├── services/
│   │   └── menuService.js    # Firestore database operations
│   ├── utils/
│   │   └── helpers.js        # Formatting and helper utilities
│   ├── App.jsx               # Route definitions and code splitting
│   └── main.jsx              # React app entry point
├── scripts/
│   └── migrate-copy.js       # Menu copy migration script
└── package.json
```

---

## 🔒 License & Copyright
© Smaakenzzoo. All rights reserved.
