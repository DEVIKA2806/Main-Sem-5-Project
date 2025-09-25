// Redirect to shop page
document.getElementById("shop-now").addEventListener("click", function() {
    window.location.href = "shop-now.html";
});

// -------------------- LOGIN MODAL --------------------
function openLogin() {
    document.getElementById('loginModal').style.display = 'flex';
}

function closeLogin() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('modalError').textContent = '';
    document.getElementById('modalUsername').value = '';
    document.getElementById('modalPassword').value = '';
}

function validateModalLogin() {
    const username = document.getElementById('modalUsername').value.trim();
    const password = document.getElementById('modalPassword').value.trim();
    const errorMsg = document.getElementById('modalError');

    if (!username || !password) {
        errorMsg.style.color = "red";
        errorMsg.textContent = "Please enter both username and password.";
        return;
    }

    if (username === "user" && password === "password") {
        errorMsg.style.color = "green";
        errorMsg.textContent = "Login successful!";
        // You can redirect or handle session here
    } else {
        errorMsg.style.color = "red";
        errorMsg.textContent = "Invalid username or password.";
    }
}

// -------------------- CONTACT MODAL --------------------
// function openContact() {
//     document.getElementById('contactModal').style.display = 'flex';
// }

// function closeContact() {
//     document.getElementById('contactModal').style.display = 'none';
//     document.getElementById('contactMsg').textContent = '';
//     document.getElementById('contactForm').reset();
// }

// document.getElementById('contactForm').addEventListener('submit', function(e) {
//     e.preventDefault();

//     const name = document.getElementById('name').value.trim();
//     const email = document.getElementById('email').value.trim();
//     const message = document.getElementById('message').value.trim();
//     const contactMsg = document.getElementById('contactMsg');

//     if (!name || !email || !message) {
//         contactMsg.style.color = "red";
//         contactMsg.textContent = "Please fill in all fields.";
//         return;
//     }

//     contactMsg.style.color = "green";
//     contactMsg.textContent = "Thank you for contacting us!";
//     this.reset();
// });

// Function to handle closing the Contact page and redirecting to the index page.
function closeContact() {
    // 1. Clear any residual form data/messages (good practice)
    const contactMsg = document.getElementById('contactMsg');
    const contactForm = document.getElementById('contactForm');
    
    if (contactMsg) contactMsg.textContent = '';
    if (contactForm) contactForm.reset();
    
    // 2. *** THE CRITICAL CHANGE: Redirect the user back to the main page ***
    window.location.href = "index.html"; 
}

// Ensure the form submission (if successful) also redirects after a delay
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const message = document.getElementById('message').value.trim();
        const contactMsg = document.getElementById('contactMsg');

        if (!name || !email || !message) {
            contactMsg.style.color = "red";
            contactMsg.textContent = "Please fill in all fields.";
            return;
        }

        contactMsg.style.color = "green";
        contactMsg.textContent = "Thank you for contacting us! Redirecting to homepage...";
        this.reset();
        
        // Redirect after a short delay so the user sees the success message
        setTimeout(() => {
            window.location.href = "index.html"; 
        }, 2000); 
    });
}

// -------------------- DROPDOWN --------------------
function toggleDropdown(event) {
    event.preventDefault();
    const parent = event.target.closest(".dropdown");

    // Close other dropdowns
    document.querySelectorAll(".dropdown").forEach(d => {
        if (d !== parent) d.classList.remove("open");
    });

    // Toggle current dropdown
    parent.classList.toggle("open");
}

// Close dropdown if clicked outside
document.addEventListener("click", function(e) {
    if (!e.target.closest(".dropdown")) {
        document.querySelectorAll(".dropdown").forEach(d => d.classList.remove("open"));
    }
});


// -------------------- SELLER MODAL --------------------
function openSeller() {
    document.getElementById('sellerModal').style.display = 'flex';
}

function closeSeller() {
    document.getElementById('sellerModal').style.display = 'none';
    document.getElementById('sellerMsg').textContent = '';
    document.getElementById('sellerForm').reset();
}

document.getElementById('sellerForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('sellerName').value.trim();
    const email = document.getElementById('sellerEmail').value.trim();
    const phone = document.getElementById('sellerPhone').value.trim();
    const business = document.getElementById('sellerBusiness').value.trim();
    const products = document.getElementById('sellerProducts').value.trim();
    const sellerMsg = document.getElementById('sellerMsg');

    if (!name || !email || !phone || !business || !products) {
        sellerMsg.style.color = "red";
        sellerMsg.textContent = "Please fill in all fields.";
        return;
    }

    sellerMsg.style.color = "green";
    sellerMsg.textContent = "Thank you for registering as a seller!";
    this.reset();

    // Auto-close modal after 2 seconds
    setTimeout(() => {
        closeSeller();
    }, 2000);
});

// -------------------- RE-SELL MODAL --------------------
function openResell() {
    document.getElementById('resellModal').style.display = 'flex';
}

function closeResell() {
    document.getElementById('resellModal').style.display = 'none';
    document.getElementById('resellMsg').textContent = '';
    document.getElementById('resellForm').reset();
}

document.getElementById('resellForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('resellName').value.trim();
    const email = document.getElementById('resellEmail').value.trim();
    const phone = document.getElementById('resellPhone').value.trim();
    const business = document.getElementById('resellBusiness').value.trim();
    const products = document.getElementById('resellProducts').value.trim();
    const resellMsg = document.getElementById('resellMsg');

    if (!name || !email || !phone || !business || !products) {
        resellMsg.style.color = "red";
        resellMsg.textContent = "Please fill in all fields.";
        return;
    }

    resellMsg.style.color = "green";
    resellMsg.textContent = "Thank you for registering as a re-seller!";
    this.reset();

    // Auto-close modal after 2 seconds
    setTimeout(() => {
        closeResell();
    }, 2000);
});

// -------------------- NEWSLETTER --------------------
document.getElementById("newsletterForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const emailInput = this.querySelector("input[type='email']");
    const newsletterMsg = document.getElementById("newsletterMsg");

    if (!emailInput.value.trim()) {
        newsletterMsg.style.color = "red";
        newsletterMsg.textContent = "Please enter your email.";
        return;
    }

    const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
    if (!emailInput.value.match(emailPattern)) {
        newsletterMsg.style.color = "red";
        newsletterMsg.textContent = "Please enter a valid email.";
        return;
    }

    newsletterMsg.style.color = "lightgreen";
    newsletterMsg.textContent = "Thank you for subscribing!";
    emailInput.value = "";
});

// -------------------- SMOOTH SCROLL --------------------
document.querySelectorAll('a[href^="#about-section"]').forEach(anchor => {
    anchor.addEventListener("click", function(e) {
        e.preventDefault();
        document.querySelector(this.getAttribute("href")).scrollIntoView({
            behavior: "smooth"
        });
    });
});
