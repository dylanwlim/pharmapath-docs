# Public Docs Publishing Setup

This private repository publishes `docs-public/` to `dylanwlim/pharmapath-docs`.

## Required GitHub Actions secret

Add a secret named `PUBLIC_DOCS_REPO_TOKEN` to this private source repository.

The token should be a fine-grained GitHub token with Contents read/write access only to `dylanwlim/pharmapath-docs`. Do not grant access to the private source repository or any unrelated repository.

## Workflow behavior

- Runs on pushes to `main` when `docs-public/**` changes.
- Runs manually through `workflow_dispatch`.
- Fails closed when `PUBLIC_DOCS_REPO_TOKEN` is missing.
- Publishes only allowlisted Markdown files from `docs-public/`.
- Runs a leak check before publishing.
- Never mirrors the private repository.
