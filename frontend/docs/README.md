# Clearpool Finance Documentation

This directory contains the Docusaurus documentation site for Clearpool Finance.

## Documentation Structure

- **Get Started**: Quick start guide for new users
- **Features**: Overview of platform features
- **Important Concepts**: 
  - Calculating NAV
  - Withdrawal Management
- **Security**: 
  - Funds Control
- **Contracts**: Smart contract documentation
- **FAQs**: Frequently asked questions

## Development

To run the documentation site locally:

```bash
cd docs
npm install
npm start
```

This will start the Docusaurus development server at `http://localhost:3000/docs/`.

## Building

The documentation is automatically built as part of the main Next.js build process:

```bash
npm run build:docs
```

This builds Docusaurus and copies the output to `public/docs/` where Next.js can serve it.

## Production Build

For production builds, Docusaurus is built automatically when you run:

```bash
npm run build
```

This command:
1. Installs Docusaurus dependencies
2. Builds the documentation
3. Copies it to `public/docs/`
4. Builds the Next.js application

The documentation will be available at `/docs/` in production.

## Configuration

The Docusaurus configuration is in `docusaurus.config.ts`. The base URL is set to `/docs/` to work with Next.js routing.

## Adding New Documentation

1. Add markdown files to the `docs/` directory
2. Update `sidebars.ts` to include the new pages
3. Add frontmatter to the markdown file:

```markdown
---
sidebar_position: 1
sidebar_label: My Page
---

# My Page Content
```

## Deployment

The documentation is deployed automatically with the main application to Vercel. The build process handles everything automatically.
