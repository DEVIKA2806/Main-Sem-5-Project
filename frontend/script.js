// Function to safely get an element and prevent errors if it doesn't exist
const safeGetElement = (id) => document.getElementById(id);

// *****************************************************************
// 1. GLOBAL FUNCTIONS (MUST BE AT THE VERY TOP)
// *****************************************************************

// --- LOGIN/LOGOUT/MODAL FUNCTIONS ---

function openLogin() {
    const loginModal = safeGetElement('loginModal');
    if (!loginModal) return;

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const loginCard = loginModal.querySelector('.login-card');

    if (token && user) {
        // User is logged in: Show Log Out option
        loginCard.innerHTML = `
            <h3>Welcome Back, ${user.name}!</h3>
            <button onclick="logout()">Log Out</button>
            <button class="close-btn" onclick="closeLogin()">Close</button>
        `;
    } else {
        // User is logged out: Restore LOGIN and SIGN IN form
        loginCard.innerHTML = `
            <h3>Login</h3>
            <input type="email" id="modalUsername" placeholder="Email" />
            <input type="password" id="modalPassword" placeholder="Password" />
            <div id="modalError" class="error"></div>
            <button onclick="validateModalLogin()">Login</button>
            <button class="sign-in-btn" onclick="window.location.href='register.html'; closeLogin()">Sign In</button>
            <button class="close-btn" onclick="closeLogin()">Close</button>
        `;
    }
    
    loginModal.style.display = 'flex';
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

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload(); 
}

function validateModalLogin() {
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

// --- RESELL/SELLER FUNCTIONS ---

function openResell() {
    const resellModal = safeGetElement('resellModal');
    if (resellModal) resellModal.style.display = 'flex';
}

function closeResell() {
    const resellModal = safeGetElement('resellModal');
    const resellMsg = safeGetElement('resellMsg');
    const resellForm = safeGetElement('resellForm');
    
    if (resellModal) resellModal.style.display = 'none';
    if (resellMsg) resellMsg.textContent = '';
    if (resellForm) resellForm.reset();
}

function openSeller() {
    const sellerModal = safeGetElement('sellerModal');
    if (sellerModal) sellerModal.style.display = 'flex';
}

function closeSeller() {
    const sellerModal = safeGetElement('sellerModal');
    const sellerMsg = safeGetElement('sellerMsg');
    const sellerForm = safeGetElement('sellerForm');
    
    if (sellerModal) sellerModal.style.display = 'none';
    if (sellerMsg) sellerMsg.textContent = '';
    if (sellerForm) sellerForm.reset();
}

// --- CONTACT FUNCTION ---

function closeContact() {
    const contactMsg = safeGetElement('contactMsg');
    const contactForm = safeGetElement('contactForm');
    
    if (contactMsg) contactMsg.textContent = '';
    if (contactForm) contactForm.reset();
    
    window.location.href = "/index.html"; 
}

// --- DYNAMIC NAV BUTTON RENDERING ---
function renderNavButton() {
    const container = safeGetElement('navLoginContainer');
    if (!container) return;

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (token && user) {
        // Logged In: Show user icon (if you want text, you need to adjust CSS)
        container.innerHTML = `
            <button class="login logged-in" onclick="openLogin()">
                <i class="fa-solid fa-user"></i>
            </button>
        `;
    } else {
        // Logged Out: Show original Login icon
        container.innerHTML = `
            <button class="login" onclick="openLogin()">
                <i class="fa-solid fa-user"></i>
            </button>
        `;
    }
}


// *****************************************************************
// 2. EVENT LISTENERS AND PAGE LOGIC 
// *****************************************************************

// Run the dynamic button logic on page load
window.addEventListener('load', renderNavButton);


// -------------------- REDIRECT TO SHOP PAGE --------------------
const shopNowBtn = safeGetElement("shop-now");
if (shopNowBtn) {
    shopNowBtn.addEventListener("click", function() {
        window.location.href = "/shop-now.html";
    });
}


// -------------------- CONTACT FORM SUBMISSION --------------------
const contactForm = safeGetElement('contactForm'); 
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const name = safeGetElement('name')?.value.trim();
        const email = safeGetElement('email')?.value.trim();
        const phone = safeGetElement('phone')?.value.trim() || ''; 
        const message = safeGetElement('message')?.value.trim();
        const contactMsg = safeGetElement('contactMsg');

        if (!name || !email || !message) {
            if (contactMsg) {
                contactMsg.style.color = "red";
                contactMsg.textContent = "Please fill in all required fields.";
            }
            return;
        }

        fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, message }) 
        })
        .then(res => res.json())
        .then(data => {
            if (contactMsg) {
                contactMsg.style.color = 'green';
                contactMsg.textContent = 'Thank you for contacting us!';
            }
            contactForm.reset(); 
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

// -------------------- REGISTRATION PAGE LOGIC --------------------
const registerForm = safeGetElement('registerForm');

if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Get and compare passwords (from regPassword1 and regPassword2 in register.html)
        const name = safeGetElement('regName')?.value.trim();
        const email = safeGetElement('regEmail')?.value.trim();
        const password = safeGetElement('regPassword1')?.value.trim();
        const confirmPassword = safeGetElement('regPassword2')?.value.trim();
        const errorMsg = safeGetElement('regError');

        if (password !== confirmPassword) {
             if (errorMsg) {
                errorMsg.style.color = "red";
                errorMsg.textContent = "Passwords do not match!";
            }
            return;
        }
        
        if (!name || !email || !password) {
            if (errorMsg) {
                errorMsg.style.color = "red";
                errorMsg.textContent = "All fields are required.";
            }
            return;
        }

        fetch('/api/auth/register', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }) 
        })
        .then(res => res.json())
        .then(data => {
            if (data.token) {
                errorMsg.style.color = "green";
                errorMsg.textContent = "Registration successful! Redirecting to home...";
                
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 1500);

            } else {
                errorMsg.style.color = "red";
                errorMsg.textContent = data.message === 'User already exists' 
                    ? "User already exists. Try logging in." 
                    : data.message || "Registration failed.";
            }
        })
        .catch(err => {
            console.error(err);
            errorMsg.textContent = "Server error during Sign Up. Please try again.";
        });
    });
}


