# Tempo Documentation

Complete documentation for the Tempo time-management application built with Solid.js and premium design system.

## Documentation Structure

### Setup & Installation

- **[Setup Guide](./setup/README.md)** - Getting started with development environment
- **[Installation](./setup/INSTALLATION.md)** - Dependencies and project setup

### Design System

- **[Design System](./design/DESIGN_SYSTEM.md)** - Comprehensive design specifications, color palette, typography, components

### Development

- **[Linting & CI/CD](./development/LINTING_AND_CI_CD.md)** - ESLint, Prettier, GitHub Actions pipeline
- **[Development Guide](./development/DEVELOPMENT.md)** - Development workflow and best practices
- **[Architecture](./development/ARCHITECTURE.md)** - Project structure and architectural decisions
- **[Local API Development](./development/LOCAL_API_DEVELOPMENT.md)** - Local API setup and testing

### Deployment

- **[Deployment Guide](./deployment/DEPLOYMENT.md)** - Cloudflare Pages deployment

### Other

- **[Transition Plans](./transition-plans/README.md)** - Tempo Next.js to Solid.js transition documentation

## Quick Links

### For New Developers

1. Read [Setup Guide](./setup/README.md)
2. Follow [Installation](./setup/INSTALLATION.md)
3. Review [Development Guide](./development/DEVELOPMENT.md)
4. Check [Architecture](./development/ARCHITECTURE.md)

### For Designers

1. See [Design System](./design/DESIGN_SYSTEM.md)

### For DevOps/Deployment

1. Review [Deployment Guide](./deployment/DEPLOYMENT.md)
2. See [Linting & CI/CD](./development/LINTING_AND_CI_CD.md)
3. Check [Architecture](./development/ARCHITECTURE.md)

### For Designers

1. See [Design System](./design/DESIGN_SYSTEM.md)
2. Review [Tempo Design Tokens](./design/TEMPO_DESIGN.md)
3. Check [Responsive Design Guide](./guides/RESPONSIVE_DESIGN.md)

### For DevOps/Deployment

1. Review [Deployment Guide](./deployment/DEPLOYMENT.md)
2. Check [Environment Variables](./deployment/ENVIRONMENT.md)
3. See [Linting & CI/CD](./development/LINTING_AND_CI_CD.md)

### For Contributors

1. Read [Contributing Guidelines](./guides/CONTRIBUTING.md)
2. Check [Linting & CI/CD](./development/LINTING_AND_CI_CD.md)
3. Review [Development Guide](./development/DEVELOPMENT.md)

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

## Documentation Navigation

```
docs/
├── README.md (this file)
├── setup/
│   ├── README.md
│   └── INSTALLATION.md
├── design/
│   ├── DESIGN_SYSTEM.md
│   └── [40+ design reference files]
├── development/
│   ├── ARCHITECTURE.md
│   ├── DEVELOPMENT.md
│   ├── LINTING_AND_CI_CD.md
│   └── LOCAL_API_DEVELOPMENT.md
├── deployment/
│   └── DEPLOYMENT.md
├── features/
│   └── ROADMAP_BILLING_AUTH.md
├── transition-plans/
│   └── [Transition documentation]
└── judge/
    └── [Design evaluation files]
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
