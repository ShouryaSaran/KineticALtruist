# Golf Charity Subscription Platform

A full-stack web application for golf subscription management with charity integration, prize draws, and performance tracking. Users can subscribe to monthly/yearly plans, submit golf scores, participate in draws, and support their chosen charities.

## Live Link : 
    https://kinetic-a-ltruist.vercel.app/

## 🎯 Features

### User Features
- **Authentication**: Secure JWT-based authentication with role-based access control
- **Subscription Management**: Monthly and yearly subscription plans with Razorpay payment integration
- **Score Tracking**: Submit and track golf scores with performance analytics
- **Prize Draws**: Monthly/yearly draw participation for subscribers
- **Charity Selection**: Choose and support preferred charities, view impact stats
- **Winnings Dashboard**: Track prizes won and draw history
- **Performance Tiers**: Tier-based rankings based on aggregated scores

### Admin Features
- **User Management**: View and manage all users, subscriptions, and roles
- **Charity Management**: Add, edit, and manage supported charities
- **Draw Management**: Create and manage monthly/yearly draws with prize allocations
- **Payment Monitoring**: Track subscription payments and revenue
- **Analytics**: View platform statistics and user metrics

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite for fast development
- **React Router v7** for navigation
- **CSS3** with responsive design (mobile-first)
- **Lucide Icons** for UI icons
- **Razorpay Hosted Checkout** for payments

### Backend
- **Node.js** with Express.js
- **PostgreSQL** via Supabase
- **JWT** for authentication
- **Razorpay** for payment processing
- **CORS** enabled for cross-origin requests

### Utilities
- **Vite** - Build tool and dev server
- **ESLint** - Code linting
- **npm** - Package management

## 📁 Project Structure

```
GolfCharitySubscription/
├── Frontend/
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   ├── context/          # React Context (Auth)
│   │   ├── Features/         # Feature-specific modules
│   │   ├── pages/            # Page components (Dashboard, Scores, Draws, etc.)
│   │   ├── styles/           # CSS files with responsive breakpoints
│   │   ├── utils/            # API client and utilities
│   │   ├── App.jsx           # Main app component
│   │   ├── app.routes.jsx    # Route definitions
│   │   └── main.jsx          # Entry point
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── eslint.config.js
│
├── Backend/
│   ├── index.js              # Server entry point
│   ├── package.json
│   ├── lib/
│   │   ├── supabase.js       # Database client
│   │   ├── drawEngine.js     # Draw logic and winner selection
│   │   └── prizePool.js      # Prize calculation
│   ├── middleware/
│   │   ├── verifyToken.js    # JWT authentication
│   │   └── verifyAdmin.js    # Admin authorization
│   └── routes/
│       ├── auth.js           # Authentication endpoints
│       ├── subscriptions.js  # Subscription management
│       ├── scores.js         # Score submission and tracking
│       ├── draws.js          # Draw management
│       ├── payment.js        # Payment processing
│       ├── charities.js      # Charity management
│       ├── winnings.js       # Prize tracking
│       └── admin.js          # Admin endpoints
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** 16+ 
- **npm** 8+
- Supabase account (PostgreSQL database)
- Razorpay account (payment processing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GolfCharitySubscription
   ```

2. **Frontend Setup**
   ```bash
   cd Frontend
   npm install
   ```

3. **Backend Setup**
   ```bash
   cd Backend
   npm install
   ```

### Environment Variables

#### Backend (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_API_KEY=your-anon-key

# Authentication
JWT_SECRET=your-jwt-secret-key

# Payment Processing (Razorpay)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-app-password
```

#### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:5000
```

## 💻 Running the Application

### Development Mode

**Terminal 1 - Backend Server**
```bash
cd Backend
npm start
```
Server runs on `http://localhost:5000`

**Terminal 2 - Frontend Dev Server**
```bash
cd Frontend
npm run dev
```
Frontend runs on `http://localhost:5173`

### Production Build

**Frontend**
```bash
cd Frontend
npm run build
npm run preview  # Preview production build locally
```

**Backend**
```bash
cd Backend
npm start  # Ensure NODE_ENV=production
```


## 📊 Performance Metrics

- **Frontend Build**: ~61 KB CSS, ~385 KB JS (gzipped)
- **Lighthouse Score**: Mobile-optimized for 560px+ screens
- **Build Time**: <300ms with Vite
- **Lint**: 0 errors with ESLint

## 🐛 Troubleshooting

### Common Issues

**CORS Errors**
- Check `CORS_ORIGIN` in backend `.env`
- Ensure frontend URL matches exactly

**Payment Failures**
- Verify Razorpay keys are correct
- Check test vs. production keys
- Ensure `NODE_ENV` is set correctly

**Mobile Overflow**
- All pages have responsive CSS breakpoints
- Use Chrome DevTools device emulation to test
- Check overflow-x: hidden is applied

**Database Connection**
- Verify Supabase credentials
- Check database is not in read-only mode
- Ensure network access is allowed

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [Supabase Documentation](https://supabase.com/docs)
- [Razorpay API Reference](https://razorpay.com/docs/api/)
- [Vite Documentation](https://vitejs.dev)

## 📄 License

This project is proprietary and confidential.

## 👥 Team

Built as an MVP for Golf Charity Subscription Platform.

---

**Last Updated**: March 26, 2026  
**Status**: Production Ready ✅
