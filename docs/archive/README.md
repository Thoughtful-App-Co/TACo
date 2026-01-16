# Archived Documentation

This directory contains historical documentation that is no longer relevant to current development but is preserved for reference.

## ⚠️ WARNING: DO NOT USE FOR DEVELOPMENT

**These documents are OUTDATED and should NOT be referenced for:**

- Current implementation details
- Architecture decisions
- Pricing information
- Feature planning
- Development workflows

**If you need current documentation, see `/docs/` (parent directory).**

---

## What's Archived Here

### Historical Roadmaps

- `ROADMAP_BILLING_AUTH.md` - Old billing/auth implementation roadmap (phases now complete)
- `AUGMENT_BUILD_ROADMAP.md` - Legacy Augment feature roadmap

### Why These Are Archived

These documents were created during planning/development phases and served their purpose. The information they contain is either:

1. **Completed** - Implementation is done, git history preserves the details
2. **Superseded** - Newer documentation reflects current state
3. **Contradictory** - Contains outdated info that conflicts with production code

---

## Finding Current Documentation

| Topic          | Current Location                                        |
| -------------- | ------------------------------------------------------- |
| Feature gating | `/docs/core/FEATURE_GATING.md`                          |
| Billing/Stripe | `/docs/core/billing/STRIPE_INTEGRATION.md`              |
| Authentication | `/docs/core/auth/UNIFIED_AUTH.md`                       |
| Pricing        | `/docs/tenure/features/PRICING.md`                      |
| Architecture   | `/docs/context_engineering/development/ARCHITECTURE.md` |
| Development    | `/docs/context_engineering/development/DEVELOPMENT.md`  |
| Setup          | `/DEVELOPER_SETUP.md` (root)                            |

---

## Policy

**Do not add new docs to this archive directory.**

If a document becomes outdated:

1. Determine if information should be preserved (git history may be sufficient)
2. If preserving, move to `/docs/archive/` with clear date stamp
3. Update references in current docs to point to newer versions
4. Add entry to this README explaining what was archived and why

---

**Last Updated:** January 16, 2026
