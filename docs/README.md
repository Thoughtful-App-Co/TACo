# TACo Documentation

Complete documentation for the TACo (Thoughtful App Co) monorepo containing Tempo, Tenure, Echoprax, and other applications.

## Documentation Structure

### 📋 Setup & Installation

- **[Setup Guide](./setup/README.md)** - Getting started with development environment
- **[Installation](./setup/INSTALLATION.md)** - Dependencies and project setup

### 🎨 Design System

- **[Design System](./context_engineering/design/DESIGN_SYSTEM.md)** - Comprehensive design specifications, color palette, typography, components
- **[Tooltip Positioning](./context_engineering/design/TOOLTIP_POSITIONING.md)** - **MANDATORY: Portal-based tooltip rendering guide**
- **[Branding Changes](./context_engineering/design/BRANDING_CHANGES.md)** - TACo brand evolution and updates

### 👨‍💻 Development

- **[Linting & CI/CD](./context_engineering/development/LINTING_AND_CI_CD.md)** - ESLint, Prettier, GitHub Actions pipeline
- **[Development Guide](./context_engineering/development/DEVELOPMENT.md)** - Development workflow and best practices
- **[Architecture](./context_engineering/development/ARCHITECTURE.md)** - Project structure and architectural decisions
- **[Recent Changes](./context_engineering/development/RECENT_CHANGES.md)** - Latest updates and refactors

### 🚀 Deployment & Core Systems

- **[Database Setup](./DATABASE_SETUP.md)** - D1 database configuration
- **[Secrets Reference](./SECRETS_REFERENCE.md)** - Environment variables and API keys
- **[Installation](./INSTALLATION.md)** - Project setup and dependencies

### 🔐 Core Systems

- **[Feature Gating](./core/FEATURE_GATING.md)** - Premium features and subscription checks (MASTER GUIDE)
- **[Feature Gating Refactor Summary](./core/FEATURE_GATING_REFACTOR_SUMMARY.md)** - Recent refactor details
- **[Auth](./core/auth/)** - Authentication system
- **[Billing](./core/billing/)** - Stripe integration
- **[O\*NET API Proxy](./core/ONET_API_PROXY.md)** - Career data API

### 📱 App-Specific Documentation

- **[Tempo](./tempo/)** - Time management and productivity
- **[Tenure](./tenure/)** - Career management and job search
- **[Echoprax](./echoprax/)** - Fitness and workout tracking
- **[Nurture](./nurture/)** - Relationship management (planned)

## Quick Links

### For New Developers

1. Follow [Installation](./INSTALLATION.md)
2. Set up [Database](./DATABASE_SETUP.md)
3. Configure [Secrets](./SECRETS_REFERENCE.md)
4. Review [Architecture](./context_engineering/development/ARCHITECTURE.md)
5. Check [Development Guide](./context_engineering/development/DEVELOPMENT.md)

### For Adding Premium Features

1. **READ FIRST:** [Feature Gating Master Guide](./core/FEATURE_GATING.md) ⭐
2. Review [Feature Gating Refactor](./core/FEATURE_GATING_REFACTOR_SUMMARY.md)
3. See examples in Tenure/Tempo/Echoprax apps
4. Never create custom paywalls - use centralized system

### For Designers

1. See [Design System](./context_engineering/design/DESIGN_SYSTEM.md)
2. Review [Branding Changes](./context_engineering/design/BRANDING_CHANGES.md)
3. Check [Tooltip Positioning](./context_engineering/design/TOOLTIP_POSITIONING.md)

### For Contributors

1. Read root [CONTRIBUTING.md](../CONTRIBUTING.md)
2. Check [Linting & CI/CD](./context_engineering/development/LINTING_AND_CI_CD.md)
3. Review [Development Guide](./context_engineering/development/DEVELOPMENT.md)
4. See [Recent Changes](./context_engineering/development/RECENT_CHANGES.md)

## Technology Stack

