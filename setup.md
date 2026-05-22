# Public Docs Publishing Setup

This private repository publishes `docs-public/` to `dylanwlim/pharmapath-docs`.

## Required GitHub Actions secret

This repository uses `PUBLIC_DOCS_REPO_TOKEN` as the publish credential.

Current setup: the secret is an SSH deploy key private key whose matching public key has write access only to `dylanwlim/pharmapath-docs`. This avoids broad account tokens and does not grant access to the private source repository.

If the credential is rotated, create a new deploy key for `dylanwlim/pharmapath-docs` and store the private key in `PUBLIC_DOCS_REPO_TOKEN`. A fine-grained GitHub token with Contents read/write access only to `dylanwlim/pharmapath-docs` is also supported. Do not use a classic or account-wide token.

## Workflow behavior

- Runs on pushes to `main` when `docs-public/**` changes.
- Runs manually through `workflow_dispatch`.
- Fails closed when `PUBLIC_DOCS_REPO_TOKEN` is missing.
- Publishes only allowlisted Markdown files from `docs-public/`.
- Runs a leak check before publishing.
- Never mirrors the private repository.
