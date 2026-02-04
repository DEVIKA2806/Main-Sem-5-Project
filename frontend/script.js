function getUser() {
  return JSON.parse(localStorage.getItem('user'));
}

function getReseller() {
  return JSON.parse(localStorage.getItem('reseller'));
}

function logoutUser() {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
}

function logoutReseller() {
  localStorage.removeItem('reseller');
  localStorage.removeItem('resellerToken');
}

// frontend/script.js
// Function to safely get an element and prevent errors if it doesn't exist
const safeGetElement = (id) => document.getElementById(id);
const BACKEND_URL = '';

// *****************************************************************
// 1. GLOBAL STATE AND CART FUNCTIONS
// *****************************************************************
let cart = JSON.parse(localStorage.getItem('cart')) || [];
const deliveryDetailsKey = 'userDeliveryDetails';
let deliveryDetails = JSON.parse(localStorage.getItem(deliveryDetailsKey)) || {};

function updateCartCount() {
    const countElement = safeGetElement('cart-count');
    if (countElement) {
        countElement.textContent = cart.length; 
    }
}

function getLoggedInUser() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    if (token && user) {
        return user
    }
    
    return null;
}


function addToCart(productId, title, price, imageUrl) {
    const user = getLoggedInUser(); 
    
    if (!user || user.role !== 'user') { 
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


function renderCartPage() {
    const cartItemsList = safeGetElement('cartItemsList');
    const cartSummary = safeGetElement('cartSummary');
    const cartEmptyMessage = safeGetElement('cartEmptyMessage');
    const cartSubtotal = safeGetElement('cartSubtotal');
    
    if (!cartItemsList || !cartSummary) return;

    if (cart.length === 0) {
        cartItemsList.innerHTML = '';
        cartSummary.style.display = 'none';
        cartEmptyMessage.style.display = 'block';
        return;
    }

    cartEmptyMessage.style.display = 'none';
    cartSummary.style.display = 'flex';

    let total = 0;
    
    const cartContent = cart.map(item => {
        const subtotal = item.qty * item.price;
        total += subtotal;
        
        return `
            <div class="cart-item" data-product-id="${item.productId}">
                <div class="cart-item-details">
                    <img src="${item.imageUrl || '../assets/default.jpg'}" alt="${item.title}" class="cart-item-image">
                    <p class="item-title">${item.title} <span style="font-size:0.8em; color:#666;">(₹${item.price.toFixed(2)} each)</span></p>
                </div>
                
                <div class="item-qty-control">
                    <button onclick="changeQuantity('${item.productId}', -1)" class="btn btn-sm btn-outline-secondary">-</button>
                    <input type="number" value="${item.qty}" min="1" readonly>
                    <button onclick="changeQuantity('${item.productId}', 1)" class="btn btn-sm btn-outline-secondary">+</button>
                </div>
                
                <p class="item-price">₹${subtotal.toFixed(2)}</p>
                
                <button class="remove-btn" onclick="removeItem('${item.productId}')">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;
    }).join('');

    cartItemsList.innerHTML = cartContent;
    if (cartSubtotal) cartSubtotal.textContent = `₹${total.toFixed(2)}`;
    updateCartCount();
}

function changeQuantity(productId, delta) {
    const itemIndex = cart.findIndex(item => item.productId === productId);
    if (itemIndex > -1) {
        cart[itemIndex].qty += delta;
        
        if (cart[itemIndex].qty <= 0) {
            removeItem(productId);
        } else {
            localStorage.setItem('cart', JSON.stringify(cart));
            renderCartPage(); 
        }
    }
}

function removeItem(productId) {
    const itemIndex = cart.findIndex(item => item.productId === productId);
    
    if (itemIndex > -1) {
        cart.splice(itemIndex, 1); 
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCartPage(); 
    }
}


// *****************************************************************
// 2. AUTH & MODAL FUNCTIONS
// *****************************************************************

function closeLogin() {
    const loginModal = safeGetElement('loginModal');
    if (loginModal) loginModal.style.display = 'none';
    const modalError = safeGetElement('modalError');
    if (modalError) modalError.textContent = '';
    renderNavButton();
}

function logout() {
    // Clears all session state (Q1 & Q7 Fix)
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentSellerId'); // Crucial for seller logout persistence
    cart = []; 
    localStorage.removeItem('cart');
    // NOTE: Delivery details are intentionally kept to re-fill for the customer's next visit (Q6)
    updateCartCount();
    closeLogin();
    
    setTimeout(() => {
        // Reloads the current page, fulfilling the requirement to stay on the same page.
        window.location.reload(); 
    }, 100);
}


// --- USER LOGIN (Modified for dynamic content & robust role check) ---
function openLogin() {
    const loginModal = safeGetElement('loginModal');
    if (!loginModal) return;

    const user = getLoggedInUser(); 
    const loginCard = loginModal.querySelector('.login-card');
    
    // Issue #5 Fix: Block customer login if a seller/admin session is active
    if (user && (user.role === 'seller' || user.role === 'admin')) { 
         loginCard.innerHTML = `
            <h3>Access Denied - Seller Portal Active</h3>
            <p>You are currently logged in as a **Seller/Admin**. Please use the Logout button in the Seller Dashboard or below.</p>
            <button onclick="logout(); closeLogin(); setTimeout(() => { openLogin(); }, 100);">Log Out of Seller/Admin & Log In as Customer</button>
            <button class="close-btn" onclick="closeLogin()">Close</button>
        `;
    } else if (user) {
        // Existing logic for logged-in standard user
         loginCard.innerHTML = `
            <h3>Welcome Back, ${user.name}!</h3>
            <p>Role: ${user.role}</p>
            <button onclick="logout()">Log Out</button>
            <button class="close-btn" onclick="closeLogin()">Close</button>
        `;
    } else {
        // Existing logic for login form
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
        // Ensures only 'user' role proceeds with customer login
        if (data.token && data.user && data.user.role === 'user') { 
            errorMsg.style.color = "green";
            errorMsg.textContent = "Login successful!";

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            // Clear seller ID on customer login (session separation)
            localStorage.removeItem('currentSellerId'); 

            closeLogin();
            window.location.reload(); 
        } 
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

// --- SELLER LOGIN/REGISTRATION (New Dedicated Flow) ---

function openSellerLogin() {
    const sellerModal = safeGetElement('sellerModal');
    if (!sellerModal) { console.error('Seller modal not found'); return; }

    const user = getLoggedInUser();
    // Issue #5 Fix: Block seller login if a customer session is active
    if (user && user.role === 'user') {
        openSeller(); // Redirect to the logic that prompts user logout
        return;
    }

    const modalCard = sellerModal.querySelector('.modal-card');
    
    modalCard.innerHTML = `
        <h2>Seller Login</h2>
        <div id="sellerLoginFormContainer">
            <input type="email" id="sellerLoginEmail" placeholder="Email" required>
            <input type="password" id="sellerLoginPassword" placeholder="Password" required>
            <div id="sellerLoginError" class="error"></div>
            
            <button onclick="validateSellerLogin()">Login</button>
            
            <button type="button" class="btn-seller-shortcut" onclick="openSeller()">
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
        // CRITICAL CHECK: Ensures correct role and sellerId is present for session persistence (Issue #4)
        if (data.token && data.user && (data.user.role === 'seller' || data.user.role === 'admin') && data.user.sellerId) { 
            errorMsg.style.color = "green";
            errorMsg.textContent = `Login successful! Status: ${data.user.status}. Redirecting to dashboard...`; 

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('currentSellerId', data.user.sellerId);

            setTimeout(() => {
                window.location.href = 'seller-dashboard.html'; 
            }, 500);

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
    const user = getLoggedInUser();
    
    // Issue #4 Fix: Redirect to dashboard if already logged in as seller/admin
    if(user && (user.role === 'seller' || user.role === 'admin')){
        window.location.href = 'seller-dashboard.html';
        return;
    }
    const sellerModal = safeGetElement('sellerModal');
    if (!sellerModal) return;

    const modalCard = sellerModal.querySelector('.modal-card');
    
    const registrationFormHtml = `
        <h2>Join as Seller</h2>
        <form id="sellerForm">
            <input type="text" id="sellerName" placeholder="Name" required>
            <input type="email" id="sellerEmail" placeholder="Email" required>
            <input type="tel" id="sellerPhone" placeholder="Phone">
            <input type="text" id="sellerBusiness" placeholder="Business Name" required>
            <textarea id="sellerProducts" placeholder="Products (e.g., Saree, Art, etc.)"></textarea>
            <input type="password" id="sellerPassword" placeholder="Create Password" required>
            
            <button type="submit" id="sellerRegisterBtn">Register</button>
            
            <button type="button" class="btn-seller-shortcut" onclick="openSellerLogin()">
                Already a Seller? Log In
            </button>
            
            <button type="button" class="close-btn" onclick="closeSeller()">Close</button>
        </form>
        <div id="sellerMsg"></div>
    `;

    // Issue #5 Fix: Prompt logout if a standard user is logged in
    if (user && user.role === 'user') {
        modalCard.innerHTML = `
            <h2>Seller Access Policy</h2>
            <h3>Hello, ${user.name}!</h3>
            <p style="margin: 15px 0; color: #3A4D39; font-weight: 500;">
                You must **log out of your current User session** to proceed with Seller actions.
            </p>
            
            <button type="button" class="btn-green" onclick="logout(); closeSeller(); setTimeout(() => { openSeller(); }, 100);">
                Log Out First & Register/Log In as Seller
            </button>
            
            <button type="button" class="close-btn" onclick="closeSeller()">Close</button>
        `;
    } else {
        // Display the registration form
        modalCard.innerHTML = registrationFormHtml;
        setTimeout(() => {
            const form = safeGetElement('sellerForm');
            if (form) form.addEventListener('submit', handleSellerRegistration);
        }, 0);
    }
    
    sellerModal.style.display = 'flex';
}

function handleSellerRegistration(e) {
    e.preventDefault();
        
    const name = safeGetElement('sellerName')?.value.trim();
    const email = safeGetElement('sellerEmail')?.value.trim();
    const phone = safeGetElement('sellerPhone')?.value.trim() || ''; 
    const business = safeGetElement('sellerBusiness')?.value.trim();
    const products = safeGetElement('sellerProducts')?.value.trim() || ''; 
    const password = safeGetElement('sellerPassword')?.value.trim();
    const sellerMsg = safeGetElement('sellerMsg');

    // Only requiring name, email, business, and password.
    if (!name || !email || !business || !password) {
        if (sellerMsg) { 
             sellerMsg.style.color = "red"; 
             sellerMsg.textContent = "Please fill in all required fields (Name, Email, Business Name, Password)."; 
        }
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
        // CRITICAL CHECK: Successful registration now returns token and user data with sellerId
        if (data.token && data.user && (data.user.role === 'seller' || data.user.role === 'admin') && data.user.sellerId) { 
            if (sellerMsg) { 
                sellerMsg.style.color = "green"; 
                sellerMsg.textContent = `Registration successful! Status: ${data.user.status || 'pending'}. Redirecting to dashboard...`; 
            }
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user)); 
            localStorage.setItem('currentSellerId', data.user.sellerId); 
            
            // Faster redirection (Issue #1, adjusted from 1500ms)
            setTimeout(() => { 
                closeSeller();
                window.location.href = 'seller-dashboard.html'; 
            }, 500);
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

function closeSeller() {
    const sellerModal = safeGetElement('sellerModal');
    if (sellerModal) sellerModal.style.display = 'none';
    const sellerMsg = safeGetElement('sellerMsg');
    if (sellerMsg) sellerMsg.textContent = '';
    renderNavButton();
}


// --- CHECKOUT FUNCTIONALITY (Q5 & Q6) ---

function closeCheckoutModal() {
    const checkoutModal = safeGetElement('checkoutModal');
    if (checkoutModal) checkoutModal.style.display = 'none';
    const checkoutMsg = safeGetElement('checkoutMsg');
    if (checkoutMsg) checkoutMsg.textContent = '';
}

function openCheckoutModal() {
    if (cart.length === 0) {
        alert('Your cart is empty.');
        return;
    }
    const user = getLoggedInUser();
    if (!user) {
        alert('You must be logged in to proceed to checkout.');
        openLogin();
        return;
    }

    const checkoutModal = safeGetElement('checkoutModal');
    const checkoutForm = safeGetElement('checkoutForm');
    if (!checkoutModal || !checkoutForm) return;

    // Load saved details or fall back to user name if available (Q6)
    const name = deliveryDetails.name || user.name || '';
    const contact = deliveryDetails.contact || '';
    const address = deliveryDetails.address || '';
    const pincode = deliveryDetails.pincode || '';

    checkoutForm.innerHTML = `
        <h2 class="text-center">Checkout Details</h2>
        <div id="checkoutError" class="error"></div>
        <input type="text" id="deliveryName" placeholder="Full Name" value="${name}" required>
        <input type="tel" id="deliveryContact" placeholder="Indian Contact No. (10 digits)" value="${contact}" maxlength="10" pattern="\\d{10}" title="Contact number must be 10 digits" required>
        <input type="text" id="deliveryAddress" placeholder="Full Address" value="${address}" required>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
            <input type="text" id="deliveryPincode" placeholder="Pincode (e.g. 400001)" value="${pincode}" maxlength="6" pattern="\\d{6}" title="Pincode must be 6 digits" style="margin-bottom: 0;" required>
            <button type="button" class="btn btn-sm btn-outline-secondary" onclick="validatePincode()" style="width: 150px; flex-shrink: 0; margin-bottom: 0;">Verify Pincode</button>
        </div>
        <div id="pincodeStatus" style="font-size: 0.9em; margin-bottom: 15px;"></div>
        
        <h4 style="margin-top: 20px;">Payment Options</h4>
        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
            <button type="button" class="btn-green" onclick="handleCheckout('COD')">
                Cash on Delivery (COD)
            </button>
            <button type="button" class="btn btn-green-outline" disabled>
                Online Payment (Coming Soon)
            </button>
        </div>

        <button type="button" class="close-btn" onclick="closeCheckoutModal()">Cancel</button>
    `;
    
    // Re-check pincode if it's already filled (Q6)
    if(pincode) {
        validatePincode(pincode);
    }
    
    checkoutModal.style.display = 'flex';
}

function validatePincode(pincodeValue = null) {
    const pincodeInput = safeGetElement('deliveryPincode');
    const pincodeStatus = safeGetElement('pincodeStatus');
    const pincode = pincodeValue || pincodeInput?.value.trim();

    if (!pincodeInput || !pincodeStatus) return;

    // Indian Pincode regex (6 digits)
    const pincodePattern = /^\d{6}$/;

    if (!pincode.match(pincodePattern)) {
        pincodeStatus.style.color = 'red';
        pincodeStatus.textContent = 'Invalid Pincode format (must be 6 digits).';
        return false;
    }

    // Simulate Pincode verification (Mock logic for Indian Pincodes)
    pincodeStatus.style.color = 'orange';
    pincodeStatus.textContent = `Verifying Pincode ${pincode}...`;

    setTimeout(() => {
        // Mock API call simulation
        if (pincode === '400001' || pincode === '110001' || pincode.startsWith('4') || pincode.startsWith('1')) {
            pincodeStatus.style.color = 'green';
            pincodeStatus.textContent = `Pincode ${pincode} verified! Delivery available in 5-7 days.`;
        } else {
            pincodeStatus.style.color = 'red';
            pincodeStatus.textContent = `Pincode ${pincode} not serviceable currently.`;
        }
    }, 500);
}

function handleCheckout(paymentMethod) {
    const name = safeGetElement('deliveryName')?.value.trim();
    const contact = safeGetElement('deliveryContact')?.value.trim();
    const address = safeGetElement('deliveryAddress')?.value.trim();
    const pincode = safeGetElement('deliveryPincode')?.value.trim();
    const errorMsg = safeGetElement('checkoutError');
    const pincodeStatus = safeGetElement('pincodeStatus');

    if (!name || !contact || !address || !pincode) {
        errorMsg.style.color = 'red';
        errorMsg.textContent = 'All delivery fields are required.';
        return;
    }
    
    if (!contact.match(/^\d{10}$/)) {
        errorMsg.style.color = 'red';
        errorMsg.textContent = 'Contact number must be 10 digits.';
        return;
    }

    if (pincodeStatus.textContent.includes('not serviceable')) {
        errorMsg.style.color = 'red';
        errorMsg.textContent = 'Delivery is not available for this pincode. Please enter a serviceable pincode and verify.';
        return;
    }

    errorMsg.style.color = 'orange';
    errorMsg.textContent = `Processing order via ${paymentMethod}...`;

    // Save/Update Delivery Details (Q6)
    deliveryDetails = { name, contact, address, pincode };
    localStorage.setItem(deliveryDetailsKey, JSON.stringify(deliveryDetails));

    // Prepare order data (simulated for demonstration)
    const orderItems = cart.map(item => ({
        id: item.productId,
        name: item.title,
        qty: item.qty,
        price: item.price
    }));
    
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    const orderData = {
        items: orderItems,
        total: parseFloat(total.toFixed(2)),
        address: `${address}, Pincode: ${pincode}`,
        customerName: name,
        customerContact: contact,
        paymentMethod: paymentMethod
    };
    
    // --- Mock Success Simulation ---
    setTimeout(() => {
        // Clear cart upon successful order
        cart = [];
        localStorage.removeItem('cart');
        closeCheckoutModal();
        alert(`Order placed successfully via ${paymentMethod}! Total: ₹${orderData.total.toFixed(2)}. Your items will be delivered soon!`);
        window.location.href = 'index.html'; // Redirect to home after purchase
    }, 1000);
}
    
function openResell() {
  const user = getUser();

  if (!user) {
    alert("Please login as a User to explore Resell.");
    openLogin();
    return;
  }

  window.location.href = 'resell.html';
}

function joinReseller() {
    const user = JSON.parse(localStorage.getItem('user'));

    // 1. Check if they are already logged in as a standard User
    if (user && user.role === 'user') {
        const confirmLogout = confirm("To join as a Reseller, we need to log you out of your Customer account. Do you want to proceed?");
        
        if (confirmLogout) {
            logout(); // This uses your existing global logout logic
            // After logout/reload, the page will be clean for the reseller login
        }
        return; 
    }

    // 2. If already a Reseller, go straight to Dashboard
    const resellerToken = localStorage.getItem('resellerToken');
    if (resellerToken) {
        window.location.href = 'reseller-dashboard.html';
        return;
    }

    // 3. Otherwise, show the Reseller Login/Registration Modal
    openSellerLogin(); 
}


function openResellerAuth() {
    document.getElementById('resellerAuthModal').style.display = 'flex';
}

function closeResellerAuth() {
    document.getElementById('resellerAuthModal').style.display = 'none';
}

function resellerLogin() {
  const email = resellerEmail.value.trim();
  const password = resellerPassword.value.trim();
  const msg = resellerMsg;

  fetch('/api/reseller/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.token) {
      localStorage.setItem('reseller', JSON.stringify(data.reseller));
      localStorage.setItem('resellerToken', data.token);
      window.location.href = 'reseller-dashboard.html';
    } else {
      msg.textContent = data.message;
    }
  });
}

// --- CONTACT FUNCTION ---

function closeContact() {
    const contactModal = safeGetElement('contactModal');
    if (contactModal) contactModal.style.display = 'none';
    const contactMsg = safeGetElement('contactMsg');
    const contactForm = safeGetElement('contactForm');
    if (contactMsg) contactMsg.textContent = '';
    if (contactForm) contactForm.reset();
    window.history.back(); // FIX 3: Go back to the previous page
}

function openContact() {
    const contactModal = document.getElementById('contactModal');
    if (contactModal) {
        contactModal.style.display = 'flex';
    }
}


// --- DYNAMIC NAV BUTTON RENDERING ---
function renderNavButton() {
    const container = document.querySelector('.login').parentElement; // Found the parent of the .login button
    if (!container) return;

    const user = getLoggedInUser(); 
    const token = localStorage.getItem('token');

    // Assuming the HTML structure is already correct and we don't need to rebuild the button every time,
    // just re-read the cart count. The original structure of `nav-right` is better left static if possible.
    updateCartCount();
}


// *****************************************************************
// 3. EVENT LISTENERS AND PAGE LOGIC 
// *****************************************************************

window.addEventListener('load', renderNavButton);

document.addEventListener('DOMContentLoaded', () => {
    // Only run renderCartPage logic on cart.html
    if (window.location.pathname.endsWith('cart.html')) {
        renderCartPage();
    }
    
    // Find Add to Cart buttons on product pages (like saree.html)
    document.body.addEventListener('click', function(e) {
        const button = e.target.closest('.btn-green');
        if (button && button.textContent.trim() === 'Add to Cart') {
            e.preventDefault();
            
            const productId = button.dataset.productId;
            const title = button.dataset.title;
            const price = button.dataset.price;
            const imageUrl = button.dataset.imageUrl;

            if (productId && title && price && imageUrl) {
                addToCart(productId, title, price, imageUrl);
            }
        }
    });

    // Search functionality for product pages (Re-confirmed as correct implementation for Request 2)
    const searchInput = document.querySelector(".shop-search input");
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const query = searchInput.value.toLowerCase();
            const productCards = document.querySelectorAll(".col");
            productCards.forEach(card => {
                const titleElement = card.querySelector(".card-title");
                if (titleElement) {
                    const title = titleElement.innerText.toLowerCase();
                    if (title.includes(query)) {
                        card.style.display = "block";
                    } else {
                        card.style.display = "none";
                    }
                }
            });
        });
    }
});


// -------------------- INITIAL ATTACHMENTS --------------------
const shopNowBtn = safeGetElement("shop-now");
if (shopNowBtn) {
    shopNowBtn.addEventListener("click", function() {
        window.location.href = "shop-now.html";
    });
}

// Ensure the registration form listener is only attached once
const initialSellerForm = safeGetElement('sellerForm');
if (initialSellerForm) {
    initialSellerForm.addEventListener('submit', handleSellerRegistration);
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
                errorMsg.textContent = data.message || "Registration failed.";
            }
        })
        .catch(err => {
            console.error(err);
            errorMsg.textContent = "Server error during Sign Up. Please try again.";
        });
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

