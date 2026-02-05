<script>
Clerk("on", "rendered", function() {
  // ==========================================
  // CONFIGURATION - Uses Clerk template variables
  // ==========================================
  const USE_CURRENCY_CONVERTER = {{ use_currency_converter }};

  // Currency symbols - use Clerk global when converting, otherwise use static config
  const CURRENCY_SYMBOL_DYNAMIC = '{{ currency_symbol }}';        // Clerk global (dynamic, changes with currency switcher)
  const CURRENCY_SYMBOL_STATIC = '{{ product_currency_symbol }}'; // Config variable (static)

  // Use dynamic symbol if converter is on AND symbol exists, otherwise fallback to static
  const CURRENCY_SYMBOL = (USE_CURRENCY_CONVERTER && CURRENCY_SYMBOL_DYNAMIC) 
    ? CURRENCY_SYMBOL_DYNAMIC 
    : CURRENCY_SYMBOL_STATIC;

  const THOUSANDS_SEPARATOR = '{{ product_currency_separator }}';
  const CURRENCY_SYMBOL_BEFORE = {{ currency_symbol_before }};

  // Get currency rate (same logic as Clerk's currency_converter formatter)
  function getCurrencyRate() {
    if (!USE_CURRENCY_CONVERTER) return 1;
    if (typeof Shopify !== 'undefined' && Shopify.currency && Shopify.currency.rate) {
      return Shopify.currency.rate;
    }
    return 1; // Fallback: no conversion
  }

  const CURRENCY_RATE = getCurrencyRate();

  // Format number with thousands separator and currency conversion
  function formatPrice(num) {
    const converted = Math.round(num * CURRENCY_RATE);
    return converted.toString().replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS_SEPARATOR);
  }

  // Format price with currency symbol in correct position
  function formatPriceWithSymbol(num, suffix = '') {
    const formattedNum = formatPrice(num) + suffix;
    if (CURRENCY_SYMBOL_BEFORE) {
      return CURRENCY_SYMBOL + formattedNum;
    }
    return formattedNum + CURRENCY_SYMBOL;
  }

  // ==========================================
  // PRICE SLIDER CLASS
  // ==========================================
  class PriceSlider {
    constructor() {
      this.availableRanges = [];
      this.hasOpenEnded = false;
      this.openEndValue = null;
      // Initialize with null to detect first run
      this.absoluteMin = null;
      this.absoluteMax = null;
      this.sliderMax = null;
      this.userSelectedMin = null; // User's actual price selection
      this.userSelectedMax = null;
      this.userHasSelection = false; // Track if user has made a selection
    }

    findElements() {
      this.minSlider = document.getElementById("minPrice");
      this.maxSlider = document.getElementById("maxPrice");
      this.track = document.getElementById("priceTrack");
      this.minLabel = document.getElementById("minLabel");
      this.maxLabel = document.getElementById("maxLabel");
      this.ticksContainer = document.getElementById("priceTicks");
      return this.minSlider && this.maxSlider && this.minLabel && this.maxLabel;
    }

    init() {
      if (!this.findElements()) return;

      // Store previous range bounds (null on first run)
      const isFirstRun = (this.absoluteMin === null);

      // Recalculate ranges from current facet elements
      this.setupDynamicRanges();

      // Clone inputs to remove old listeners
      [this.minSlider, this.maxSlider].forEach(el => {
        const clone = el.cloneNode(true);
        el.parentNode.replaceChild(clone, el);
      });
      this.findElements();

      // Event listeners
      this.minSlider.addEventListener("input", () => {
        this.updateRange();
      });
      
      this.maxSlider.addEventListener("input", () => {
        this.updateRange();
      });
      
      this.minSlider.addEventListener("mouseup", () => {
        this.saveUserSelection();
        this.triggerClerkSearch();
      });
      this.maxSlider.addEventListener("mouseup", () => {
        this.saveUserSelection();
        this.triggerClerkSearch();
      });
      this.minSlider.addEventListener("touchend", () => {
        this.saveUserSelection();
        this.triggerClerkSearch();
      });
      this.maxSlider.addEventListener("touchend", () => {
        this.saveUserSelection();
        this.triggerClerkSearch();
      });

      // Determine initial slider values
      if (isFirstRun) {
        // First run - check localStorage for saved selection
        const savedMin = localStorage.getItem("priceSliderMin");
        const savedMax = localStorage.getItem("priceSliderMax");
        
        if (savedMin !== null && savedMax !== null) {
          this.userSelectedMin = parseInt(savedMin);
          this.userSelectedMax = parseInt(savedMax);
          this.userHasSelection = true;
        }
      }

      if (this.userHasSelection && this.userSelectedMin !== null && this.userSelectedMax !== null) {
        // User has a selection - clamp it to new valid range and preserve
        const clampedMin = Math.max(this.absoluteMin, Math.min(this.userSelectedMin, this.sliderMax - 1));
        const clampedMax = Math.min(this.sliderMax, Math.max(this.userSelectedMax, this.absoluteMin + 1));
        
        // Ensure min < max after clamping
        if (clampedMin >= clampedMax) {
          // Selection is now invalid - reset to full range
          this.minSlider.value = this.absoluteMin;
          this.maxSlider.value = this.sliderMax;
          this.userHasSelection = false;
          this.userSelectedMin = null;
          this.userSelectedMax = null;
          localStorage.removeItem("priceSliderMin");
          localStorage.removeItem("priceSliderMax");
        } else {
          // Valid clamped selection - use it
          this.minSlider.value = clampedMin;
          this.maxSlider.value = clampedMax;
          // Update stored selection if it was clamped
          if (clampedMin !== this.userSelectedMin || clampedMax !== this.userSelectedMax) {
            this.userSelectedMin = clampedMin;
            this.userSelectedMax = clampedMax;
            localStorage.setItem("priceSliderMin", clampedMin);
            localStorage.setItem("priceSliderMax", clampedMax);
          }
        }
      } else {
        // No user selection - use full range
        this.minSlider.value = this.absoluteMin;
        this.maxSlider.value = this.sliderMax;
      }

      this.updateRange();
    }

    saveUserSelection() {
      const minVal = parseInt(this.minSlider.value);
      const maxVal = parseInt(this.maxSlider.value);
      
      // Check if selection is the full range (no actual filter)
      const isFullRange = (minVal === this.absoluteMin && maxVal === this.sliderMax);
      
      if (isFullRange) {
        // User moved sliders back to full range - clear selection
        this.userHasSelection = false;
        this.userSelectedMin = null;
        this.userSelectedMax = null;
        localStorage.removeItem("priceSliderMin");
        localStorage.removeItem("priceSliderMax");
      } else {
        // User made a specific selection
        this.userHasSelection = true;
        this.userSelectedMin = minVal;
        this.userSelectedMax = maxVal;
        localStorage.setItem("priceSliderMin", minVal);
        localStorage.setItem("priceSliderMax", maxVal);
      }
    }

    setupDynamicRanges() {
      const priceFacets = document.querySelectorAll('[data-facet="_price_range"]');
      this.availableRanges = [];
      this.hasOpenEnded = false;
      this.openEndValue = null;

      priceFacets.forEach(facet => {
        const value = facet.dataset.value;
        if (value && value.includes(" - ")) {
          const [low, high] = value.split(" - ");
          const min = parseInt(low) || 0;
          let max;

          if (high === "...") {
            this.hasOpenEnded = true;
            this.openEndValue = this.openEndValue !== null 
              ? Math.max(this.openEndValue, min)
              : min;
            max = min;
          } else {
            max = parseInt(high) || 0;
          }

          this.availableRanges.push({ min, max, original: value, element: facet });
        }
      });

      if (this.availableRanges.length > 0) {
        this.absoluteMin = Math.min(...this.availableRanges.map(r => r.min));
        this.absoluteMax = this.hasOpenEnded
          ? this.openEndValue
          : Math.max(...this.availableRanges.map(r => r.max));
      } else {
        this.absoluteMin = 0;
        this.absoluteMax = 1000;
      }

      this.sliderMax = this.hasOpenEnded 
        ? this.openEndValue + 1 
        : this.absoluteMax;

      // Update slider min/max attributes to new range
      this.minSlider.min = this.absoluteMin;
      this.minSlider.max = this.sliderMax;
      this.maxSlider.min = this.absoluteMin;
      this.maxSlider.max = this.sliderMax;

      this.renderTicks();
    }

    renderTicks() {
      if (!this.ticksContainer) return;
      this.ticksContainer.innerHTML = "";
    
      const range = this.absoluteMax - this.absoluteMin;
      if (range <= 0) return;
    
      // Calculate actual midpoint value (arithmetic mean)
      const midValue = Math.round((this.absoluteMin + this.absoluteMax) / 2);
    
      // Create exactly 3 labels: min (0%), mid (50%), max (100%)
      const ticks = [
        { value: this.absoluteMin, percent: 0 },
        { value: midValue, percent: 50 },
        { value: this.absoluteMax, percent: 100, isMax: true }
      ];
    
      ticks.forEach(tick => {
        const label = document.createElement("span");
        label.className = "slider-label";
        label.style.left = tick.percent + "%";
        
        if (tick.isMax && this.hasOpenEnded) {
          label.textContent = formatPriceWithSymbol(tick.value, '+');
        } else {
          label.textContent = formatPriceWithSymbol(tick.value);
        }
        
        this.ticksContainer.appendChild(label);
      });
    }

    updateRange() {
      let minVal = parseInt(this.minSlider.value);
      let maxVal = parseInt(this.maxSlider.value);

      // Ensure min doesn't exceed max
      if (minVal >= maxVal) {
        if (document.activeElement === this.minSlider) {
          maxVal = minVal + 1;
          this.maxSlider.value = maxVal;
        } else {
          minVal = maxVal - 1;
          this.minSlider.value = minVal;
        }
      }

      if (maxVal > this.sliderMax) {
        maxVal = this.sliderMax;
        this.maxSlider.value = maxVal;
      }

      // Update labels with formatted prices
      this.minLabel.textContent = formatPriceWithSymbol(minVal);
      
      let maxDisplay = formatPriceWithSymbol(maxVal);
      if (this.hasOpenEnded && maxVal > this.absoluteMax) {
        maxDisplay = formatPriceWithSymbol(this.absoluteMax, '+');
      }
      this.maxLabel.textContent = maxDisplay;

      // Update visual track
      this.updateTrack(minVal, maxVal);
    }

    updateTrack(minVal, maxVal) {
      if (!this.track) return;
      const total = this.sliderMax - this.absoluteMin;
      if (total <= 0) return;
      
      const left = ((minVal - this.absoluteMin) / total) * 100;
      const right = ((maxVal - this.absoluteMin) / total) * 100;
      this.track.style.left = left + "%";
      this.track.style.width = (right - left) + "%";
    }

    triggerClerkSearch() {
      if (!this.availableRanges.length) return;
      
      const minVal = parseInt(this.minSlider.value);
      const maxVal = parseInt(this.maxSlider.value);

      // Deselect all price facets first
      document.querySelectorAll('[data-facet="_price_range"].clerk-facet-selected')
        .forEach(f => {
          if (f.classList.contains("clerk-facet-selected")) {
            f.click();
          }
        });

      setTimeout(() => {
        this.availableRanges.forEach(r => {
          const isOpenEnded = r.original && r.original.includes(" - ...");
          let shouldBeSelected;
          
          if (isOpenEnded) {
            shouldBeSelected = (minVal <= r.min && maxVal > r.min);
          } else {
            shouldBeSelected = (minVal <= r.max && maxVal >= r.min);
          }
          
          if (shouldBeSelected && !r.element.classList.contains("clerk-facet-selected")) {
            r.element.click();
          }
        });
      }, 50);
    }

    reset() {
      if (!this.findElements()) return;
      
      // Clear user selection
      this.userHasSelection = false;
      this.userSelectedMin = null;
      this.userSelectedMax = null;
      localStorage.removeItem("priceSliderMin");
      localStorage.removeItem("priceSliderMax");
      
      // Reset to full range
      this.minSlider.value = this.absoluteMin;
      this.maxSlider.value = this.sliderMax;
      this.updateRange();
    }
  }

  // Initialize
  if (!window.priceSliderInstance) {
    window.priceSliderInstance = new PriceSlider();
  }
  window.priceSliderInstance.init();

  // Clear all filters handler
  const clearBtns = document.querySelectorAll(".clerk-omnisearch-facet-full-reset");
  clearBtns.forEach(btn => {
    btn.addEventListener("click", function() {
      if (window.priceSliderInstance) {
        window.priceSliderInstance.reset();
      }
    });
  });

  // Individual price chip clear handler
  const priceChips = document.querySelectorAll('.os-snack[data-facet-group="_price_range"] .os-clear-snack');
  priceChips.forEach(chip => {
    chip.addEventListener("click", function(e) {
      e.stopPropagation();
      if (window.priceSliderInstance) {
        window.priceSliderInstance.reset();
      }
    });
  });
});
</script>

