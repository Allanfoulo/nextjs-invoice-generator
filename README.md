# Next.js Invoice Generator

A modern, full-featured invoice and quote management application built with Next.js 15, ShadCN UI, and Supabase authentication.

## 🚀 Features

### Core Functionality
- **Dashboard**: Comprehensive overview with key performance indicators (KPIs) including total quotes, open quotes, outstanding deposits, and overdue invoices
- **Quotes Management**: Create, send, and track quotes with customizable items, pricing, and terms
- **Invoices Management**: Generate invoices from quotes or directly, with status tracking (draft, sent, partially paid, paid, overdue)
- **Client Management**: Maintain detailed client information including billing/delivery addresses, VAT numbers, and contact details
- **Settings**: Configure company information, payment instructions, numbering formats, and VAT settings

### Technical Features
- **Authentication**: Secure login system using Supabase with demo cookie-based auth (not for production)
- **Responsive Design**: Mobile-first design that works seamlessly across all devices
- **Real-time Updates**: Live data synchronization with Supabase
- **Advanced Filtering**: Search and filter invoices/quotes by client, status, and date
- **Smooth Animations**: Framer Motion powered transitions and micro-interactions
- **Type Safety**: Full TypeScript implementation with comprehensive type definitions
- **Modern UI**: ShadCN UI components with Tailwind CSS for consistent, accessible design

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: ShadCN UI (Radix UI primitives)
- **Animations**: Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Theme**: next-themes (dark/light mode support)

## 📋 Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn package manager
- Supabase account and project

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Allanfoulo/nextjs-invoice-generator.git
cd nextjs-invoice-generator
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

The application uses Supabase for data storage and authentication. The Supabase configuration is already set up in `lib/supabase.ts`. For production use, you should:

1. Create your own Supabase project
2. Update the Supabase URL and anon key in `lib/supabase.ts`
3. Set up the required database tables (see Database Schema section)

### 4. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### 5. Build for Production

```bash
npm run build
npm start
# or
yarn build
yarn start
```

## 📊 Database Schema

The application uses the following main entities:

### Company Settings
- Company information, VAT settings, numbering formats
- Payment instructions and terms

### Users
- User management with role-based access (Admin, Sales, Viewer)

### Clients
- Client details including company info, addresses, and contact information

### Items
- Line items for quotes and invoices (fixed price, hourly, expense types)

### Quotes
- Quote management with status tracking
- Items, pricing, deposit requirements, and validity periods

### Invoices
- Invoice generation from quotes or direct creation
- Payment tracking and status management

## 🔐 Authentication

The application uses Supabase authentication with a demo implementation using client-side cookies. **Important**: This is not suitable for production use. For production deployment:

1. Implement proper server-side authentication
2. Use Supabase RLS (Row Level Security) policies
3. Set up proper session management
4. Configure secure cookie settings

## 🎨 UI Components

The application uses ShadCN UI components with custom styling:

- **Navigation**: Responsive sidebar with active state indicators
- **Tables**: Sortable, filterable data tables with loading states
- **Forms**: Validated forms with error handling
- **Cards**: Information display with consistent styling
- **Badges**: Status indicators with color coding
- **Dialogs**: Modal dialogs for confirmations and forms

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop computers (1200px+)
- Tablets (768px - 1199px)
- Mobile devices (< 768px)

## 🔍 Key Features Explained

### Dashboard
- Real-time KPIs showing business metrics
- Recent quotes and invoices overview
- Collection progress tracking

### Quotes & Invoices
- Advanced search and filtering capabilities
- Status management with visual indicators
- Client association and detailed itemization
- PDF generation ready (structure prepared)

### Client Management
- Comprehensive client profiles
- Address management for billing and delivery
- VAT number tracking

### Settings
- Company branding and information
- Payment instruction customization
- Numbering format configuration
- VAT percentage settings

## 🏗️ Project Structure

```
├── app/                          # Next.js app router pages
│   ├── (app)/                   # Protected app routes
│   │   ├── dashboard/          # Dashboard page
│   │   ├── invoices/           # Invoices management
│   │   ├── quotes/             # Quotes management
│   │   ├── clients/            # Client management
│   │   └── settings/           # Application settings
│   ├── (auth)/                 # Authentication routes
│   │   └── login/              # Login page
│   ├── api/                    # API routes
│   │   └── auth/               # Authentication endpoints
│   └── globals.css             # Global styles
├── components/                 # React components
│   ├── ui/                     # ShadCN UI components
│   ├── layout/                 # Layout components
│   ├── auth/                   # Authentication components
│   └── theme-provider.tsx      # Theme provider
├── lib/                        # Utility libraries
│   ├── supabase.ts             # Supabase client
│   ├── auth.ts                 # Authentication utilities
│   ├── mappers.ts              # Data transformation
│   ├── utils.ts                # General utilities
│   ├── constants.ts            # Application constants
│   ├── validations/            # Zod validation schemas
│   └── invoice-types.ts        # TypeScript type definitions
├── middleware.ts               # Next.js middleware
├── components.json             # ShadCN configuration
└── tailwind.config.ts          # Tailwind configuration
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Code Quality

The project includes:
- **ESLint**: Configured for Next.js with TypeScript support
- **TypeScript**: Strict type checking enabled
- **Prettier**: Code formatting (via ESLint integration)

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables for Supabase
3. Deploy automatically on push

### Other Platforms

The application can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- Self-hosted with Docker

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [ShadCN UI](https://ui.shadcn.com/) - Beautiful UI components
- [Supabase](https://supabase.com/) - Backend as a service
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Framer Motion](https://framer.com/motion) - Animation library
- [Radix UI](https://radix-ui.com/) - Low-level UI primitives

## 📞 Support

For support, please open an issue on the GitHub repository or contact the maintainers.

---

Built with ❤️ using Next.js, ShadCN UI, and Supabase
