/******************************
  CONFIGURATION
*******************************/
const FACET_CONFIG = {
  boxViewRowsToShow: {{ facet_box_rows }},
  boxViewHeightBuffer: 0,
  showMoreLabel: '{{ facets_show_more_label }}',
  showLessLabel: '{{ facets_hide_label }}',
  showPriceSlider: {{ show_price_slider }}
};

/******************************
  CLERK OMNISEARCH FACETS
*******************************/
class ClerkOmniSearchFacets {
  constructor() {
    this.selectors = {
      facets: '.clerk-facets',
      selected: '.os-facet-selected',
      search: '.clerk-facet-search-wrap',
      range: '.os-facet-range',
      group: '.clerk-facet-group',
      groupTitle: '.clerk-facet-group-title',
      groupWrapper: '.clerk-facet-group-facets',
      mobileToggle: '.os-facet-mobile-toggle',
      facetToggler: '.clerk-facet-show-more-wrapper',
      boxView: '.clerk-facet-box-view'
    };
    this.id = `#{{ content.id }}`;
    this.state = {
      show: false,
      groups: {}
    };
  }

  run = () => {
    this.bindState();
    if (typeof Clerk == 'function') {
      Clerk('on', 'rendered', `${this.id}`, this.bindState);
    }
  };

  bindState = () => {
    const title_els = this.nodes(document, this.selectors.groupTitle);
    for (let i = 0; i < title_els.length; i++) {
      const el = title_els[i];
      const pel = el.parentNode;
      const fcSearch = this.nodes(pel, this.selectors.search, true);
      const fcRange = this.nodes(pel, this.selectors.range, true);
      const fcGroup = this.nodes(pel, this.selectors.groupWrapper, true);
      const facetToggler = this.nodes(pel, this.selectors.facetToggler, true);
      const groupKey = pel?.dataset?.facetGroup;
      const isBoxView = pel.classList.contains('clerk-facet-box-view');

      if (groupKey in this.state.groups && this.state.groups[groupKey]) {
        el.classList.add("clerk-active");
        fcGroup.classList.add("clerk-active");
        if (facetToggler && !isBoxView) {
          facetToggler.classList.add("clerk-active");
        }
        fcGroup.removeAttribute("style");
        if (fcSearch) { fcSearch.style.display = 'inline-block'; }
        if (fcRange) { fcRange.style.display = 'block'; }
        
        if (isBoxView && typeof clerkBoxViewFacets !== 'undefined') {
          clerkBoxViewFacets.calculateAndApply(pel);
        }
      }

      if (groupKey in this.state.groups && !this.state.groups[groupKey]) {
        el.classList.remove("clerk-active");
        fcGroup.classList.remove("clerk-active");
        if (facetToggler) {
          facetToggler.classList.remove("clerk-active");
          if (isBoxView) {
            facetToggler.style.display = 'none';
          }
        }
        if (fcSearch) { fcSearch.style.display = 'none'; }
        if (fcRange) { fcRange.style.display = 'none'; }
      }

      if (!isBoxView) {
        if (fcGroup.clientHeight == 0 && fcGroup.classList.contains('clerk-active')) {
          setTimeout(() => {
            fcGroup.style.height = `100%`;
          }, 200);
        } else {
          fcGroup.style.height = `100%`;
        }
      }

      el.addEventListener('click', this.fold);
    }
  };

