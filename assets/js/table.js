document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const tablesTable = document.getElementById('tablesTable');
    const tableForm = document.getElementById('tableForm');
    const saveTableBtn = document.getElementById('saveTable');
    const addTableModal = new bootstrap.Modal(document.getElementById('addTableModal'));
    const qrCodeModal = new bootstrap.Modal(document.getElementById('qrCodeModal'));
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const printQRBtn = document.getElementById('printQR');
    
    // Current table for QR generation
    let currentTableForQR = null;
    
    // Load tables on page load
    loadTables();
    
    // Event Listeners
    saveTableBtn.addEventListener('click', saveTable);
    printQRBtn.addEventListener('click', printQRCode);
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    
    // Load tables from API
    function loadTables(filters = {}) {
        axios.get('https://restaurant-management-backend-4g2b.onrender.com/api/tables', { params: filters })
            .then(response => {
                renderTables(response.data);
            })
            .catch(error => {
                console.error('Error loading tables:', error);
                alert('Failed to load tables');
            });
    }
    
    // Render tables in the table
    function renderTables(tables) {
        const tbody = tablesTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        if (tables.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No tables found</td></tr>';
            return;
        }
        
        tables.forEach(table => {
            const row = document.createElement('tr');
            
            // Status badge
            let statusClass = '';
            switch(table.status) {
                case 'available': statusClass = 'bg-success'; break;
                case 'occupied': statusClass = 'bg-danger'; break;
                case 'reserved': statusClass = 'bg-warning text-dark'; break;
                default: statusClass = 'bg-secondary';
            }
            
            row.innerHTML = `
                <td data-label="Table #">${table.tableNumber}</td>
                <td data-label="Location">${table.location}</td>
                <td data-label="Capacity">${table.capacity}</td>
                <td data-label="Status"><span class="badge ${statusClass}">${table.status}</span></td>
                <td data-label="QR Code">
                    <button class="btn btn-sm btn-outline-primary view-qr" data-id="${table._id}">
                        <i class="fas fa-qrcode"></i> View
                    </button>
                </td>
                <td data-label="Actions">
                    <button class="btn btn-sm btn-outline-secondary edit-table" data-id="${table._id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-table" data-id="${table._id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Add event listeners to action buttons
        document.querySelectorAll('.edit-table').forEach(btn => {
            btn.addEventListener('click', editTable);
        });
        
        document.querySelectorAll('.delete-table').forEach(btn => {
            btn.addEventListener('click', deleteTable);
        });
        
        document.querySelectorAll('.view-qr').forEach(btn => {
            btn.addEventListener('click', showQRCode);
        });
    }
    
    // Save table (create or update)
    function saveTable() {
        const formData = new FormData(tableForm);
        const tableData = Object.fromEntries(formData.entries());
        
        // Convert capacity to number
        tableData.capacity = parseInt(tableData.capacity);
        
        // Determine if we're creating or updating
        const isEdit = tableForm.dataset.editId;
        const request = isEdit 
            ? axios.put(`https://restaurant-management-backend-4g2b.onrender.com/api/tables/${tableForm.dataset.editId}`, tableData)
            : axios.post('https://restaurant-management-backend-4g2b.onrender.com/api/tables', tableData);
        
        request.then(response => {
            addTableModal.hide();
            loadTables();
            tableForm.reset();
            delete tableForm.dataset.editId;
        })
        .catch(error => {
            console.error('Error saving table:', error);
            alert('Failed to save table');
        });
    }
    
    // Edit table
    function editTable(event) {
        const tableId = event.currentTarget.dataset.id;
        
        axios.get(`https://restaurant-management-backend-4g2b.onrender.com/api/tables/${tableId}`)
            .then(response => {
                const table = response.data;
                
                // Fill the form
                tableForm.querySelector('[name="tableNumber"]').value = table.tableNumber;
                tableForm.querySelector('[name="location"]').value = table.location;
                tableForm.querySelector('[name="capacity"]').value = table.capacity;
                tableForm.querySelector('[name="status"]').value = table.status;
                
                // Set edit mode
                tableForm.dataset.editId = tableId;
                
                // Show modal
                addTableModal.show();
            })
            .catch(error => {
                console.error('Error loading table:', error);
                alert('Failed to load table data');
            });
    }
    
    // Delete table
    function deleteTable(event) {
        if (!confirm('Are you sure you want to delete this table?')) return;
        
        const tableId = event.currentTarget.dataset.id;
        console.log(tableId,'tableId')
        
        axios.delete(`https://restaurant-management-backend-4g2b.onrender.com/api/tables/${tableId}`)
            .then(response => {
                loadTables();
            })
            .catch(error => {
                console.error('Error deleting table:', error);
                alert('Failed to delete table');
            });
    }
    
    // Show QR code for table
    function showQRCode(event) {
        const tableId = event.currentTarget.dataset.id;
        
        axios.get(`https://restaurant-management-backend-4g2b.onrender.com/api/tables/${tableId}`)
            .then(response => {
                currentTableForQR = response.data;
                
                // Clear previous QR code
                qrCodeContainer.innerHTML = '';
                
                // Generate new QR code
                const qrCode = document.createElement('canvas');
                QRCode.toCanvas(qrCode, `${window.location.origin}/tables/${tableId}/menu`, {
                    width: 200,
                    margin: 2,
                    color: {
                        dark: '#2E7D32', // Green
                        light: '#ffffff'
                    }
                }, error => {
                    if (error) {
                        console.error('Error generating QR code:', error);
                        qrCodeContainer.innerHTML = '<p class="text-danger">Failed to generate QR code</p>';
                        return;
                    }
                    
                    qrCodeContainer.appendChild(qrCode);
                });
                
                // Show modal
                qrCodeModal.show();
            })
            .catch(error => {
                console.error('Error loading table:', error);
                alert('Failed to load table data');
            });
    }
    
    // Print QR code
    function printQRCode() {
        const printWindow = window.open('', '', 'width=600,height=600');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Table QR Code - ${currentTableForQR.tableNumber}</title>
                    <style>
                        body { text-align: center; padding: 20px; font-family: Arial; }
                        h1 { color: #2E7D32; margin-bottom: 5px; }
                        p { color: #666; margin-top: 0; }
                    </style>
                </head>
                <body>
                    <h1>Table ${currentTableForQR.tableNumber}</h1>
                    <p>Scan to view menu</p>
                    <img src="${qrCodeContainer.querySelector('canvas').toDataURL()}" width="300">
                    <p>${currentTableForQR.location} • Capacity: ${currentTableForQR.capacity}</p>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }
    
    // Apply filters
    function applyFilters() {
        const filters = {
            status: document.getElementById('statusFilter').value,
            location: document.getElementById('locationFilter').value,
            capacity: document.getElementById('capacityFilter').value
        };
        
        loadTables(filters);
    }
});