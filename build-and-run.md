# Build and Run

The source repository for PharmaPath remains private. The notes below are safe public-level orientation for people with source access.

## Local development

- Use Node.js 24.x and npm.
- Install dependencies with npm install.
- Use the private repository setup documentation for local service configuration.
- Run npm run dev for local development and npm run build for production build validation.
- Use npm run validate when you need the full private-repo validation sequence.

## Validation

Use the private repository's documented validation scripts before publishing or deploying source changes. For documentation-only work, verify links, file names, and public-safe language before publishing.

## Public docs publishing

The private source repository contains a docs-only publish workflow. It copies allowlisted Markdown files from `docs-public/` into this public documentation repository and runs a leak check before publishing.
