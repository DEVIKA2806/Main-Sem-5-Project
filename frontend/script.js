// Function to safely get an element and prevent errors if it doesn't exist
const safeGetElement = (id) => document.getElementById(id);

// -------------------- REDIRECT TO SHOP PAGE FIX --------------------
// This was causing the initial crash on non-index pages.
const shopNowBtn = safeGetElement("shop-now");
if (shopNowBtn) {
    shopNowBtn.addEventListener("click", function() {
        window.location.href = "/shop-now.html";
    });
}


// -------------------- LOGIN MODAL --------------------
function openLogin() {
    const loginModal = safeGetElement('loginModal');
    if (loginModal) loginModal.style.display = 'flex';
}

function closeLogin() {
    const loginModal = safeGetElement('loginModal');
    if (loginModal) loginModal.style.display = 'none';

    // Clear fields only if they exist on the page
    const errorMsg = safeGetElement('modalError');
    const username = safeGetElement('modalUsername');
    const password = safeGetElement('modalPassword');

    if (errorMsg) errorMsg.textContent = '';
    if (username) username.value = '';
    if (password) password.value = '';
}

function validateModalLogin() {
    // Only proceed if elements exist (e.g., if we are on index.html)
    const emailInput = safeGetElement('modalUsername');
    const passwordInput = safeGetElement('modalPassword');
    const errorMsg = safeGetElement('modalError');

    if (!emailInput || !passwordInput || !errorMsg) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        errorMsg.style.color = "red";
        errorMsg.textContent = "Please enter both email and password.";
        return;
    }

    // Make API call
    fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.token) {
            errorMsg.style.color = "green";
            errorMsg.textContent = "Login successful!";

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            closeLogin();
            window.location.reload(); 
        } else {
            errorMsg.style.color = "red";
            errorMsg.textContent = data.message || "Invalid credentials";
        }
    })
    .catch(err => {
        console.error(err);
        errorMsg.style.color = "red";
        errorMsg.textContent = "Server error, try again later.";
    });
}


// -------------------- CONTACT MODAL --------------------

// Function to handle closing the Contact page and redirecting to the index page.
function closeContact() {
    const contactMsg = safeGetElement('contactMsg');
    const contactForm = safeGetElement('contactForm');
    
    if (contactMsg) contactMsg.textContent = '';
    if (contactForm) contactForm.reset();
    
    // Assuming contact.html is a standalone page, redirecting to index.html is the goal.
    window.location.href = "/index.html"; 
}

const contactForm = safeGetElement('contactForm'); // <-- Element is safely retrieved here

// Check if the form exists before trying to add a listener!
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Safely get elements within the form listener
        const name = safeGetElement('name')?.value.trim();
        const email = safeGetElement('email')?.value.trim();
        const phone = safeGetElement('phone')?.value.trim() || ''; // Added safe access and default
        const message = safeGetElement('message')?.value.trim();
        const contactMsg = safeGetElement('contactMsg');

        if (!name || !email || !message) {
            if (contactMsg) {
                contactMsg.style.color = "red";
                contactMsg.textContent = "Please fill in all fields.";
            }
            return;
        }

        // POST data to backend
        fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // If phone doesn't exist on the page, it will send an empty string
            body: JSON.stringify({ name, email, phone, message }) 
        })
        .then(res => res.json())
        .then(data => {
            if (contactMsg) {
                contactMsg.style.color = 'green';
                contactMsg.textContent = 'Thank you for contacting us!';
            }
            contactForm.reset(); // reset form after submission
        })
        .catch(err => {
            console.error(err);
            if (contactMsg) {
                contactMsg.style.color = 'red';
                contactMsg.textContent = 'Something went wrong. Please try again.';
            }
        });
    });
}


// -------------------- DROPDOWN --------------------
// This uses querySelectorAll, which won't crash if nothing is found, so it's okay.
function toggleDropdown(event) {
    event.preventDefault();
    const parent = event.target.closest(".dropdown");

    document.querySelectorAll(".dropdown").forEach(d => {
        if (d !== parent) d.classList.remove("open");
    });

    if (parent) parent.classList.toggle("open"); // Added check
}

document.addEventListener("click", function(e) {
    if (!e.target.closest(".dropdown")) {
        document.querySelectorAll(".dropdown").forEach(d => d.classList.remove("open"));
    }
});