// -------------------- SELLER MODAL SUBMISSION --------------------
// -------------------- SELLER MODAL SUBMISSION (MERN INTEGRATED) --------------------
const sellerForm = safeGetElement('sellerForm');
if (sellerForm) { 
    sellerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = safeGetElement('sellerName')?.value.trim();
        const email = safeGetElement('sellerEmail')?.value.trim();
        const phone = safeGetElement('sellerPhone')?.value.trim();
        const business = safeGetElement('sellerBusiness')?.value.trim();
        const products = safeGetElement('sellerProducts')?.value.trim();
        const sellerMsg = safeGetElement('sellerMsg');

        // 1. Client-Side Validation
        if (!name || !email || !phone || !business || !products) {
            if (sellerMsg) { sellerMsg.style.color = "red"; sellerMsg.textContent = "Please fill in all fields."; }
            return;
        }

        if (sellerMsg) { 
            sellerMsg.style.color = "orange"; 
            sellerMsg.textContent = "Submitting application to server..."; 
        }

        // --- MERN Backend Fetch Call: /api/seller/register ---
        fetch('/api/seller/register', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, business, products })
        })
        .then(res => res.json())
        .then(data => {
            if (data.seller && data.seller._id) {
                // SUCCESS: Registration saved to MongoDB
                if (sellerMsg) { 
                    sellerMsg.style.color = "green"; 
                    sellerMsg.textContent = "Success! Redirecting to your dashboard..."; 
                }
                
                // CRUCIAL STEP 1: Save the Seller ID returned by the backend
                localStorage.setItem('currentSellerId', data.seller._id); 

                setTimeout(() => { 
                    closeSeller();
                    // CRUCIAL STEP 2: Redirect to the product creation page
                    window.location.href = 'seller-dashboard.html'; 
                }, 1500);
            } else {
                if (sellerMsg) {
                    sellerMsg.style.color = "red";
                        
                    // Check for the specific email conflict error from the backend
                    if (data.message && data.message.includes('already registered')) {
                        sellerMsg.innerHTML = `
                            ${data.message}<br><br>
                            <button class="btn-seller-login" onclick="closeSeller(); openLogin();">
                                Click here to Login
                            </button>`;
                    } else {
                        // Generic failure message
                        sellerMsg.textContent = data.message || "Registration failed. Please try again.";
                    }
                }
            }
        })
        .catch(err => {
            console.error('Seller registration fetch error:', err);
            if (sellerMsg) { sellerMsg.style.color = "red"; sellerMsg.textContent = "Network error. Server unreachable."; }
        });
        
        this.reset();
    });
}


