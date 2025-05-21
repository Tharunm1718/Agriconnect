 // Mobile menu functionality
 const mobileMenu = document.getElementById('mobileMenu');
 const mobileMenuButton = document.getElementById('mobileMenuButton');
 const closeMenu = document.getElementById('closeMenu');
 const mobileMenuContent = mobileMenu.querySelector('div');

 mobileMenuButton.addEventListener('click', () => {
   mobileMenu.classList.remove('hidden');
   mobileMenuContent.style.transform = 'translateX(0)';
   document.body.style.overflow = 'hidden';
 });

 closeMenu.addEventListener('click', () => {
   mobileMenuContent.style.transform = 'translateX(100%)';
   setTimeout(() => {
     mobileMenu.classList.add('hidden');
     document.body.style.overflow = '';
   }, 300);
 });

 // Close mobile menu when clicking outside
 mobileMenu.addEventListener('click', (e) => {
   if (e.target === mobileMenu) {
     mobileMenuContent.style.transform = 'translateX(100%)';
     setTimeout(() => {
       mobileMenu.classList.add('hidden');
       document.body.style.overflow = '';
     }, 300);
   }
 });

 // Scroll to top button functionality
 const scrollTopButton = document.getElementById('scrollTop');

 window.addEventListener('scroll', () => {
   if (window.pageYOffset > 300) {
     scrollTopButton.classList.add('visible');
   } else {
     scrollTopButton.classList.remove('visible');
   }
 });

 scrollTopButton.addEventListener('click', () => {
   window.scrollTo({
     top: 0,
     behavior: 'smooth'
   });
 });

 // Simplified and robust navigation state management
 document.addEventListener('DOMContentLoaded', function() {
   const navLinks = document.querySelectorAll('.nav-link');
   const homeLink = document.querySelector('.home-link');
   const sections = document.querySelectorAll('section[id]');
   
   // Function to update active state
   function updateActiveState(targetId = null) {
     navLinks.forEach(link => {
       const href = link.getAttribute('href');
       const isActive = targetId ? href === targetId : href === window.location.hash;
       
       // Reset all states
       link.classList.remove('active', 'text-white');
       const underline = link.querySelector('span:nth-child(2)');
       const background = link.querySelector('span:nth-child(3)');
       underline.classList.remove('scale-x-100');
       background.classList.remove('opacity-100');
       
       // Set active state
       if (isActive) {
         link.classList.add('active', 'text-white');
         underline.classList.add('scale-x-100');
         background.classList.add('opacity-100');
       }
     });
   }
   
   // Handle click events
   navLinks.forEach(link => {
     link.addEventListener('click', function(e) {
       e.preventDefault();
       const href = this.getAttribute('href');
       
       // Special handling for home link
       if (href === '#') {
         // Reset all states
         navLinks.forEach(l => {
           l.classList.remove('active', 'text-white');
           const u = l.querySelector('span:nth-child(2)');
           const b = l.querySelector('span:nth-child(3)');
           u.classList.remove('scale-x-100');
           b.classList.remove('opacity-100');
         });
         
         // Set home link state
         homeLink.classList.add('active', 'text-white');
         const homeUnderline = homeLink.querySelector('span:nth-child(2)');
         const homeBackground = homeLink.querySelector('span:nth-child(3)');
         homeUnderline.classList.add('scale-x-100');
         homeBackground.classList.add('opacity-100');
         
         // Scroll to top
         window.scrollTo({ top: 0, behavior: 'smooth' });
       } else {
         // Update active state for other links
         updateActiveState(href);
         
         // Smooth scroll to section
         const targetSection = document.querySelector(href);
         if (targetSection) {
           targetSection.scrollIntoView({ behavior: 'smooth' });
         }
       }
       
       // Add ripple effect
       const ripple = document.createElement('span');
       ripple.classList.add('ripple');
       this.appendChild(ripple);
       
       const rect = this.getBoundingClientRect();
       const size = Math.max(rect.width, rect.height);
       
       ripple.style.width = ripple.style.height = `${size}px`;
       ripple.style.left = `${e.clientX - rect.left - size/2}px`;
       ripple.style.top = `${e.clientY - rect.top - size/2}px`;
       
       setTimeout(() => ripple.remove(), 600);
     });
   });
   
   // Handle scroll events
   let scrollTimeout;
   window.addEventListener('scroll', function() {
     clearTimeout(scrollTimeout);
     scrollTimeout = setTimeout(function() {
       let currentSection = '';
       
       sections.forEach(section => {
         const sectionTop = section.offsetTop;
         const sectionHeight = section.clientHeight;
         if (window.pageYOffset >= sectionTop - 200) {
           currentSection = '#' + section.getAttribute('id');
         }
       });
       
       // If we're at the top, activate home link
       if (window.pageYOffset < 100) {
         updateActiveState('#');
       } else {
         updateActiveState(currentSection);
       }
     }, 100);
   });
   
   // Initial state
   updateActiveState();
 });

 // Add styles for navigation
 const navStyles = document.createElement('style');
 navStyles.textContent = `
   .nav-link {
     overflow: hidden;
     position: relative;
   }
   
   .nav-link span:nth-child(2) {
     transition: transform 0.3s ease-in-out;
   }
   
   .nav-link span:nth-child(3) {
     transition: opacity 0.3s ease-in-out;
   }
   
   .nav-link:hover {
     transform: translateY(-1px);
   }
   
   .nav-link:active {
     transform: translateY(1px);
   }
   
   .home-link {
     transition: all 0.3s ease-in-out;
   }
   
   .home-link:hover {
     transform: translateY(-1px);
   }
   
   .home-link:active {
     transform: translateY(1px);
   }
   
   .ripple {
     position: absolute;
     border-radius: 50%;
     background: rgba(255, 255, 255, 0.3);
     transform: scale(0);
     animation: ripple 0.6s linear;
     pointer-events: none;
   }
   
   @keyframes ripple {
     to {
       transform: scale(4);
       opacity: 0;
     }
   }
 `;
 document.head.appendChild(navStyles);