// Ensures the global logout function is available to the HTML buttons (Q1 & Q7 Fix)
window.logout = window.logout || (() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentSellerId');
    window.location.reload(); 
});

// Export checkout functions to global scope for HTML access (Q5 & Q6)
window.openCheckoutModal = openCheckoutModal;
window.closeCheckoutModal = closeCheckoutModal;
window.handleCheckout = handleCheckout;
window.validatePincode = validatePincode;


// frontend/artifacts.js
// === Shop Page JS ===

// Toggle sidebar filters (for mobile)
document.addEventListener("DOMContentLoaded", () => {
              const filterBtn = document.createElement("button");
              filterBtn.classList.add("filter-toggle");
              filterBtn.innerText = "Toggle Filters";
          
              const container = document.querySelector(".container-fluid .row");
              const sidebar = container.querySelector("aside");
          
              // Insert filter button before sidebar
              sidebar.parentNode.insertBefore(filterBtn, sidebar);
          
              filterBtn.addEventListener("click", () => {
                  sidebar.classList.toggle("active");
              });
          });

// frontend/saree.js
// === Shop Page JS ===

// Toggle sidebar filters (for mobile)
document.addEventListener("DOMContentLoaded", () => {
    const filterBtn = document.createElement("button");
    filterBtn.classList.add("filter-toggle");
    filterBtn.innerText = "Toggle Filters";

    const container = document.querySelector(".container-fluid .row");
    const sidebar = container.querySelector("aside");

    // Insert filter button before sidebar
    sidebar.parentNode.insertBefore(filterBtn, sidebar);

    filterBtn.addEventListener("click", () => {
        sidebar.classList.toggle("active");
    });
});

function renderNavButton() {
    const user = getLoggedInUser();
    const resellBtn = document.querySelector('.resellerLogin');

    if (user && (user.role === 'seller' || user.role === 'admin')) {
        // Change "Join as Reseller" to "Seller Dashboard"
        if (resellBtn) {
            resellBtn.textContent = "Seller Dashboard";
            resellBtn.onclick = () => window.location.href = 'seller-dashboard.html';
        }
    }
}
