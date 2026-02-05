# Clerk.io Design Improvements

A collection of enhanced design components for Clerk.io Omnisearch and product recommendations.

**Repository:** https://github.com/votast/clerk-design-improvements

---

## Components

### Improved Facets

Enhanced facet components for Clerk.io Omnisearch, including:

- **Price Range Slider** - Interactive dual-handle slider for price filtering with currency conversion support
- **Stock Toggle** - Toggle switch for filtering in-stock/out-of-stock products
- **Box View Facets** - Collapsible facet groups with improved UX

📖 [View Documentation](./improved-facets/README.md)

---

### Improved Recommendation Slider

Enhanced product recommendation slider with improved navigation and responsive design.

- **Configurable cards per row** via simple Liquid variables
- **Desktop arrow navigation** with smooth scrolling
- **Mobile swipe + progress bar** indicator

📖 [View Documentation](./improved-recommendation-slider/README.md)

---

## Repository Structure

```
clerk-design-improvements/
├── README.md
├── improved-facets/
│   ├── README.md
│   ├── docs/
│   │   └── index.html
│   └── src/
│       ├── config.liquid
│       ├── facets.html
│       ├── facets.css
│       ├── facets.js
│       ├── facets-price-range.js
│       ├── stock-toggle.html
│       └── stock-toggle.js
└── improved-recommendation-slider/
    ├── README.md
    ├── docs/
    │   └── index.html
    └── src/
        ├── slider.html
        └── slider.css
```

---

## Installation

Each component has its own installation guide. See the individual README files for detailed instructions.

## Requirements

- Clerk.io account with Omnisearch or Recommendations enabled
- Access to My Clerk design editor
- Basic understanding of Clerk.io template language

## Support

For questions or issues, contact the Clerk.io support team.

---

*Internal use only - Clerk.io*
