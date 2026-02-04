document.getElementById('resellForm').onsubmit = async e => {
    e.preventDefault();
    const formData = new FormData(e.target); 

    const res = await fetch('/api/resell/add', {
        method: 'POST',
        headers: {
            // NOTE: Do NOT set Content-Type header when sending FormData. 
            // The browser will set it automatically with the boundary string.
            'Authorization': 'Bearer ' + localStorage.getItem('resellerToken')
        },
        body: formData
    });

    const data = await res.json();
    if(data.success) {
        alert(data.message);
        window.location.href = 'resell.html'; // Redirect to see the new item
    } else {
        alert("Upload failed: " + data.message);
    }
};