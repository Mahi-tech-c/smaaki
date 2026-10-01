# Smaaki 🍽️📸
> **Modern Cloud-Enabled Restaurant & Food E-Commerce Platform**  
> *Seamless dining catalog, gym/health macro insights, commercial image licensing, and instant admin command center.*

---

## 🌟 Key Features

### 🥗 Customer Experience & Catalog
- **Interactive Menu & Category Browsing**: Real-time filtering by dietary preference (Vegetarian, Non-Vegetarian) and department shelves.
- **Gym & Protein Conscious Details**: Structured macronutrient breakdown (**Protein, Calories, Carbs, Fats**) and fitness tags for health-conscious diners.
- **Dynamic Cart & WhatsApp Direct Ordering**: Cart drawer with order summary, variant selection, and direct WhatsApp checkout integration.
- **Responsive Layout**: Designed for all screen sizes (mobile, tablet, desktop) without UI disturbance.

### 📸 Commercial Food Photo Licensing (Quick Look)
- **Dual-Mode Modal**: Toggle seamlessly between ordering the food dish and licensing high-resolution commercial photography.
- **Instant UPI QR Payments**: Built-in dynamic UPI payment QR and one-click app launcher configured with `9032578532@ybl`.
- **Digital Asset Protection**: Previews protected against downloads (`draggable={false}`, context menu blocking, watermark badges) with delivery workflow for uncompressed 4K master files.

### ⚡ Instant Admin Command Center
- **Zero-Latency State Updates**: Optimistic local updates provide instant saves for menu items, categories, pricing, and settings.
- **Role-Based Access**: Multi-tier admin roles (Master Admin / Superadmin) with session caching for instantaneous dashboard access.
- **Dynamic Live QR Generator**: Live QR code generator for customer tables, home link, or custom target URLs with one-click print and SVG export.
- **Global Theme & Brand Management**: Full control over color schemes, typography, splash screens, SEO metadata, and domain settings.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS
- **Routing**: React Router DOM (v7)
- **Database & Auth**: Firebase Firestore (real-time listeners), Firebase Authentication
- **Icons & QR**: Lucide React, QRCodeCanvas
- **Interactions**: Drag & drop support, responsive portals

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/smaaki.git
   cd smaaki
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 📂 Project Structure

```text
├── src/
│   ├── components/
│   │   ├── Admin/            # Admin dashboard, editors, auth, and QR generator
│   │   ├── Customer/         # Product cards, quick view modal, cart drawer
│   │   ├── Navbar.jsx        # Responsive navigation
│   │   ├── MenuSection.jsx   # Menu catalog and category shelves
│   │   └── Hero.jsx          # Landing banner
│   ├── context/
│   │   └── AppContext.jsx    # Global state, optimistic updates, and Firestore listeners
│   ├── services/
│   │   └── menuService.js    # Firebase database operations
│   ├── utils/
│   │   └── helpers.js        # Formatting, sanitization, image compression
│   ├── App.jsx               # Route definitions and global theme injection
│   └── main.jsx              # React app entry point
└── package.json
```

---

## 🔒 License & Copyright
© 2026 Smaakenzzoo. All rights reserved. Commercial photography assets protected.
