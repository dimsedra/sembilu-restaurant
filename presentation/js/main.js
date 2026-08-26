/**
 * Presentation Main Controller
 * Handles user interactions, keyboard shortcuts, hash synchronization, and fullscreen.
 */
document.addEventListener('DOMContentLoaded', () => {
  const loader = window.SlideLoader;
  if (!loader) {
    console.error('SlideLoader not found.');
    return;
  }

  const dropdown = document.getElementById('slide-select-dropdown');
  const slideTitles = [
    '01. Hero — Kuliner Warisan Jawa & Tech',
    '02. Bottlenecks vs. Sembilu Architecture',
    '03. End-to-End Operating Engine',
    '04. Unit Economics & Operational Moats',
    '05. Strategic Expansion Roadmap',
    '06. Investment CTA & Capital Allocation'
  ];

  // Populate dropdown options
  if (dropdown) {
    dropdown.innerHTML = '';
    for (let i = 1; i <= loader.totalSlides; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = slideTitles[i - 1] || `Slide ${i}`;
      dropdown.appendChild(option);
    }

    dropdown.addEventListener('change', (e) => {
      loader.loadSlide(parseInt(e.target.value, 10));
    });
  }

  // Button Listeners
  document.getElementById('btn-prev')?.addEventListener('click', () => loader.prevSlide());
  document.getElementById('btn-next')?.addEventListener('click', () => loader.nextSlide());
  document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
    window.open('export_pdf.html', '_blank');
  });

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  document.getElementById('btn-fullscreen')?.addEventListener('click', toggleFullscreen);

  // Keyboard Navigation
  document.addEventListener('keydown', (e) => {
    // Ignore keystrokes in form inputs
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

    switch (e.key) {
      case 'ArrowRight':
      case 'PageDown':
      case ' ':
        e.preventDefault();
        loader.nextSlide();
        break;
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault();
        loader.prevSlide();
        break;
      case 'Home':
        e.preventDefault();
        loader.loadSlide(1);
        break;
      case 'End':
        e.preventDefault();
        loader.loadSlide(loader.totalSlides);
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        toggleFullscreen();
        break;
    }
  });

  // Handle Browser Back / Forward hash navigation
  window.addEventListener('hashchange', () => {
    const hashMatch = window.location.hash.match(/slide-(\d+)/);
    if (hashMatch) {
      const targetIndex = parseInt(hashMatch[1], 10);
      if (targetIndex !== loader.currentSlide && targetIndex >= 1 && targetIndex <= loader.totalSlides) {
        loader.loadSlide(targetIndex);
      }
    }
  });

  // Read initial hash or default to slide 1
  const hashMatch = window.location.hash.match(/slide-(\d+)/);
  const initialSlide = hashMatch ? parseInt(hashMatch[1], 10) : 1;
  loader.loadSlide(initialSlide);
});
