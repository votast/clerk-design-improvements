# Clerk.io Improved Facets

Enhanced facet components for Omnisearch designs featuring **Box View Facets**, an interactive **Price Range Slider**, and a **Stock Toggle** filter.

## Features

- **Box View Facets** - Display facet options as clickable boxes instead of checkboxes
- **Dynamic Row Collapsing** - Automatically collapse box views with "Show more/less" functionality
- **Price Range Slider** - Interactive dual-handle slider for price filtering
- **Stock Toggle** - Simple on/off switch to filter by stock status
- **Multi-Currency Support** - Optional Shopify currency conversion integration
- **Fully Responsive** - Works seamlessly on desktop, tablet, and mobile
- **Smooth Animations** - Polished expand/collapse transitions
- **Easy Configuration** - Simple Liquid variables to enable/disable features

## Preview

Open `docs/index.html` in your browser to view the interactive documentation with copy-to-clipboard code snippets.

**Note:** The documentation requires a local HTTP server (e.g., VS Code Live Server) to load source files.

## Installation

### Step 1: Add Configuration Variables

Add the contents of `src/config.liquid` to the **top of your Omnisearch design**.

### Step 2: Update FacetsHTML

Replace or update your facet group loop with the code from `src/facets.html`.

### Step 3: Add CSS

Add the contents of `src/facets.css` to your design's stylesheet.

### Step 4: Add JavaScript

Add the contents of `src/facets.js` to your **FacetJSWrapper** subdesign.

### Step 5: Add Price Range Script (if using price slider)

If `show_price_slider` is enabled:

1. Create a new design component in your Omnisearch design called **FacetPriceRange**
2. Add the contents of `src/facets-price-range.js` to this new component
3. Include the design reference `@FacetPriceRange` in your main Omnisearch HTML **above** the `@FacetJSWrapper` reference

### Step 6: Add Stock Toggle (if using stock filter)

If `show_stock_toggle` is enabled:

1. Add the contents of `src/stock-toggle.html` inside your facets container (typically at the top)
2. Create a new design component called **FacetStockToggle**
3. Add the contents of `src/stock-toggle.js` to this new component
4. Include `@FacetStockToggle` in your main Omnisearch HTML

```html
<!-- In your Omnisearch design HTML -->
@FacetPriceRange
@FacetStockToggle
@FacetJSWrapper
```

## Configuration Options

### Box View Settings

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `facet_box_attributes` | String | `""` | Comma-separated list of attribute names to display as box view |
| `facet_box_rows` | Number | `2` | Number of rows to show before collapsing |

### Price Slider Settings

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `show_price_slider` | Boolean | `false` | Enable interactive price range slider |
| `use_currency_converter` | Boolean | `false` | Enable Shopify multi-currency conversion |
| `currency_symbol_before` | Boolean | `false` | `true` = $100, `false` = 100$ |
| `product_currency_separator` | String | `" "` | Thousands separator (e.g., " ", ".", ",") |

### Stock Toggle Settings

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `show_stock_toggle` | Boolean | `false` | Enable stock status toggle |
| `stock_show_all_when_off` | Boolean | `false` | `false` = filter to out of stock, `true` = show all products |
| `stock_facet_name` | String | `"stock_status"` | The facet attribute name for stock |
| `stock_value_instock` | String | `"instock"` | Value for in-stock products |
| `stock_value_outofstock` | String | `"outofstock"` | Value for out-of-stock products |
| `stock_label_on` | String | `"In stock"` | Display label when toggle is ON |
| `stock_label_off` | String | `"Out of stock"` | Display label when toggle is OFF |

## Example Configuration

