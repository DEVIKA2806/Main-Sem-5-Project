const safeGetElement = (id) => document.getElementById(id);
const BACKEND_URL = ''; 

// *****************************************************************
// 1. GLOBAL STATE AND HELPER FUNCTIONS
// *****************************************************************
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Helper to retrieve user data safely and set default role (Fixes 'role: undefined' issue on page reload)
function getLoggedInUser() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    if (token && user && !user.role) {
        // Assume 'user' role if a token exists but role is missing (for legacy accounts)
        user.role = 'user';
    }
    
    return user;
}


function updateCartCount() {
    const countElement = safeGetElement('cart-count');
    if (countElement) {
        countElement.textContent = cart.length;
    }
}

function addToCart(productId, title, price, imageUrl) {
    const user = getLoggedInUser(); 
    
    if (!user || user.role !== 'user') { // Restrict cart to standard users
        alert('You must be logged in as a standard customer to add items to the cart.');
        openLogin();
        return;
    }

    const itemIndex = cart.findIndex(item => item.productId === productId);
    const numericPrice = parseFloat(price);

    if (itemIndex > -1) {
        cart[itemIndex].qty += 1;
    } else {
        cart.push({ 
            productId, 
            title, 
            price: numericPrice,
            qty: 1, 
            imageUrl 
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    alert(`Added ${title} to cart! Total unique items: ${cart.length}`);
}

function renderCartModal() {
    const cartModal = safeGetElement('cartModal');
    if (!cartModal) return; 

    const cartContent = cart.map(item => `
        <div class="cart-item">
            <p class="cart-item-title">${item.title} (${item.qty} x ₹${item.price.toFixed(2)})</p>
            <p class="cart-item-price">₹${(item.qty * item.price).toFixed(2)}</p>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    cartModal.querySelector('.modal-card').innerHTML = `
        <h2>Your Cart</h2>
        <div class="cart-items-list">
            ${cart.length > 0 ? cartContent : '<p style="text-align: center; color: #6C757D;">Your cart is empty.</p>'}
        </div>
        <div class="cart-total">
            <strong>Total:</strong> ₹${total.toFixed(2)}
        </div>
        ${cart.length > 0 ? '<button onclick="alert(\'This feature is a future goal! Thank you for testing.\')">Proceed to Checkout</button>' : ''}
        <button class="close-btn" onclick="closeCart()">Close</button>
    `;
    cartModal.style.display = 'flex';
}

function closeCart() {
    const cartModal = safeGetElement('cartModal');
    if (cartModal) cartModal.style.display = 'none';
}

// *****************************************************************
// 2. AUTH & MODAL FUNCTIONS
// *****************************************************************

// --- USER LOGIN/LOGOUT ---

function openLogin() {
    const loginModal = safeGetElement('loginModal');
    if (!loginModal) return;

    const user = getLoggedInUser(); 
    const loginCard = loginModal.querySelector('.login-card');
    
    if (user) {
        loginCard.innerHTML = `
            <h3>Welcome Back, ${user.name}!</h3>
            <p>Role: ${user.role}</p>
            ${(user.role === 'seller' || user.role === 'admin') ? 
                '<button onclick="window.location.href=\'seller-dashboard.html\'">Go to Dashboard</button>' : ''}
            <button onclick="logout()">Log Out</button>
            <button class="close-btn" onclick="closeLogin()">Close</button>
        `;
    } else {
        loginCard.innerHTML = `
            <h3>User Login</h3>
            <input type="email" id="modalUsername" placeholder="Email" />
            <input type="password" id="modalPassword" placeholder="Password" />
            <div id="modalError" class="error"></div>
            <button onclick="validateModalLogin()">Login</button>
            
            <button class="sign-in-btn" onclick="window.location.href='register.html'; closeLogin()">Sign Up</button>
            <button type="button" class="close-btn" onclick="closeLogin()">Close</button>
        `;
    }
    
    loginModal.style.display = 'flex';
}

function closeLogin() {
    const loginModal = safeGetElement('loginModal');
    if (loginModal) loginModal.style.display = 'none';
    const errorMsg = safeGetElement('modalError');
    if (errorMsg) errorMsg.textContent = '';
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentSellerId'); 
    localStorage.removeItem('cart');
    cart = [];
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

    errorMsg.textContent = 'Logging in...';
    errorMsg.style.color = 'orange';
    
    fetch(BACKEND_URL + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.token && data.user.role === 'user') {
            errorMsg.style.color = "green";
            errorMsg.textContent = "Login successful!";

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            closeLogin();
            window.location.reload(); 
        } 
        // FIX: Provide explicit message for role/portal mismatch instead of generic "Invalid credentials"
        else if (data.message && data.message.includes('incorrect login portal')) {
            errorMsg.style.color = "red";
            errorMsg.textContent = "This account is registered as a Seller/Admin. Please use the 'Join as Seller' link and choose 'Already a Seller? Log In'.";
        }
        else {
            errorMsg.style.color = "red";
            errorMsg.textContent = data.message || "Invalid credentials. Please check your email and password.";
        }
    })
    .catch(err => {
        console.error(err);
        errorMsg.style.color = "red";
        errorMsg.textContent = "Server error, try again later.";
    });
}


// --- SELLER LOGIN/REGISTRATION ---

function openSellerLogin() {
    const sellerModal = safeGetElement('sellerModal');
    const modalCard = sellerModal.querySelector('.modal-card');
    
    modalCard.innerHTML = `
        <h2>Seller Login</h2>
        <div id="sellerLoginFormContainer">
            <input type="email" id="sellerLoginEmail" placeholder="Email" required>
            <input type="password" id="sellerLoginPassword" placeholder="Password" required>
            <div id="sellerLoginError" class="error"></div>
            
            <button onclick="validateSellerLogin()">Login</button>
            
            <button type="button" class="btn-seller-shortcut" onclick="closeSeller(); openSeller();">
                Need to Register?
            </button>
        </div>
        <button type="button" class="close-btn" onclick="closeSeller()">Close</button>
    `;
    sellerModal.style.display = 'flex';
}

function validateSellerLogin() {
    const emailInput = safeGetElement('sellerLoginEmail');
    const passwordInput = safeGetElement('sellerLoginPassword');
    const errorMsg = safeGetElement('sellerLoginError');

    if (!emailInput || !passwordInput || !errorMsg) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    errorMsg.textContent = 'Logging in...';
    errorMsg.style.color = 'orange';

    fetch(BACKEND_URL + '/api/auth/seller-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.token) {
            errorMsg.style.color = "green";
            errorMsg.textContent = "Login successful! Redirecting to dashboard...";

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            if (data.user.sellerId) {
                localStorage.setItem('currentSellerId', data.user.sellerId);
            }

            setTimeout(() => {
                window.location.href = 'seller-dashboard.html'; 
            }, 500);

        } else if (data.message && data.message.includes('Seller access pending review')) {
             errorMsg.style.color = 'red';
             errorMsg.textContent = data.message;
        } else {
            errorMsg.style.color = "red";
            errorMsg.textContent = data.message || "Invalid credentials or login failed.";
        }
    })
    .catch(err => {
        console.error('Seller login error:', err);
        errorMsg.style.color = "red";
        errorMsg.textContent = "Network error. Could not reach server.";
    });
}

function openSeller() {
    const sellerModal = safeGetElement('sellerModal');
    if (!sellerModal) return;

    const user = getLoggedInUser(); 
    const modalCard = sellerModal.querySelector('.modal-card');
    
    const registrationFormHtml = `
        <h2>Join as Seller</h2>
        <form id="sellerForm">
            <input type="text" id="sellerName" placeholder="Name" required>
            <input type="email" id="sellerEmail" placeholder="Email" required>
            <input type="tel" id="sellerPhone" placeholder="Phone" required>
            <input type="text" id="sellerBusiness" placeholder="Business Name" required>
            <textarea id="sellerProducts" placeholder="Products" required></textarea>
            <input type="password" id="sellerPassword" placeholder="Create Password" required>
            
            <button type="submit" id="sellerRegisterBtn">Register</button>
            
            <button type="button" class="btn-seller-shortcut" onclick="openSellerLogin()">
                Already a Seller? Log In
            </button>
            
            <button type="button" class="close-btn" onclick="closeSeller()">Close</button>
        </form>
        <div id="sellerMsg"></div>
    `;

    if (user && user.role === 'user') {
        // Policy: Log out of regular user session first
        modalCard.innerHTML = `
            <h2>Seller Access Policy</h2>
            <h3>Hello, ${user.name}!</h3>
            <p style="margin: 15px 0; color: #3A4D39; font-weight: 500;">
                You must log out of your current User session to proceed with Seller actions.
            </p>
            
            <button type="button" class="btn-green" onclick="logout()">
                Log Out First
            </button>
            
            <button type="button" class="close-btn" onclick="closeSeller()">Close</button>
        `;
    } else {
        modalCard.innerHTML = registrationFormHtml;
        // Re-attach event listener
        setTimeout(() => {
            const form = safeGetElement('sellerForm');
            if (form) form.addEventListener('submit', handleSellerRegistration);
        }, 0);
    }
    
    sellerModal.style.display = 'flex';
}

function closeSeller() {
    const sellerModal = safeGetElement('sellerModal');
    if (sellerModal) sellerModal.style.display = 'none';
    const sellerMsg = safeGetElement('sellerMsg');
    if (sellerMsg) sellerMsg.textContent = '';
}

function handleSellerRegistration(e) {
    e.preventDefault();
        
    const name = safeGetElement('sellerName')?.value.trim();
    const email = safeGetElement('sellerEmail')?.value.trim();
    const phone = safeGetElement('sellerPhone')?.value.trim();
    const business = safeGetElement('sellerBusiness')?.value.trim();
    const products = safeGetElement('sellerProducts')?.value.trim();
    const password = safeGetElement('sellerPassword')?.value.trim();
    const sellerMsg = safeGetElement('sellerMsg');

    if (!name || !email || !phone || !business || !products || !password) {
        if (sellerMsg) { sellerMsg.style.color = "red"; sellerMsg.textContent = "Please fill in all fields."; }
        return;
    }

    if (sellerMsg) { 
        sellerMsg.style.color = "orange"; 
        sellerMsg.textContent = "Submitting application..."; 
    }

    fetch(BACKEND_URL + '/api/seller/register', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, business, products, password }) 
    })
    .then(res => res.json())
    .then(data => {
        if (data.seller && data.userId) {
            if (sellerMsg) { 
                sellerMsg.style.color = "green"; 
                sellerMsg.textContent = "Success! Your application is pending review. Redirecting to dashboard..."; 
            }
            
            localStorage.setItem('currentSellerId', data.seller._id); 
            
            setTimeout(() => { 
                closeSeller();
                window.location.href = 'seller-dashboard.html'; 
            }, 1500);
        } else {
            if (sellerMsg) {
                sellerMsg.style.color = "red";
                if (data.message && data.message.includes('already registered')) {
                    sellerMsg.innerHTML = `
                        ${data.message}<br><br>
                        <button class="btn-seller-login" onclick="closeSeller(); openSellerLogin();">
                            Click here to Login
                        </button>`;
                } else {
                    sellerMsg.textContent = data.message || "Registration failed. Please try again.";
                }
            }
        }
    })
    .catch(err => {
        console.error('Seller registration fetch error:', err);
        if (sellerMsg) { sellerMsg.style.color = "red"; sellerMsg.textContent = "Network error. Server unreachable."; }
    });
}


// --- RE-SELL (Coming Soon) ---

function openResell() {
    const resellModal = safeGetElement('resellModal');
    if (resellModal) {
        const modalCard = resellModal.querySelector('.modal-card');
        if (modalCard) {
            modalCard.innerHTML = `
                <h2>Re-Sell Feature</h2>
                <div id="resellMsg">
                    <p style="text-align: center; font-size: 1.2em; color: #3A4D39; margin: 20px 0;">
                        This feature is **Coming Soon**! We're building the best platform for re-sellers.
                    </p>
                </div>
                <button type="button" class="close-btn" onclick="closeResell()">Close</button>
            `;
        }
        resellModal.style.display = 'flex';
    }
}

function closeResell() {
    const resellModal = safeGetElement('resellModal');
    if (resellModal) resellModal.style.display = 'none';
}


// --- CONTACT FUNCTION ---

function closeContact() {
    const contactModal = safeGetElement('contactModal');
    if (contactModal) contactModal.style.display = 'none';
    const contactMsg = safeGetElement('contactMsg');
    const contactForm = safeGetElement('contactForm');
    if (contactMsg) contactMsg.textContent = '';
    if (contactForm) contactForm.reset();
}

function openContact() {
    const contactModal = document.getElementById('contactModal');
    if (contactModal) {
        contactModal.style.display = 'flex';
    }
}


// --- DYNAMIC NAV BUTTON RENDERING ---
function renderNavButton() {
    const container = safeGetElement('navLoginContainer');
    if (!container) return;

    const user = getLoggedInUser(); 
    const token = localStorage.getItem('token');

    if (token && user) {
        container.innerHTML = `
            <button class="login logged-in" onclick="openLogin()">
                <i class="fa-solid fa-user"></i>
            </button>
        `;
    } else {
        container.innerHTML = `
            <button class="login" onclick="openLogin()">
                <i class="fa-solid fa-user"></i>
            </button>
        `;
    }
    updateCartCount();
}


// *****************************************************************
// 3. EVENT LISTENERS AND PAGE LOGIC 
// *****************************************************************

window.addEventListener('load', renderNavButton);


// -------------------- CART ICON LISTENER --------------------
document.addEventListener('DOMContentLoaded', () => {
    const cartIcon = document.querySelector('.nav-right .cart');
    if (cartIcon) {
        cartIcon.addEventListener('click', renderCartModal);
    }
});


// -------------------- ADD TO CART BUTTONS --------------------
document.addEventListener('DOMContentLoaded', () => {
    const productListings = document.querySelectorAll('.main-content .col, .shop-item .item');

    productListings.forEach(listing => {
        const button = listing.querySelector('.btn-green'); 

        if (button && button.textContent.trim() === 'Add to Cart') {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                const container = this.closest('.card') || this.closest('.item'); 
                if (!container) return;

                const titleElement = container.querySelector('.card-title') || container.querySelector('p:not(.fw-bold)');
                const priceElement = container.querySelector('.fw-bold') || container.querySelector('.card-text:last-of-type'); 
                const imageElement = container.querySelector('img');

                const title = titleElement?.textContent.trim() || 'Untitled Product';
                const priceText = priceElement?.textContent.replace(/[^0-9.]/g, '').trim(); 
                const price = priceText ? parseFloat(priceText) : NaN;
                
                const imageUrl = imageElement?.src || '';
                const productId = title.replace(/\s/g, '_').toLowerCase(); 

                if (isNaN(price)) {
                     console.error('Invalid price for item:', title);
                     alert('Cannot add item: Invalid price.');
                     return;
                }
                
                addToCart(productId, title, price, imageUrl);
            });
        }
    });
});


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

        fetch(BACKEND_URL + '/api/contact', {
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

        fetch(BACKEND_URL + '/api/auth/register', { 
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


// -------------------- SELLER MODAL SUBMISSION (MERN INTEGRATED) --------------------
const initialSellerForm = safeGetElement('sellerForm');
if (initialSellerForm) {
    initialSellerForm.addEventListener('submit', handleSellerRegistration);
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


// -------------------- SAREE PAGE LOGIC (Search/Filter) --------------------

document.addEventListener("DOMContentLoaded", () => {
    const container = document.querySelector(".container-fluid .row");
    if (!container) return; 

    const filterBtn = document.createElement("button");
    filterBtn.classList.add("filter-toggle");
    filterBtn.innerText = "Toggle Filters";

    const sidebar = container.querySelector("aside");

    if (sidebar) {
        sidebar.parentNode.insertBefore(filterBtn, sidebar);

        filterBtn.addEventListener("click", () => {
            sidebar.classList.toggle("active");
        });
    }

    const searchInput = document.querySelector(".shop-search input");
    const productCards = document.querySelectorAll(".col .card");

    if (searchInput) {
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