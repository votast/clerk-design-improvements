<script>
(function() {
  // Stock Toggle Controller
  var StockToggle = {
    state: {
      filter: null,
      config: null,
      initialized: false,
      inProgress: false
    },
    
    // Initialize the stock toggle
    init: function(contentId) {
      var self = this;
      
      if (typeof Clerk === 'function') {
        Clerk('on', 'rendered', contentId, function() {
          self.setup();
        });
      }
    },
    
    // Setup the toggle (called on each render)
    setup: function() {
      var toggleContainer = document.querySelector('.clerk-stock-toggle');
      var toggleLabel = document.querySelector('.clerk-stock-toggle-label');
      
      // Check if enabled
      var enabledAttr = toggleContainer ? toggleContainer.getAttribute('data-enabled') : null;
      var isEnabled = enabledAttr && enabledAttr.trim().toLowerCase() === 'true';
      
      if (!isEnabled) {
        if (toggleContainer) toggleContainer.style.display = 'none';
        this.removeCSS();
        return;
      }
      
      if (!toggleLabel) return;
      
      // Read configuration
      var showAllAttr = toggleContainer.getAttribute('data-show-all-when-off');
      this.state.config = {
        facetName: toggleContainer.getAttribute('data-facet-name') || 'stock_status',
        valueInstock: toggleContainer.getAttribute('data-value-instock') || 'instock',
        valueOutofstock: toggleContainer.getAttribute('data-value-outofstock') || 'outofstock',
        labelOn: toggleContainer.getAttribute('data-label-on') || 'In stock',
        labelOff: toggleContainer.getAttribute('data-label-off') || 'Out of stock',
        showAllWhenOff: showAllAttr && showAllAttr.trim().toLowerCase() === 'true'
      };
      
      toggleContainer.style.display = '';
      this.injectCSS(this.state.config.facetName);
      
      // Setup click handler (only once)
      if (!this.state.initialized) {
        this.state.initialized = true;
        var self = this;
        
        document.addEventListener('click', function(e) {
          var label = e.target.closest('.clerk-stock-toggle-label');
          if (label) {
            e.preventDefault();
            self.toggle();
          }
        });
        
        this.state.filter = this.state.config.valueInstock;
      }
      
      this.updateUI(true);
      
      var self = this;
      setTimeout(function() {
        self.ensureFilterApplied();
        self.updateSnackbar();
      }, 100);
    },
    
    // Inject CSS
    injectCSS: function(facetName) {
      var existingStyle = document.getElementById('clerk-stock-toggle-css');
      
      if (existingStyle) {
        var currentFacet = existingStyle.getAttribute('data-facet-name');
        if (currentFacet === facetName && document.head.contains(existingStyle)) {
          return;
        }
        existingStyle.remove();
      }
      
      var style = document.createElement('style');
      style.id = 'clerk-stock-toggle-css';
      style.setAttribute('data-facet-name', facetName);
      
      var css = '';
      css += '[data-facet-group="' + facetName + '"] {';
      css += 'position: absolute !important;';
      css += 'width: 1px !important;';
      css += 'height: 1px !important;';
      css += 'padding: 0 !important;';
      css += 'margin: -1px !important;';
      css += 'overflow: hidden !important;';
      css += 'clip: rect(0, 0, 0, 0) !important;';
      css += 'white-space: nowrap !important;';
      css += 'border: 0 !important;';
      css += '}';
      css += '.os-snack[data-facet-group="' + facetName + '"] { display: none !important; }';
      css += '.clerk-stock-only-snackbar { display: none !important; }';
      css += '.clerk-stock-toggle { display: flex; align-items: center; gap: 8px; padding: 12px 0; margin-bottom: 12px; border-bottom: 1px solid #eee; flex-wrap: wrap; }';
      css += '.clerk-stock-toggle-label { font-size: 14px; color: #333; cursor: pointer; user-select: none; display: flex; align-items: center; gap: 8px; flex-shrink: 0; }';
      css += '.clerk-stock-toggle-switch { position: relative; width: 44px; min-width: 44px; height: 24px; background: var(--primary-background-color, #2c5aa0); border-radius: 12px; cursor: pointer; transition: background 0.2s ease; overflow: hidden; flex-shrink: 0; }';
      css += '.clerk-stock-toggle-switch::after { content: ""; position: absolute; top: 2px; left: 22px; width: 20px; height: 20px; background: #fff; border-radius: 50%; transition: left 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }';
      css += '.clerk-stock-toggle-switch.inactive { background: var(--background-grey, #ccc); }';
      css += '.clerk-stock-toggle-switch.inactive::after { left: 2px; }';
      css += '.clerk-stock-toggle-status { font-size: 14px; color: #333; margin-left: auto; flex-shrink: 0; }';
      css += '.clerk-stock-toggle.no-transition .clerk-stock-toggle-switch, .clerk-stock-toggle.no-transition .clerk-stock-toggle-switch::after { transition: none !important; }';
      css += '@media (max-width: 480px) { .clerk-stock-toggle { gap: 6px; padding: 10px 0; } .clerk-stock-toggle-status { font-size: 13px; } }';
      css += '.clerk-stock-loading-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255, 255, 255, 0.9); z-index: 9999; opacity: 0; visibility: hidden; transition: opacity 0.1s ease, visibility 0.1s ease; pointer-events: none; }';
      css += '.clerk-stock-loading-overlay.active { opacity: 1; visibility: visible; }';
      css += '.clerk-stock-loading-spinner { position: absolute; width: 40px; height: 40px; border: 4px solid var(--background-grey, #e0e0e0); border-top-color: var(--primary-background-color, #2c5aa0); border-radius: 50%; animation: clerk-spin 0.8s linear infinite; }';
      css += '.os-results { position: relative !important; }';
      css += '@keyframes clerk-spin { to { transform: rotate(360deg); } }';
      
      style.textContent = css;
      document.head.appendChild(style);
    },
    
    // Remove CSS
    removeCSS: function() {
      var style = document.getElementById('clerk-stock-toggle-css');
      if (style) style.remove();
    },
    
    // Toggle the filter
    toggle: function() {
      var config = this.state.config;
      if (!config) return;
      
      var currentFilter = this.state.filter;
      var newFilter;
      
      // Determine new filter based on showAllWhenOff setting
      if (config.showAllWhenOff) {
        // Mode: instock <-> all (no filter)
        newFilter = currentFilter === config.valueInstock ? 'all' : config.valueInstock;
      } else {
        // Mode: instock <-> outofstock (default)
        newFilter = currentFilter === config.valueInstock ? config.valueOutofstock : config.valueInstock;
      }
      
      this.state.filter = newFilter;
      this.updateUI();
      this.showOverlay();
      this.state.inProgress = true;
      
      var self = this;
      
      if (config.showAllWhenOff && newFilter === 'all') {
        // Deselect both instock and outofstock facets to show all products
        var instockFacet = this.findFacet(config.valueInstock);
        var outofstockFacet = this.findFacet(config.valueOutofstock);
        
        if (instockFacet && instockFacet.classList.contains('clerk-facet-selected')) {
          instockFacet.click();
        }
        if (outofstockFacet && outofstockFacet.classList.contains('clerk-facet-selected')) {
          outofstockFacet.click();
        }
        
        setTimeout(function() {
          self.state.inProgress = false;
          self.hideOverlay();
          self.updateSnackbar();
          var tc = document.querySelector('.clerk-stock-toggle');
          if (tc) tc.classList.remove('no-transition');
        }, 500);
      } else {
        // Standard behavior: deselect current, select new
        var currentFacet = currentFilter === 'all' ? null : this.findFacet(currentFilter);
        if (currentFacet && currentFacet.classList.contains('clerk-facet-selected')) {
          currentFacet.click();
        }
        
        setTimeout(function() {
          var newFacet = self.findFacet(newFilter);
          if (newFacet && !newFacet.classList.contains('clerk-facet-selected')) {
            newFacet.click();
          }
          
          setTimeout(function() {
            self.state.inProgress = false;
            self.hideOverlay();
            self.updateSnackbar();
            var tc = document.querySelector('.clerk-stock-toggle');
            if (tc) tc.classList.remove('no-transition');
          }, 400);
        }, 100);
      }
    },
    
    // Find a facet element by value
    findFacet: function(value) {
      var config = this.state.config;
      var facetName = config ? config.facetName : 'stock_status';
      
      var allFacets = document.querySelectorAll('[data-facet]');
      var found = null;
      allFacets.forEach(function(el) {
        if (el.getAttribute('data-facet') === facetName && el.getAttribute('data-value') === value) {
          found = el;
        }
      });
      return found;
    },
    
    // Update the toggle UI
    updateUI: function(skipTransition) {
      var config = this.state.config;
      var toggleContainer = document.querySelector('.clerk-stock-toggle');
      var toggleSwitch = document.querySelector('.clerk-stock-toggle-switch');
      var statusText = document.querySelector('.clerk-stock-toggle-status');
      
      // Determine if toggle is in "off" state
      var isOff = this.state.filter !== config.valueInstock;
      
      if ((skipTransition || this.state.inProgress) && toggleContainer) {
        toggleContainer.classList.add('no-transition');
      }
      
      if (toggleSwitch) {
        toggleSwitch.classList.remove('inactive');
        if (isOff) {
          toggleSwitch.classList.add('inactive');
        }
      }
      
      if (statusText && config) {
        statusText.textContent = isOff ? config.labelOff : config.labelOn;
      }
      
      if (skipTransition && toggleContainer) {
        toggleContainer.offsetHeight;
        var self = this;
        setTimeout(function() {
          if (!self.state.inProgress) {
            toggleContainer.classList.remove('no-transition');
          }
        }, 250);
      }
    },
    
    // Ensure correct filter is applied
    ensureFilterApplied: function() {
      if (this.state.inProgress) return;
      
      var config = this.state.config;
      if (!config) return;
      
      var instockFacet = this.findFacet(config.valueInstock);
      var outofstockFacet = this.findFacet(config.valueOutofstock);
      
      if (!instockFacet || !outofstockFacet) return;
      
      var instockSelected = instockFacet.classList.contains('clerk-facet-selected');
      var outofstockSelected = outofstockFacet.classList.contains('clerk-facet-selected');
      var desiredFilter = this.state.filter;
      
      // Handle "all" mode - ensure no stock facets are selected
      if (config.showAllWhenOff && desiredFilter === 'all') {
        if (instockSelected) instockFacet.click();
        if (outofstockSelected) outofstockFacet.click();
        return;
      }
      
      // Standard mode logic
      var correctSelected = desiredFilter === config.valueInstock ? instockSelected : outofstockSelected;
      var wrongSelected = desiredFilter === config.valueInstock ? outofstockSelected : instockSelected;
      
      if (correctSelected && !wrongSelected) return;
      
      if (wrongSelected) {
        var wrongFacet = desiredFilter === config.valueInstock ? outofstockFacet : instockFacet;
        wrongFacet.click();
        if (correctSelected) return;
      }
      
      if (!correctSelected) {
        var correctFacet = desiredFilter === config.valueInstock ? instockFacet : outofstockFacet;
        correctFacet.click();
      }
    },
    
    // Update snackbar visibility
    updateSnackbar: function() {
      var config = this.state.config;
      if (!config) return;
      
      var snackbar = document.querySelector('.os-snackbar') || 
                     document.querySelector('.clerk-snackbar') ||
                     document.querySelector('[class*="snackbar"]');
      
      if (!snackbar) return;
      
      var allSelectedFacets = document.querySelectorAll('.clerk-facet-selected, .os-snack');
      var nonStockCount = 0;
      
      allSelectedFacets.forEach(function(facet) {
        var facetGroup = facet.getAttribute('data-facet-group') || facet.getAttribute('data-facet');
        if (facetGroup !== config.facetName) {
          nonStockCount++;
        }
      });
      
      if (nonStockCount === 0) {
        snackbar.classList.add('clerk-stock-only-snackbar');
      } else {
        snackbar.classList.remove('clerk-stock-only-snackbar');
      }
    },
    
    // Show loading overlay
    showOverlay: function() {
      var existing = document.querySelector('.clerk-stock-loading-overlay');
      if (existing) existing.remove();
      
      var container = document.querySelector('.os-results');
      if (!container) return;
      
      var overlay = document.createElement('div');
      overlay.className = 'clerk-stock-loading-overlay';
      overlay.innerHTML = '<div class="clerk-stock-loading-spinner"></div>';
      container.appendChild(overlay);
      
      // Center spinner
      var spinner = overlay.querySelector('.clerk-stock-loading-spinner');
      var containerRect = container.getBoundingClientRect();
      var viewportHeight = window.innerHeight;
      var visibleTop = Math.max(containerRect.top, 0);
      var visibleBottom = Math.min(containerRect.bottom, viewportHeight);
      var visibleHeight = visibleBottom - visibleTop;
      var centerY = (visibleTop - containerRect.top) + (visibleHeight / 2) - 20;
      var centerX = (containerRect.width / 2) - 20;
      spinner.style.top = Math.max(0, centerY) + 'px';
      spinner.style.left = centerX + 'px';
      
      overlay.offsetHeight;
      overlay.classList.add('active');
    },
    
    // Hide loading overlay
    hideOverlay: function() {
      var overlay = document.querySelector('.clerk-stock-loading-overlay');
      if (overlay) {
        overlay.classList.remove('active');
        setTimeout(function() {
          var ol = document.querySelector('.clerk-stock-loading-overlay');
          if (ol && !ol.classList.contains('active')) {
            ol.remove();
          }
        }, 200);
      }
    }
  };
  
  // Initialize with content ID
  StockToggle.init('#{{ content.id }}');
  
  // Expose globally if needed
  window.ClerkStockToggle = StockToggle;
})();
</script>