  fold = (event) => {
    const el = event.target;
    const pel = event.target.parentNode;
    const groupKey = pel?.dataset?.facetGroup;
    const fcSearch = this.nodes(pel, this.selectors.search, true);
    const fcRange = this.nodes(pel, this.selectors.range, true);
    const fcGroup = this.nodes(pel, this.selectors.groupWrapper, true);
    const facetToggler = this.nodes(pel, this.selectors.facetToggler, true);
    const isBoxView = pel.classList.contains('clerk-facet-box-view');

    if (!fcGroup) {
      return;
    }

    el.classList.toggle('clerk-active');

    if (fcGroup.classList.contains('clerk-active')) {
      // Collapsing
      this.state.groups[groupKey] = false;
      if (fcSearch) { fcSearch.style.display = 'none'; }
      if (fcRange) { fcRange.style.display = 'none'; }

      if (isBoxView) {
        const currentHeight = fcGroup.scrollHeight;
        fcGroup.style.maxHeight = currentHeight + 'px';
        fcGroup.offsetHeight;
        fcGroup.style.maxHeight = '0px';
        
        if (facetToggler) {
          facetToggler.style.display = 'none';
        }
        
        const onTransitionEnd = () => {
          fcGroup.classList.remove('clerk-active');
          fcGroup.removeEventListener('transitionend', onTransitionEnd);
        };
        fcGroup.addEventListener('transitionend', onTransitionEnd);
        setTimeout(() => {
          fcGroup.classList.remove('clerk-active');
        }, 350);
        
      } else {
        fcGroup.style.height = '0px';
        fcGroup.addEventListener('transitionend', () => {
          fcGroup.classList.remove('clerk-active');
          if (facetToggler) {
            facetToggler.classList.remove('clerk-active');
          }
        }, { once: true });
      }
    } else {
      // Expanding
      this.state.groups[groupKey] = true;
      fcGroup.classList.add('clerk-active');
      fcGroup.style.display = '';

      if (fcSearch) { fcSearch.style.display = 'inline-block'; }
      if (fcRange) { fcRange.style.display = 'block'; }

      if (isBoxView) {
        const wasExpanded = fcGroup.dataset.expanded === 'true';
        const collapsedHeight = fcGroup.dataset.collapsedHeight;
        
        if (wasExpanded) {
          fcGroup.style.maxHeight = '0px';
          fcGroup.offsetHeight;
          
          const fullHeight = fcGroup.scrollHeight;
          fcGroup.style.maxHeight = fullHeight + 'px';
          
          fcGroup.addEventListener('transitionend', () => {
            fcGroup.style.maxHeight = 'none';
          }, { once: true });
          
          if (facetToggler) {
            facetToggler.style.display = 'block';
            const showMoreBtn = facetToggler.querySelector('.clerk-facet-show-more');
            if (showMoreBtn) {
              showMoreBtn.textContent = FACET_CONFIG.showLessLabel;
            }
          }
        } else if (collapsedHeight) {
          fcGroup.style.maxHeight = '0px';
          fcGroup.offsetHeight;
          fcGroup.style.maxHeight = collapsedHeight + 'px';
          
          if (facetToggler) {
            const rowCount = parseInt(fcGroup.dataset.rowCount || '0');
            if (rowCount > FACET_CONFIG.boxViewRowsToShow) {
              facetToggler.style.display = 'block';
              const showMoreBtn = facetToggler.querySelector('.clerk-facet-show-more');
              if (showMoreBtn) {
                showMoreBtn.textContent = FACET_CONFIG.showMoreLabel;
              }
            }
          }
        } else {
          fcGroup.style.maxHeight = 'none';
          setTimeout(() => {
            if (typeof clerkBoxViewFacets !== 'undefined') {
              clerkBoxViewFacets.calculateAndApply(pel);
            }
          }, 50);
        }
      } else {
        if (facetToggler) {
          facetToggler.classList.add('clerk-active');
        }
        fcGroup.style.height = 'auto';
        const h = `${fcGroup.clientHeight}px`;
        fcGroup.style.height = '0px';
        setTimeout(() => {
          fcGroup.style.height = h;
        }, 0);
      }
    }
  };

  nodes = (haystack, selector, first = false) => {
    if (!first) {
      return haystack.querySelectorAll(selector);
    }
    return haystack.querySelector(selector);
  };

  toggleMobile = () => {
    const ns = this.nodes(document, this.selectors.facets, true);
    if (!ns) {
      return;
    }
    const st = ns.style.display;
    if (['node', ''].includes(st)) {
      this.state.show = true;
      ns.style.display = 'block';
    } else {
      this.state.show = false;
      ns.style.display = 'none';
    }
  };

  resetGroup = (element, event) => {
    event.preventDefault();
    const els = this.nodes(element.closest(this.selectors.groupWrapper), this.selectors.selected);
    for (let i = 0; i < els.length; i++) {
      els[i].click();
    }
  };
}

/******************************
  BOX VIEW FACETS HANDLER
*******************************/
class ClerkBoxViewFacets {
  constructor(options = {}) {
    this.ROWS_TO_SHOW = options.rowsToShow || 2;
    this.HEIGHT_BUFFER = options.heightBuffer || 0;
    this.ROW_HEIGHT_BUFFER = 4;
    this.selectors = {
      boxView: '.clerk-facet-box-view',
      facetsContainer: '.clerk-facet-group-facets',
      facetItem: '.clerk-facet',
      showMoreWrapper: '.clerk-facet-show-more-wrapper',
      showMoreBtn: '.clerk-facet-show-more'
    };
    this.showMoreText = options.showMoreLabel || 'Show more';
    this.showLessText = options.showLessLabel || 'Show less';
    this.resizeTimeout = null;
  }