// -------------------- SELLER MODAL --------------------
const sellerForm = safeGetElement('sellerForm');

function openSeller() {
    const sellerModal = safeGetElement('sellerModal');
    if (sellerModal) sellerModal.style.display = 'flex';
}

function closeSeller() {
    const sellerModal = safeGetElement('sellerModal');
    const sellerMsg = safeGetElement('sellerMsg');
    
    if (sellerModal) sellerModal.style.display = 'none';
    if (sellerMsg) sellerMsg.textContent = '';
    if (sellerForm) sellerForm.reset();
}

if (sellerForm) { // Check if the form element exists
    sellerForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const name = safeGetElement('sellerName')?.value.trim();
        const email = safeGetElement('sellerEmail')?.value.trim();
        const phone = safeGetElement('sellerPhone')?.value.trim();
        const business = safeGetElement('sellerBusiness')?.value.trim();
        const products = safeGetElement('sellerProducts')?.value.trim();
        const sellerMsg = safeGetElement('sellerMsg');

        if (!name || !email || !phone || !business || !products) {
            if (sellerMsg) {
                sellerMsg.style.color = "red";
                sellerMsg.textContent = "Please fill in all fields.";
            }
            return;
        }

        if (sellerMsg) {
            sellerMsg.style.color = "green";
            sellerMsg.textContent = "Thank you for registering as a seller!";
        }
        this.reset();

        // Auto-close modal after 2 seconds
        setTimeout(() => {
            closeSeller();
        }, 2000);
    });
}


// -------------------- RE-SELL MODAL --------------------
const resellForm = safeGetElement('resellForm');

function openResell() {
    const resellModal = safeGetElement('resellModal');
    if (resellModal) resellModal.style.display = 'flex';
}

function closeResell() {
    const resellModal = safeGetElement('resellModal');
    const resellMsg = safeGetElement('resellMsg');
    
    if (resellModal) resellModal.style.display = 'none';
    if (resellMsg) resellMsg.textContent = '';
    if (resellForm) resellForm.reset();
}

if (resellForm) { // Check if the form element exists
    resellForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const name = safeGetElement('resellName')?.value.trim();
        const email = safeGetElement('resellEmail')?.value.trim();
        const phone = safeGetElement('resellPhone')?.value.trim();
        const business = safeGetElement('resellBusiness')?.value.trim();
        const products = safeGetElement('resellProducts')?.value.trim();
        const resellMsg = safeGetElement('resellMsg');

        if (!name || !email || !phone || !business || !products) {
            if (resellMsg) {
                resellMsg.style.color = "red";
                resellMsg.textContent = "Please fill in all fields.";
            }
            return;
        }

        if (resellMsg) {
            resellMsg.style.color = "green";
            resellMsg.textContent = "Thank you for registering as a re-seller!";
        }
        this.reset();

        // Auto-close modal after 2 seconds
        setTimeout(() => {
            closeResell();
        }, 2000);
    });
}


// -------------------- NEWSLETTER --------------------
const newsletterForm = safeGetElement("newsletterForm");

if (newsletterForm) {
    newsletterForm.addEventListener("submit", function(e) {
        e.preventDefault();

        const emailInput = this.querySelector("input[type='email']");
        const newsletterMsg = safeGetElement("newsletterMsg");

        if (!emailInput.value.trim()) {
            if (newsletterMsg) {
                newsletterMsg.style.color = "red";
                newsletterMsg.textContent = "Please enter your email.";
            }
            return;
        }

        const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
        if (!emailInput.value.match(emailPattern)) {
            if (newsletterMsg) {
                newsletterMsg.style.color = "red";
                newsletterMsg.textContent = "Please enter a valid email.";
            }
            return;
        }

        if (newsletterMsg) {
            newsletterMsg.style.color = "lightgreen";
            newsletterMsg.textContent = "Thank you for subscribing!";
        }
        emailInput.value = "";
    });
}

// -------------------- SMOOTH SCROLL --------------------
// Uses querySelectorAll, which won't crash if nothing is found, so it's okay.
document.querySelectorAll('a[href^="#about-section"]').forEach(anchor => {
    anchor.addEventListener("click", function(e) {
        e.preventDefault();
        const targetElement = document.querySelector(this.getAttribute("href"));
        if (targetElement) { // Added safety check
            targetElement.scrollIntoView({
                behavior: "smooth"
            });
        }
    });
});