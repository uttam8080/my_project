# 🚀 Tekkzy - Digital Brand Identity Platform

<div align="center">

![Tekkzy Logo](https://img.shields.io/badge/Tekkzy-Digital%20Brand%20Identity-blue?style=for-the-badge&logo=react)
![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF?style=for-the-badge&logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.8-38B2AC?style=for-the-badge&logo=tailwind-css)

**Create Your Brand Identity Instantly** ✨

[Live Demo](https://awsaiapp.com/query) • [Documentation](#) • [Support](#contact)

</div>

---

## 🌟 Overview

Tekkzy is a cutting-edge digital platform that empowers businesses to create and establish their brand identity instantly. Built with modern web technologies, it offers a seamless experience for businesses looking to digitize their presence with AI-powered solutions and enterprise-grade features.

### ✨ Key Features

- **🎨 Instant Brand Creation** - Create your brand identity with our AI-powered platform
- **🔧 Enterprise Integration** - Seamless integration with any feedback channel
- **📊 Advanced Analytics** - Comprehensive data analysis and insights
- **🔒 Secure Identity Management** - Advanced authentication and authorization
- **💳 Payment Solutions** - Secure and convenient payment processing
- **📱 Responsive Design** - Beautiful UI/UX across all devices
- **⚡ Performance Optimized** - Lightning-fast loading with Vite
- **🎭 Advanced Animations** - Smooth GSAP and Framer Motion animations

---

## 🛠️ Technology Stack

### Frontend
- **React 19.1.0** - Latest React with concurrent features
- **Vite 6.3.5** - Lightning-fast build tool and dev server
- **Tailwind CSS 4.1.8** - Utility-first CSS framework
- **Framer Motion 12.16.0** - Production-ready motion library
- **GSAP 3.13.0** - Professional-grade animation library
- **React Router DOM 7.6.2** - Declarative routing for React

### UI/UX Libraries
- **Lucide React 0.513.0** - Beautiful & consistent icon toolkit
- **React Icons 5.5.0** - Popular icon packs for React
- **React Intersection Observer 9.16.0** - Intersection Observer API for React

### Development Tools
- **ESLint 9.25.0** - Pluggable JavaScript linter
- **TypeScript Support** - Full TypeScript integration

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/tekkzy.git
   cd tekkzy
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to see the application

### Build for Production

```bash
npm run build
# or
yarn build
```

### Preview Production Build

```bash
npm run preview
# or
yarn preview
```

---

## 📁 Project Structure

```
tekkzy/
├── public/                 # Static assets
│   ├── video/             # Video files
│   │   └── career-hero/       # Career page assets
│   ├── images/            # Image assets
│   ├── logos/             # Company logos
│   └── career-hero/       # Career page assets
├── src/
│   ├── components/        # React components
│   │   ├── common/        # Shared components
│   │   └── layout/        # Layout components
│   ├── pages/             # Page components
│   │   ├── home/          # Home page
│   │   ├── about/         # About page
│   │   ├── career/        # Career page
│   │   └── contact/       # Contact page
│   ├── hooks/             # Custom React hooks
│   ├── styles/            # CSS styles
│   ├── App.jsx            # Main App component
│   ├── routing.jsx        # Application routing
│   └── main.jsx           # Application entry point
├── package.json           # Dependencies and scripts
├── vite.config.js         # Vite configuration
└── README.md              # Project documentation
```

---

## 🎯 Core Features

### 1. **Hero Section**
- Dynamic video background with autoplay
- Gradient text animations
- Call-to-action buttons with glow effects
- Responsive design for all devices

### 2. **Services Showcase**
- Interactive service cards with scroll animations
- Gradient backgrounds and hover effects
- Icon animations and visual feedback
- Sticky positioning for enhanced UX

### 3. **Why Tekkzy Section**
- Interactive rotating wheel component
- Question-answer cards with animations
- Google search animation integration
- Mobile-responsive pagination

### 4. **Pricing Plans**
- Three-tier pricing structure (Basic, Standard, Advanced)
- Discount animations and price comparisons
- Secure payment integration
- Feature comparison tables

### 5. **Testimonials**
- Auto-scrolling testimonial carousel
- Smooth slide animations
- Client images with decorative elements
- Responsive layout for mobile and desktop

---

## 🎨 Design System

### Color Palette
- **Primary**: Blue gradients (`#3B82F6` to `#8B5CF6`)
- **Secondary**: Purple and pink accents
- **Background**: Dark gradients (`#0F0F1E` to `#1A1A2E`)
- **Text**: White and gray variations

### Typography
- **Headings**: Bold, large-scale typography with gradient effects
- **Body**: Clean, readable fonts with proper spacing
- **Accents**: Decorative elements and icons

### Animations
- **GSAP**: Scroll-triggered animations and complex sequences
- **Framer Motion**: Component transitions and micro-interactions
- **CSS**: Hover effects and loading animations

---

## 📱 Pages & Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Home | Main landing page with hero and services |
| `/about` | About | Company information and culture |
| `/career` | Career | Job opportunities and team highlights |
| `/contact` | Contact | Contact form and information |
| `/termscondition` | Terms | Terms and conditions page |
| `/privacypolicy` | Privacy | Privacy policy page |
| `/cancellation` | Cancellation | Cancellation and refund policy |

---

## 🔧 Customization

### Adding New Services
1. Navigate to `src/components/layout/OurServices.jsx`
2. Add new service object to the `services` array
3. Include icon, gradient, and description
4. The component will automatically render the new service

### Modifying Animations
- **GSAP Animations**: Edit `src/hooks/useGSAPAnimations.js`
- **Framer Motion**: Modify component-level animations
- **CSS Animations**: Update `src/styles/animations.css`

### Styling Changes
- **Tailwind Classes**: Modify component className props
- **Custom CSS**: Add styles to `src/index.css`
- **Component Styles**: Edit individual component files

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

### Traditional Hosting
```bash
npm run build
# Upload dist/ folder to your web server
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow React best practices
- Use TypeScript for new components
- Maintain consistent code formatting
- Write meaningful commit messages
- Test thoroughly before submitting

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Contact & Support

### Get in Touch
- **Phone**: (+1) 510-945-8169
- **Email**: info@tekkzy.com
- **Address**: 2nd Lane, Hill Town, Bhawanipatna, PC - 766003

### Support Channels
- **Documentation**: [Coming Soon]
- **Issues**: [GitHub Issues](https://github.com/your-username/tekkzy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/tekkzy/discussions)

---

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Vite Team** for the lightning-fast build tool
- **Tailwind CSS** for the utility-first CSS framework
- **Framer Motion** for the smooth animations
- **GSAP** for the professional animation library

---

<div align="center">

**Made with ❤️ by the Tekkzy Team**

[![GitHub stars](https://img.shields.io/github/stars/your-username/tekkzy?style=social)](https://github.com/your-username/tekkzy)
[![GitHub forks](https://img.shields.io/github/forks/your-username/tekkzy?style=social)](https://github.com/your-username/tekkzy)
[![GitHub issues](https://img.shields.io/github/issues/your-username/tekkzy)](https://github.com/your-username/tekkzy/issues)

</div>
