/**
 * Slide Loader Engine
 * Handles dynamic HTML slide fragment fetching, state management, hash routing,
 * and rendering lifecycle hooks.
 */
window.SlideLoader = {
  totalSlides: 6,
  currentSlide: 1,

  /**
   * Load and mount slide fragment by 1-indexed number.
   * @param {number} index - Slide index (1 to totalSlides)
   */
  async loadSlide(index) {
    if (index < 1 || index > this.totalSlides) return;
    this.currentSlide = index;

    const paddedIndex = String(index).padStart(2, '0');
    const container = document.getElementById('slide-container');
    if (!container) return;

    try {
      const response = await fetch(`slides/slide-${paddedIndex}.html`);
      if (!response.ok) throw new Error(`HTTP ${response.status} - Failed to load slide-${paddedIndex}.html`);
      const htmlContent = await response.text();
      container.innerHTML = htmlContent;
    } catch (err) {
      console.error(err);
      container.innerHTML = `<div class="slide-error">Failed to load slide ${index}. Make sure local live server is running.</div>`;
    }

    this.reRenderDynamic(container);
    this.updateControls();

    if (window.location.hash !== `#slide-${index}`) {
      window.location.hash = `slide-${index}`;
    }
  },

  nextSlide() {
    if (this.currentSlide < this.totalSlides) {
      this.loadSlide(this.currentSlide + 1);
    }
  },

  prevSlide() {
    if (this.currentSlide > 1) {
      this.loadSlide(this.currentSlide - 1);
    }
  },

  updateControls() {
    const counter = document.getElementById('slide-counter-display');
    const dropdown = document.getElementById('slide-select-dropdown');
    if (counter) counter.textContent = `${this.currentSlide} / ${this.totalSlides}`;
    if (dropdown) dropdown.value = this.currentSlide;
  },

  reRenderDynamic(container) {
    // Prism syntax highlighting
    if (window.Prism && container) {
      window.Prism.highlightAllUnder(container);
    }
    // Mermaid diagram rendering
    if (window.mermaid && container) {
      const mermaidNodes = container.querySelectorAll('.mermaid');
      if (mermaidNodes.length > 0) {
        window.mermaid.run({ nodes: mermaidNodes });
      }
    }
    // MathJax formula rendering
    if (window.MathJax?.typesetPromise && container) {
      window.MathJax.typesetPromise([container]);
    }
  }
};
