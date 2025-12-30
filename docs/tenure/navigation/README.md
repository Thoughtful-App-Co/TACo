# Tenure Navigation Documentation

This folder contains comprehensive documentation for the Tenure app's routing and navigation system.

## Documents

### [ROUTING_SYSTEM.md](./ROUTING_SYSTEM.md)

**Complete routing guide for users and developers**

- Full URL structure reference
- User configuration guide (default landing locations)
- Implementation details and examples
- Future extensibility patterns
- Troubleshooting guide

**Read this if you want to:**

- Understand how URLs map to views
- Configure your default landing locations
- Add new routes to the app
- Troubleshoot navigation issues

---

### [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

**Technical summary of the routing implementation**

- Problem statement and solution overview
- Detailed file-by-file changes
- Before/after code comparisons
- Migration notes for developers
- Performance impact analysis

**Read this if you want to:**

- Understand what changed and why
- Review implementation decisions
- Learn the migration path from local state to URL-based routing
- See performance implications

---

## Quick Reference

### URL Structure

```
/tenure → User's default tab
├─ /discover → RIASEC assessment
├─ /prepare → Resume tools
├─ /prospect → User's default Prospect section
│  ├─ /dashboard → Stats overview
│  ├─ /pipeline → Kanban board
│  ├─ /insights → User's default Insights tab
│  │  ├─ /flow → Sankey diagram
│  │  ├─ /analytics → Conversion metrics
│  │  └─ /trends → Activity trends
│  └─ /settings → Configuration
├─ /prosper → Career journal (coming soon)
└─ /matches → Job matches
```

### User Configuration

Configure default landing locations in **Prospect > Settings**:

- **Default Landing Tab** - Where `/tenure` redirects
- **Default Prospect Section** - Where `/tenure/prospect` redirects
- **Default Insights Tab** - Where `/tenure/prospect/insights` redirects

### Key Benefits

✅ **Persistent URLs** - Refresh maintains your exact location  
✅ **Deep Linking** - Share URLs to specific views  
✅ **Browser History** - Back/forward buttons work correctly  
✅ **User Control** - Configure defaults in Settings  
✅ **Bookmarkable** - Save URLs to frequently accessed views

---

## Implementation Date

**December 29, 2025**

---

## Related Documentation

- [Tenure Architecture](../ARCHITECTURE.md) - Overall Tenure app structure
- [Pipeline Schema](../../schemas/pipeline.schema.ts) - Data models
- [Tenure Theme System](../THEMING.md) - Maximalist theme design

---

## Questions?

1. Check [ROUTING_SYSTEM.md](./ROUTING_SYSTEM.md) → Troubleshooting section
2. Check [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) → Migration notes
3. File an issue on GitHub with reproduction steps

---

**Maintained by:** Thoughtful App Co.  
**Last Updated:** December 29, 2025
