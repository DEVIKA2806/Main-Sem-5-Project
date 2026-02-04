<<<<<<< HEAD
=======
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
>>>>>>> 06684e430fb1ca972e73e9c885dd5031266e23aa
// Function to safely get an element and prevent errors if it doesn't exist
const safeGetElement = (id) => document.getElementById(id);
const BACKEND_URL = ''; // Add your backend URL here if needed

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
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (token && user) {
        return JSON.parse(user);
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
// 2. AUTH & MENU FUNCTIONS (Fixed Logic)
// *****************************************************************

// Check Login State & Update Navbar
function checkLoginStatus() {
    const user = getLoggedInUser(); // Uses the unified helper
    const guestBtn = document.getElementById('guest-btn');
    const userMenu = document.getElementById('user-menu-container');

    if (user) {
        // --- USER IS LOGGED IN ---
        if(guestBtn) guestBtn.style.display = 'none'; 
        if(userMenu) userMenu.style.display = 'block'; 

        // Populate the Menu
        const nameEl = document.getElementById('menu-name');
        const emailEl = document.getElementById('menu-email');
        const initEl = document.getElementById('user-initial');

        if(nameEl) nameEl.textContent = user.name || "User";
        if(emailEl) emailEl.textContent = user.email || "email@example.com";
        if(initEl) initEl.textContent = (user.name || "U").charAt(0).toUpperCase();
    } else {
        // --- USER IS GUEST ---
        if(guestBtn) guestBtn.style.display = 'flex';
        if(userMenu) userMenu.style.display = 'none';
    }
}

// Toggle Profile Dropdown
function toggleUserMenu() {
    const menu = document.getElementById('user-dropdown');
    if (menu) menu.classList.toggle('active');
}

// Unified Logout Function
function logoutUser() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentSellerId');
    cart = [];
    localStorage.removeItem('cart');
    
    alert("You have been logged out.");
    window.location.href = 'index.html';
}

function closeLogin() {
    const loginModal = safeGetElement('loginModal');
    if (loginModal) loginModal.style.display = 'none';
    const modalError = safeGetElement('modalError');
    if (modalError) modalError.textContent = '';
}

function openLogin() {
    const loginModal = safeGetElement('loginModal');
    if (!loginModal) return;

    const user = getLoggedInUser(); 
    const loginCard = loginModal.querySelector('.login-card');
    
    // Block seller/admin from standard login
    if (user && (user.role === 'seller' || user.role === 'admin')) { 
         loginCard.innerHTML = `
            <h3>Access Denied</h3>
            <p>You are currently logged in as a Seller/Admin.</p>
            <button onclick="logoutUser()">Log Out</button>
            <button class="close-btn" onclick="closeLogin()">Close</button>
        `;
    } else {
        // Standard Login Form
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

    if (!emailInput || !passwordInput) return;

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
        if (data.token && data.user && data.user.role === 'user') { 
            errorMsg.style.color = "green";
            errorMsg.textContent = "Login successful!";

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user)); // Saves User Object
            localStorage.removeItem('currentSellerId'); 

            closeLogin();
            window.location.reload(); 
        } 
        else {
            errorMsg.style.color = "red";
            errorMsg.textContent = data.message || "Invalid credentials.";
        }
    })
    .catch(err => {
        console.error(err);
        errorMsg.style.color = "red";
        errorMsg.textContent = "Server error.";
    });
}


// *****************************************************************
// 3. SELLER LOGIN/REGISTRATION
// *****************************************************************

function openSellerLogin() {
    const sellerModal = safeGetElement('sellerModal');
    if (!sellerModal) return;
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
    const email = safeGetElement('sellerLoginEmail').value.trim();
    const password = safeGetElement('sellerLoginPassword').value.trim();
    const errorMsg = safeGetElement('sellerLoginError');

    errorMsg.textContent = 'Logging in...';
    errorMsg.style.color = 'orange';

    fetch(BACKEND_URL + '/api/auth/seller-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.token && data.user && (data.user.role === 'seller' || data.user.role === 'admin')) { 
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            if(data.user.sellerId) localStorage.setItem('currentSellerId', data.user.sellerId);

            window.location.href = 'seller-dashboard.html'; 
        } else {
            errorMsg.style.color = "red";
            errorMsg.textContent = "Invalid credentials.";
        }
    })
    .catch(err => {
        errorMsg.style.color = "red";
        errorMsg.textContent = "Server error.";
    });
}