<script>
Clerk("on", "rendered", function() {
  // ==========================================
  // PRICE CHIP COLLAPSE FUNCTIONALITY
  // Combines multiple price range chips into one display
  // ==========================================
  (function() {
    
    /**
     * Resets the price slider to its default min/max values
     */
    function resetPriceSlider() {
      const ps = window.priceSliderInstance;
      if (ps) {
        ps.reset();
      }
      
      // Also click any remaining price facet chips to clear them
      const clerkResets = document.querySelectorAll('.clerk-omnisearch-facet-reset[data-facet-group="_price_range"]');
      clerkResets.forEach(function(el) { el.click(); });
    }

    /**
     * Combines multiple price range chips into a single display
     * Shows format: "min kr - max kr"
     */
    function collapsePriceChips() {
      const minLabel = document.getElementById("minLabel");
      const maxLabel = document.getElementById("maxLabel");
      const chips = document.querySelectorAll('.os-facets-snackbar .os-snack[data-facet-group="_price_range"]');

      if (!minLabel || !maxLabel || chips.length === 0) return;

      // Get current min/max values from slider labels
      const min = minLabel.textContent.trim();
      const max = maxLabel.textContent.trim();
      const combined = min + " - " + max;

      // Update first chip to show combined range
      const firstChip = chips[0];
      const firstChipName = firstChip.querySelector(".os-snack-name");
      if (firstChipName && firstChipName.textContent !== combined) {
        firstChipName.textContent = combined;
      }

      // Hide all additional price chips
      for (let i = 1; i < chips.length; i++) {
        chips[i].style.display = "none";
      }

      // Attach reset handler to clear button (once only)
      const clearBtn = firstChip.querySelector(".os-clear-snack");
      if (clearBtn && !clearBtn.__resetAttached) {
        clearBtn.addEventListener("click", function(e) {
          e.preventDefault();
          e.stopPropagation();
          resetPriceSlider();
        });
        clearBtn.__resetAttached = true;
      }
    }

    /**
     * Checks if all filter chips have been cleared
     * Resets price slider if no filters remain active
     */
    function checkForAllFacetsCleared() {
      const allChips = document.querySelectorAll('.os-facets-snackbar .os-snack');
      const visibleChips = Array.from(allChips).filter(function(chip) {
        return window.getComputedStyle(chip).display !== 'none' &&
               chip.style.display !== 'none';
      });

      if (visibleChips.length === 0) {
        resetPriceSlider();
      }
    }

    /**
     * Attaches event listeners to "clear all" buttons
     */
    function attachClearListeners() {
      const clearSelectors = [
        '.clerk-omnisearch-facet-full-reset',
        '.os-facets-clear'
      ];

      clearSelectors.forEach(function(selector) {
        document.querySelectorAll(selector).forEach(function(btn) {
          if (!btn.__clearAllAttached) {
            btn.addEventListener('click', function(e) {
              setTimeout(function() {
                checkForAllFacetsCleared();
                setTimeout(resetPriceSlider, 200);
              }, 100);
            });
            btn.__clearAllAttached = true;
          }
        });
      });
    }

    // Initial execution
    collapsePriceChips();
    attachClearListeners();

    // Monitor chip container for changes using MutationObserver
    const snackbar = document.querySelector(".os-facets-snackbar");
    if (snackbar && !snackbar.__observerAttached) {
      let timeout;
      const observer = new MutationObserver(function(mutations) {
        clearTimeout(timeout);
        timeout = setTimeout(function() {
          collapsePriceChips();
          checkForAllFacetsCleared();
        }, 30);
      });
      observer.observe(snackbar, { childList: true, subtree: true });
      snackbar.__observerAttached = true;
    }

    // Polling fallback: check chip count periodically
    let lastChipCount = -1;
    setInterval(function() {
      const currentChips = document.querySelectorAll('.os-facets-snackbar .os-snack').length;
      if (currentChips !== lastChipCount) {
        collapsePriceChips();
        if (currentChips === 0) {
          resetPriceSlider();
        }
        lastChipCount = currentChips;
      }
    }, 500);
  })();
});
</script>
