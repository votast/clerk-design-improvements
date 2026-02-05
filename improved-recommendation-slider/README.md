# Improved Recommendation Slider

A custom Clerk.io slider design with enhanced navigation and mobile experience.

## Features

- **Configurable cards per row** via simple Liquid variables
- **Desktop**: Arrow navigation
- **Mobile**: Swipe + progress bar indicator
- **Small Mobile**: Partial card visible (hints at more content)

## Why "irs-" Prefix?

All slider-related classes use the `irs-` prefix (Improved Recommendation Slider) to avoid conflicts with Clerk.js default slider functionality. This allows the custom navigation to work independently.

## File Structure

```
clerk-design-improvements/
└── improved-recommendation-slider/
    ├── README.md
    ├── docs/
    │   └── index.html    # Interactive documentation
    └── src/
        ├── slider.html   # Clerk.io design HTML template
        └── slider.css    # Clerk.io design CSS styles
```

## Installation

1. Create a new design in my.clerk.io
2. Copy contents of `src/slider.html` to the HTML field
3. Copy contents of `src/slider.css` to the CSS field
4. Save and test

## Customization

### Cards Per Row (Easy Configuration)

Edit these variables at the top of the HTML template:

```liquid
{% assign cards_desktop = 4 %}
{% assign cards_tablet = 3 %}
{% assign cards_mobile = 2 %}
```

The CSS automatically calculates card widths based on these values. The scroll progress bar and arrow navigation adapt automatically.

### Colors

Edit the CSS variables in `.irs-container`:

```css
.irs-container {
    --irs-text: #333;           /* Main text color */
    --irs-text-muted: #666;     /* Secondary text color */
    --irs-price-sale: #c00;     /* Sale price color */
    --irs-border: #ddd;         /* Border color */
    --irs-bg: #fff;             /* Background color */
}
```

### Product Card (Wrapper Approach)

The template uses a wrapper approach for easy product card replacement:

```html
<div class="irs-card">
    <!-- Wrapper handles sizing - DO NOT MODIFY -->
    
    <!-- ========================================
         PRODUCT CARD START
         Replace everything below with custom card
         ======================================== -->
    <article class="irs-card-content">
        <!-- Your custom card HTML here -->
        <!-- Can use any classes, any structure -->
    </article>
    <!-- ========================================
         PRODUCT CARD END
         ======================================== -->
</div>
```

**How to replace with a custom card:**
1. Keep the outer `<div class="irs-card">` wrapper (handles slider sizing)
2. Replace everything inside the comments with your custom card HTML
3. Your custom card can use any class names and structure
4. No risk of CSS conflicts with slider functionality

### Responsive Breakpoints

- **Desktop**: > 1024px (uses `cards_desktop`)
- **Tablet**: 768px - 1024px (uses `cards_tablet`)
- **Mobile**: 480px - 768px (uses `cards_mobile`)
- **Small Mobile**: < 480px (80% width, shows partial next card)

## Requirements

- Clerk.js must be loaded on the page
- The design requires `products.length > 7` to render (standard Clerk slider behavior)

## Currency

Default currency symbol is ` kr`. Change in the HTML:

```liquid
{% assign product_currency_symbol = " kr" %}
```