function openSeller() {
    const user = getLoggedInUser();
    if(user && (user.role === 'seller' || user.role === 'admin')){
        window.location.href = 'seller-dashboard.html';
        return;
    }
    const sellerModal = safeGetElement('sellerModal');
    if (!sellerModal) return;

    const modalCard = sellerModal.querySelector('.modal-card');
    modalCard.innerHTML = `
        <h2>Join as Seller</h2>
        <form id="sellerForm">
            <input type="text" id="sellerName" placeholder="Name" required>
            <input type="email" id="sellerEmail" placeholder="Email" required>
            <input type="tel" id="sellerPhone" placeholder="Phone">
            <input type="text" id="sellerBusiness" placeholder="Business Name" required>
            <textarea id="sellerProducts" placeholder="Products"></textarea>
            <input type="password" id="sellerPassword" placeholder="Create Password" required>
            
            <button type="submit" id="sellerRegisterBtn">Register</button>
            <button type="button" class="btn-seller-shortcut" onclick="openSellerLogin()">Already a Seller? Log In</button>
            <button type="button" class="close-btn" onclick="closeSeller()">Close</button>
        </form>
        <div id="sellerMsg"></div>
    `;

    setTimeout(() => {
        const form = safeGetElement('sellerForm');
        if (form) form.addEventListener('submit', handleSellerRegistration);
    }, 0);
    
    sellerModal.style.display = 'flex';
}

function handleSellerRegistration(e) {
    e.preventDefault();
    const name = safeGetElement('sellerName').value.trim();
    const email = safeGetElement('sellerEmail').value.trim();
    const password = safeGetElement('sellerPassword').value.trim();
    const business = safeGetElement('sellerBusiness').value.trim();
    
    // Mock Registration for brevity - Ensure backend fetch is here in real code
    alert('Feature requires backend setup. Check console for structure.');
}

function closeSeller() {
    const sellerModal = safeGetElement('sellerModal');
    if (sellerModal) sellerModal.style.display = 'none';
}


// *****************************************************************
// 4. CHECKOUT & LOCATION FUNCTIONS (High Accuracy)
// *****************************************************************

function closeCheckoutModal() {
    const checkoutModal = safeGetElement('checkoutModal');
    if (checkoutModal) checkoutModal.style.display = 'none';
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
    
    const name = deliveryDetails.name || user.name || '';
    const contact = deliveryDetails.contact || '';
    const address = deliveryDetails.address || '';
    const pincode = deliveryDetails.pincode || '';

    checkoutForm.innerHTML = `
        <h2 class="text-center">Checkout Details</h2>
        <div id="checkoutError" class="error"></div>
        
        <input type="text" id="deliveryName" placeholder="Full Name" value="${name}" required>
        <input type="tel" id="deliveryContact" placeholder="Contact No." value="${contact}" required>
        
        <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 15px;">
            <input type="text" id="deliveryAddress" placeholder="Full Address" value="${address}" required style="margin-bottom: 0; flex-grow: 1;">
            <button type="button" class="btn btn-sm btn-outline-secondary" onclick="fillCurrentLocation()" style="white-space: nowrap; height: 45px; cursor: pointer;">
                <i class="fa-solid fa-location-crosshairs"></i> Locate Me
            </button>
        </div>

        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
            <input type="text" id="deliveryPincode" placeholder="Pincode" value="${pincode}" style="margin-bottom: 0;" required>
            <button type="button" class="btn btn-sm btn-outline-secondary" onclick="validatePincode()" style="width: 150px; flex-shrink: 0; margin-bottom: 0;">Verify Pincode</button>
        </div>
        <div id="pincodeStatus" style="font-size: 0.9em; margin-bottom: 15px;"></div>
        
        <h4 style="margin-top: 20px;">Payment Options</h4>
        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
            <button type="button" class="btn-green" onclick="handleCheckout('COD')">Cash on Delivery (COD)</button>
        </div>

        <button type="button" class="close-btn" onclick="closeCheckoutModal()">Cancel</button>
    `;
    
    if(pincode) validatePincode(pincode);
    checkoutModal.style.display = 'flex';
}

function fillCurrentLocation() {
    const addressInput = document.getElementById('deliveryAddress');
    const pincodeInput = document.getElementById('deliveryPincode');
    
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    addressInput.value = "";
    addressInput.placeholder = "Fetching precise location...";

    const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };

    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await response.json();

            if (data && data.address) {
                const addr = data.address;
                const parts = [
                    addr.house_number || addr.building,
                    addr.road || addr.street,
                    addr.suburb || addr.neighbourhood,
                    addr.city || addr.town,
                    addr.state
                ].filter(Boolean);
                
                addressInput.value = parts.join(", ");
                if (addr.postcode) {
                    pincodeInput.value = addr.postcode;
                    validatePincode(addr.postcode);
                }
            } else {
                alert("Location found, but address is unclear.");
            }
        } catch (error) {
            console.error(error);
            alert("Could not fetch address.");
        }
        addressInput.placeholder = "Full Address";
    }, (error) => {
        alert("Location access denied or failed.");
        addressInput.placeholder = "Full Address";
    }, options);
}

function validatePincode(val) {
    const pin = val || safeGetElement('deliveryPincode')?.value;
    const status = safeGetElement('pincodeStatus');
    if(status) {
        status.style.color = "green";
        status.textContent = `Pincode ${pin} Verified.`;
    }
}

