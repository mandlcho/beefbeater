const sections = document.querySelectorAll('section');
const options = { threshold: 0.2 };

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      document.body.dataset.section = entry.target.id;
    }
  });
}, options);

sections.forEach((section) => observer.observe(section));

console.info('BeefBeater site ready. Active section tracking enabled.');