  init() {
    if (typeof Clerk === 'function') {
      Clerk('on', 'rendered', () => {
        setTimeout(() => this.setupBoxViews(), 100);
      });
    }
    setTimeout(() => this.setupBoxViews(), 100);

    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.recalculateAll();
      }, 250);
    });
  }

  recalculateAll() {
    const boxViews = document.querySelectorAll(this.selectors.boxView);
    boxViews.forEach(boxView => {
      const container = boxView.querySelector(this.selectors.facetsContainer);
      if (container && container.classList.contains('clerk-active')) {
        const wasExpanded = container.dataset.expanded === 'true';
        this.calculateAndApply(boxView);
        if (wasExpanded) {
          container.style.maxHeight = 'none';
          container.dataset.expanded = 'true';
          const showMoreBtn = boxView.querySelector(this.selectors.showMoreBtn);
          if (showMoreBtn) showMoreBtn.textContent = this.showLessText;
        }
      }
    });
  }

  setupBoxViews() {
    const boxViews = document.querySelectorAll(this.selectors.boxView);
    boxViews.forEach(boxView => this.setupSingleBoxView(boxView));
  }

  setupSingleBoxView(boxView) {
    const container = boxView.querySelector(this.selectors.facetsContainer);
    if (!container || !container.classList.contains('clerk-active')) return;

    requestAnimationFrame(() => {
      this.calculateAndApply(boxView);
    });
  }

  calculateAndApply(boxView) {
    const container = boxView.querySelector(this.selectors.facetsContainer);
    const showMoreWrapper = boxView.querySelector(this.selectors.showMoreWrapper);
    const items = container?.querySelectorAll(this.selectors.facetItem);

    if (!container || !items || items.length === 0) return;
    if (!container.classList.contains('clerk-active')) return;

    container.style.maxHeight = 'none';
    container.style.overflow = 'visible';
    container.offsetHeight;

    const itemPositions = [];
    items.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      itemPositions.push({
        index,
        top: rect.top,
        bottom: rect.bottom,
        height: item.offsetHeight
      });
    });

    const rows = [];
    let currentRowTop = null;
    let currentRowItems = [];

    itemPositions.forEach((pos) => {
      if (currentRowTop === null || Math.abs(pos.top - currentRowTop) > this.ROW_HEIGHT_BUFFER) {
        if (currentRowItems.length > 0) {
          rows.push(currentRowItems);
        }
        currentRowTop = pos.top;
        currentRowItems = [pos];
      } else {
        currentRowItems.push(pos);
      }
    });
    if (currentRowItems.length > 0) {
      rows.push(currentRowItems);
    }

    const rowCount = rows.length;

    let collapsedHeight;
    if (rows.length >= this.ROWS_TO_SHOW) {
      const lastVisibleRow = rows[this.ROWS_TO_SHOW - 1];
      const containerTop = container.getBoundingClientRect().top;
      
      let maxBottom = 0;
      lastVisibleRow.forEach(item => {
        if (item.bottom > maxBottom) maxBottom = item.bottom;
      });
      
      collapsedHeight = (maxBottom - containerTop) + this.HEIGHT_BUFFER;
    } else {
      collapsedHeight = container.scrollHeight;
    }

    container.dataset.collapsedHeight = collapsedHeight;
    container.dataset.rowCount = rowCount;
    container.dataset.expanded = 'false';

    container.style.maxHeight = collapsedHeight + 'px';
    container.style.overflow = 'hidden';

    if (showMoreWrapper) {
      const oldBtn = showMoreWrapper.querySelector(this.selectors.showMoreBtn);
      if (oldBtn) {
        const newBtn = oldBtn.cloneNode(true);
        oldBtn.parentNode.replaceChild(newBtn, oldBtn);
      }

      if (rowCount > this.ROWS_TO_SHOW) {
        showMoreWrapper.style.display = 'block';
        const showMoreBtn = showMoreWrapper.querySelector(this.selectors.showMoreBtn);
        if (showMoreBtn) {
          showMoreBtn.textContent = this.showMoreText;
          showMoreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleExpand(boxView);
          });
        }
      } else {
        showMoreWrapper.style.display = 'none';
      }
    }
  }

  toggleExpand(boxView) {
    const container = boxView.querySelector(this.selectors.facetsContainer);
    const showMoreBtn = boxView.querySelector(this.selectors.showMoreBtn);

    if (!container) return;

    const isExpanded = container.dataset.expanded === 'true';
    const collapsedHeight = container.dataset.collapsedHeight;

    if (isExpanded) {
      container.style.maxHeight = collapsedHeight + 'px';
      container.dataset.expanded = 'false';
      if (showMoreBtn) showMoreBtn.textContent = this.showMoreText;
    } else {
      container.style.maxHeight = 'none';
      container.dataset.expanded = 'true';
      if (showMoreBtn) showMoreBtn.textContent = this.showLessText;
    }
  }
}

/******************************
  INITIALIZE
*******************************/
const clerkFacetsWrapper = new ClerkOmniSearchFacets();
clerkFacetsWrapper.run();

const clerkBoxViewFacets = new ClerkBoxViewFacets({
  rowsToShow: FACET_CONFIG.boxViewRowsToShow,
  heightBuffer: FACET_CONFIG.boxViewHeightBuffer,
  showMoreLabel: FACET_CONFIG.showMoreLabel,
  showLessLabel: FACET_CONFIG.showLessLabel
});
clerkBoxViewFacets.init();