- **Framework**: Solid.js 1.8.0
- **Build Tool**: Vite 5.0.0
- **Language**: TypeScript 5.3.0
- **Styling**: Inline styles with design tokens (no CSS framework)
- **Icons**: Phosphor Icons (Solid.js)
- **Fonts**: Geist Variable Font
- **Deployment**: Cloudflare Pages
- **CI/CD**: GitHub Actions
- **Linting**: ESLint 9.0+, Prettier 3.7+

## Apps in TACo Ecosystem

- **Tempo** - A.D.H.D Task Master for natural rhythm productivity
- **Tenure** - Eternal Career Companion (RIASEC assessment, pipeline management, lifetime career companion)
- **Nurture** - Relationship Management
- **FriendLy** - Friendship calendar
- **JustInCase** - Small claims helper
- **Manifest** - Picky matchmaking
- **LoL** - Gamified chores

## Project Information

- **Version**: 1.0.0
- **Status**: Production Ready
- **License**: Proprietary (See public/terms-of-service.md)

## Recent Updates

### Phase 10: Polish & Documentation

- Verified fonts (GeistVF & GeistMonoVF)
- Verified Tempo logo integration
- Code review of all UI components
- Responsive design implementation
- Accessibility audit (WCAG AA+)
- Comprehensive documentation

### Phase 9: Branding & Typography

- Created TempoLogo component
- Integrated Geist Variable Fonts
- Proper layout centering

### Phase 8: Bespoke Design System

- Removed Tailwind CSS
- Created tempo-design.ts with centralized tokens
- Converted all components to inline styles
- Added responsive media queries
- Implemented dark theme (#0A0A0F)

### CI/CD Setup

- ESLint configuration for Solid.js
- Prettier code formatting
- Husky pre-commit hooks
- GitHub Actions CI/CD pipeline
- Cloudflare Pages deployment integration

## Getting Help

- Check the appropriate documentation folder
- Review GitHub Issues
- Contact the development team
- See [Contributing Guidelines](./guides/CONTRIBUTING.md)

## Documentation Navigation

```
docs/
├── README.md (this file)
├── DATABASE_SETUP.md
├── INSTALLATION.md
├── SECRETS_REFERENCE.md
├── core/
│   ├── FEATURE_GATING.md ⭐ (Premium features master guide)
│   ├── FEATURE_GATING_REFACTOR_SUMMARY.md
│   ├── ONET_API_PROXY.md
│   ├── auth/
│   │   └── UNIFIED_AUTH.md
│   └── billing/
│       └── STRIPE_INTEGRATION.md
├── context_engineering/
│   ├── design/
│   │   ├── DESIGN_SYSTEM.md
│   │   ├── TOOLTIP_POSITIONING.md
│   │   ├── BRANDING_CHANGES.md
│   │   └── [40+ design reference files]
│   ├── development/
│   │   ├── ARCHITECTURE.md
│   │   ├── DEVELOPMENT.md
│   │   ├── LINTING_AND_CI_CD.md
│   │   ├── LOCAL_API_DEVELOPMENT.md
│   │   └── RECENT_CHANGES.md
│   └── judge/
│       └── [Design evaluation files]
├── tempo/
│   ├── SYNC_INTEGRATION.md
│   ├── deployment/
│   └── transition-plans/
├── tenure/
│   ├── PREMIUM_FEATURES_IMPLEMENTATION.md
│   ├── SYNC_INTEGRATION.md
│   ├── THEMING.md
│   ├── features/
│   ├── infrastructure/
│   ├── navigation/
│   ├── pipeline/
│   ├── prepare/
│   └── testing/
├── echoprax/
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── API_INTEGRATIONS.md
│   └── PREMIUM_GATING_REFACTOR.md
└── nurture/
    └── SYNC_INTEGRATION.md
```

## Contact & Support

For technical issues, feature requests, or feedback:

- GitHub: [Report Issues](https://github.com/sst/opencode)
- Email: [contact@thoughtfulappco.com]
- Documentation Feedback: Update the relevant docs/ file

---

**Last Updated**: December 2025
**Maintained By**: Thoughtful App Co.
**Version**: 1.0.0
