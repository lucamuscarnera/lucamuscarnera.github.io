function whenVisible(id, f) 
{
  const canvas = document.getElementById(id);
  const observerOptions = {
    root: null, // Observe relative to the viewport
    threshold: 0.1, // Trigger when 10% of the canvas is visible
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        f(id); // Trigger your animation
        observer.unobserve(canvas); // Stop observing if you only need it once
      }
    });
  }, observerOptions);

  // Start observing the canvas
  observer.observe(canvas);
}