```liquid
<!-- Facet Settings -->
{% assign facet_box_attributes = "size,color,brand" %} <!-- use the attribute name -->
{% assign facet_box_rows = 2 %} <!-- Number of rows to display before showing "Show more" button. -->

{% assign show_price_slider = true %} <!-- Boolean: true/false -->
{% assign use_currency_converter = false %} <!-- Boolean: true = use Shopify multi-currency conversion -->
{% assign currency_symbol_before = false %} <!-- Boolean: true = symbol before price ($100), false = symbol after price (100$) -->
{% assign product_currency_separator = " " %} <!-- thousands separator for price slider -->

{% assign show_stock_toggle = true %} <!-- Boolean: true/false -->
{% assign stock_show_all_when_off = false %} <!-- Boolean: false = filter to out of stock, true = show all products -->
{% assign stock_facet_name = "stock_status" %} <!-- The facet attribute name for stock status -->
{% assign stock_value_instock = "instock" %} <!-- Value for "in stock" products -->
{% assign stock_value_outofstock = "outofstock" %} <!-- Value for "out of stock" products -->
{% assign stock_label_on = "In stock" %} <!-- Display label when toggle is ON -->
{% assign stock_label_off = "Out of stock" %} <!-- Display label when toggle is OFF (change to "All products" if using stock_show_all_when_off = true) -->
```

## Multi-Currency Support

When `use_currency_converter` is enabled:

1. **Currency Symbol** - Uses Clerk's `{{ currency_symbol }}` global (changes with currency switcher)
2. **Price Conversion** - Multiplies prices by `Shopify.currency.rate` (same as product cards)

### Fallback Behavior

The slider includes safe fallbacks for non-Shopify stores:

| Scenario | Rate | Symbol | Result |
|----------|------|--------|--------|
| Converter OFF | 1 | `product_currency_symbol` | Normal display |
| Converter ON + Shopify exists | `Shopify.currency.rate` | `currency_symbol` | Converted display |
| Converter ON + Shopify missing | 1 (fallback) | `product_currency_symbol` (fallback) | Safe fallback |

## Stock Toggle Setup

### Prerequisites: Creating the stock_status Attribute

If your store doesn't have a `stock_status` attribute, you need to create one using **Modifiers** in My Clerk (Data > Modifiers). [Learn more about Modifiers](https://help.clerk.io/platform/data/modifiers/)

Create two modifiers in this order:

| Type | Attribute | New Value | Condition |
|------|-----------|-----------|-----------|
| Create new attribute | `stock_status` | `instock` | `stock > 0` |
| Create new attribute | `stock_status` | `outofstock` | `stock < 1` |

After saving and running the modifiers, the `stock_status` attribute will be available as a facet in your Omnisearch.

**Note:** If your store uses different attribute names or values (e.g., `availability` with values `available`/`unavailable`), update the configuration variables accordingly.

### Stock Toggle Behavior

The stock toggle provides a simple way to filter products by availability:

- **Hides the original facet** - The stock_status facet group is visually hidden
- **Shows a toggle switch** - Clean UI that's easier to use than checkboxes
- **Auto-applies filter** - On page load, defaults to showing in-stock products
- **Loading overlay** - Shows a spinner while results update
- **Hides from snackbar** - Stock filter chips are hidden from the active filters display

### Toggle Mode

The `stock_show_all_when_off` setting controls what the secondary toggle state shows:

| Setting | Toggle ON | Toggle OFF | Use Case |
|---------|-----------|------------|----------|
| `false` | In stock only | Out of stock only | Help users find discontinued/clearance items |
| `true` | In stock only | All products | Show everything by default, filter to in-stock |

When using `stock_show_all_when_off = true`, remember to also update `stock_label_off` to something like "All products".

### CSS Variables

The stock toggle uses these CSS variables (set in your theme):

| Variable | Default | Description |
|----------|---------|-------------|
| `--primary-background-color` | `#2c5aa0` | Toggle active (ON) color |
| `--background-grey` | `#ccc` | Toggle inactive (OFF) color |

## File Structure

```
Improved Facets/
├── README.md
├── docs/
│   └── index.html              # Interactive documentation
└── src/
    ├── config.liquid           # Configuration variables
    ├── facets.html             # FacetsHTML template code
    ├── facets.css              # Stylesheet
    ├── facets.js               # JavaScript (for FacetJSWrapper)
    ├── facets-price-range.js   # Price slider script (for FacetPriceRange)
    ├── stock-toggle.html       # Stock toggle HTML template
    └── stock-toggle.js         # Stock toggle script (for StockToggle)
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License - Feel free to use and modify for your Clerk.io implementations.

## Support

For questions about Clerk.io functionality, visit [docs.clerk.io](https://docs.clerk.io) or [help.clerk.io](https://help.clerk.io).