// -------------------- RE-SELL MODAL SUBMISSION --------------------
const resellForm = safeGetElement('resellForm');
if (resellForm) { 
    resellForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = safeGetElement('resellName')?.value.trim();
        const email = safeGetElement('resellEmail')?.value.trim();
        const phone = safeGetElement('resellPhone')?.value.trim();
        const business = safeGetElement('resellBusiness')?.value.trim();
        const products = safeGetElement('resellProducts')?.value.trim();
        const resellMsg = safeGetElement('resellMsg');

        if (!name || !email || !phone || !business || !products) {
            if (resellMsg) { resellMsg.style.color = "red"; resellMsg.textContent = "Please fill in all fields."; }
            return;
        }

        if (resellMsg) { resellMsg.style.color = "green"; resellMsg.textContent = "Thank you for registering as a re-seller!"; }
        this.reset();
        setTimeout(() => { closeResell(); }, 2000);
    });
}


// -------------------- NEWSLETTER SUBMISSION --------------------
const newsletterForm = safeGetElement("newsletterForm");
if (newsletterForm) {
    newsletterForm.addEventListener("submit", function(e) {
        e.preventDefault();

        const emailInput = this.querySelector("input[type='email']");
        const newsletterMsg = safeGetElement("newsletterMsg");

        if (!emailInput.value.trim()) {
            if (newsletterMsg) { newsletterMsg.style.color = "red"; newsletterMsg.textContent = "Please enter your email."; }
            return;
        }

        const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
        if (!emailInput.value.match(emailPattern)) {
            if (newsletterMsg) { newsletterMsg.style.color = "red"; newsletterMsg.textContent = "Please enter a valid email."; }
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
document.querySelectorAll('a[href^="#about-section"]').forEach(anchor => {
    anchor.addEventListener("click", function(e) {
        e.preventDefault();
        const targetElement = document.querySelector(this.getAttribute("href"));
        if (targetElement) { 
            targetElement.scrollIntoView({
                behavior: "smooth"
            });
        }
    });
});


// --- In your main script.js file (at the bottom) ---

// -------------------- SAREE PAGE LOGIC (Moved from saree.js) --------------------

// Toggle sidebar filters (for mobile)
document.addEventListener("DOMContentLoaded", () => {
    // Check if the container exists (i.e., if we are on the saree.html page)
    const container = document.querySelector(".container-fluid .row");
    if (!container) return; // Exit if not on the product page

    const filterBtn = document.createElement("button");
    filterBtn.classList.add("filter-toggle");
    filterBtn.innerText = "Toggle Filters";

    const sidebar = container.querySelector("aside");

    if (sidebar) { // Check if sidebar exists
        // Insert filter button before sidebar
        sidebar.parentNode.insertBefore(filterBtn, sidebar);

        filterBtn.addEventListener("click", () => {
            sidebar.classList.toggle("active");
        });
    }
});

// Simple search filter
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.querySelector(".shop-search input");
    const productCards = document.querySelectorAll(".card");

    if (searchInput) { // Check if search bar exists (i.e., if we are on the shop page)
        searchInput.addEventListener("input", () => {
            const query = searchInput.value.toLowerCase();
            productCards.forEach(card => {
                const titleElement = card.querySelector(".card-title");
                if (!titleElement) return;

                const title = titleElement.innerText.toLowerCase();
                if (title.includes(query)) {
                    card.parentElement.style.display = "block";
                } else {
                    card.parentElement.style.display = "none";
                }
            });
        });
    }
});