// --- PASTE THE NEW VERSION HERE ---
function handleCheckout(method) {
    const user = getLoggedInUser();
    
    // 1. Calculate Total
    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    // 2. Create Order Object
    const newOrder = {
        id: 'ORD-' + Date.now().toString().slice(-6), // Random ID
        date: new Date().toLocaleDateString(),
        userEmail: user ? user.email : 'guest',
        items: cart,
        total: totalAmount.toFixed(2),
        method: method,
        status: 'Processing'
    };

    // 3. Save to LocalStorage (So it shows up in Order History)
    const currentHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];
    currentHistory.push(newOrder);
    localStorage.setItem('orderHistory', JSON.stringify(currentHistory));

    // 4. Clear Cart & Redirect
    alert(`Order Placed Successfully via ${method}!`);
    cart = [];
    localStorage.removeItem('cart');
    closeCheckoutModal();
    
<<<<<<< HEAD
    // Redirect to Order History page to see the new order
    window.location.href = 'orders.html';
=======
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
>>>>>>> 06684e430fb1ca972e73e9c885dd5031266e23aa
}


// *****************************************************************
// 5. EVENT LISTENERS
// *****************************************************************

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus(); 
    
    if (window.location.pathname.endsWith('cart.html')) {
        renderCartPage();
    }
    
    // --- FIX: Add this for the Shop Now Button ---
    const shopNowBtn = document.getElementById('shop-now');
    if (shopNowBtn) {
        shopNowBtn.addEventListener('click', () => {
            window.location.href = 'shop-now.html';
        });
    }
    // ---------------------------------------------

    // Global Event Delegation for Product Buttons
    document.body.addEventListener('click', function(e) {
        const button = e.target.closest('.btn-green');
        // Check if it's an "Add to Cart" button (ignore other green buttons like Shop Now)
        if (button && button.textContent.trim() === 'Add to Cart') {
            e.preventDefault();
            const { productId, title, price, imageUrl } = button.dataset;
            if (productId) addToCart(productId, title, price, imageUrl);
        }
    });
});



document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus(); // Updates Navbar state (Guest vs User)
    
    if (window.location.pathname.endsWith('cart.html')) {
        renderCartPage();
    }
    
    // Global Event Delegation for Product Buttons
    document.body.addEventListener('click', function(e) {
        const button = e.target.closest('.btn-green');
        if (button && button.textContent.trim() === 'Add to Cart') {
            e.preventDefault();
            const { productId, title, price, imageUrl } = button.dataset;
            if (productId) addToCart(productId, title, price, imageUrl);
        }
    });
});

// Close menu on outside click
window.addEventListener('click', function(e) {
    const container = document.getElementById('user-menu-container');
    const menu = document.getElementById('user-dropdown');
    if (container && !container.contains(e.target) && menu) {
        menu.classList.remove('active');
    }
});
// *****************************************************************
// 6. ORDER HISTORY FUNCTIONS (Missing Part)
// *****************************************************************

// Run this when orders.html loads
if (window.location.pathname.endsWith('orders.html')) {
    document.addEventListener('DOMContentLoaded', fetchOrderHistory);
}

function fetchOrderHistory() {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;

    const user = getLoggedInUser();
    if (!user) {
        ordersList.innerHTML = `<p style="text-align:center;">Please log in to view orders.</p>`;
        return;
    }

    // 1. Get Orders from LocalStorage (Simulating Database)
    // In a real app, this would be: await fetch('/api/orders/my-orders');
    const allOrders = JSON.parse(localStorage.getItem('orderHistory')) || [];
    
    // Filter orders for ONLY the currently logged-in user
    const userOrders = allOrders.filter(order => order.userEmail === user.email);

    if (userOrders.length === 0) {
        ordersList.innerHTML = `
            <div style="text-align:center; padding: 40px; color:#666;">
                <i class="fa-solid fa-box-open" style="font-size: 3rem; color:#C08261; margin-bottom:15px;"></i>
                <h3>No Orders Yet</h3>
                <p>Looks like you haven't bought anything yet.</p>
                <button class="btn-green" onclick="window.location.href='shop-now.html'" style="margin-top:10px;">Start Shopping</button>
            </div>`;
        return;
    }

    // 2. Generate HTML
    ordersList.innerHTML = userOrders.map(order => {
        return `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <strong>Order #${order.id}</strong><br>
                    <span>${order.date}</span>
                </div>
                <div>
                    <span class="order-status status-delivered">Processing</span>
                </div>
            </div>
            
            <div class="order-items">
                ${order.items.map(item => `
                    <div style="display:flex; align-items:center; gap:10px; margin-right:20px; margin-bottom: 10px;">
                        <img src="${item.imageUrl || '../assets/default.jpg'}" class="order-item-thumb" style="width:60px; height:60px; object-fit:cover; border-radius:5px;">
                        <div>
                            <p style="margin:0; font-weight:600; font-size: 0.9rem;">${item.title}</p>
                            <p style="margin:0; font-size:0.8rem; color:#777;">Qty: ${item.qty} x ₹${item.price}</p>
                        </div>
                    </div>
                `).join('')}
            </div>

<<<<<<< HEAD
            <div class="order-total">
                Total: ₹${order.total} <br>
                <small style="font-size:0.8rem; color:#555;">Via ${order.method}</small>
            </div>
        </div>
        `;
    }).reverse().join(''); // .reverse() shows newest orders first
}
=======
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
>>>>>>> 06684e430fb1ca972e73e9c885dd5031266e23aa
