



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
    let isEditMode = false;
    let currentEditTableId = null;
    
    // API Endpoints
    const API_BASE_URL = 'https://restaurant-management-backend-4g2b.onrender.com/api';
    const TABLES_API = {
        GET_ALL: `${API_BASE_URL}/tables`,
        GET_ONE: (id) => `${API_BASE_URL}/tables/${id}`,
        CREATE: `${API_BASE_URL}/tables`,
        UPDATE: (id) => `${API_BASE_URL}/tables/${id}`,
        DELETE: (id) => `${API_BASE_URL}/tables/${id}`,
        UPDATE_STATUS: (id) => `${API_BASE_URL}/tables/${id}/status`
    };
    
    // Load tables on page load
    loadTables();
    
    // Event Listeners
    saveTableBtn.addEventListener('click', handleSaveTable);
    printQRBtn.addEventListener('click', printQRCode);
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.addEventListener('change', handleStatusChange);
    
    // ======================
    // MAIN FUNCTIONS
    // ======================
    
    // Load tables from API
    function loadTables(filters = {}) {
        showLoading(true);
        
        axios.get(TABLES_API.GET_ALL, { params: filters })
            .then(response => {
                renderTables(response.data);
            })
            .catch(error => {
                console.error('Error loading tables:', error);
                showAlert('Failed to load tables', 'danger');
            })
            .finally(() => {
                showLoading(false);
            });
    }
    
    // Handle save table (both create and update)
    function handleSaveTable() {
        const formData = new FormData(tableForm);
        const tableData = Object.fromEntries(formData.entries());
        
        // Convert capacity to number
        tableData.capacity = parseInt(tableData.capacity);
        
        if (isEditMode) {
            updateTable(currentEditTableId, tableData);
        } else {
            createTable(tableData);
        }
    }
    
    // Create a new table
    function createTable(tableData) {
        showLoading(true, 'Creating table...');
        
        axios.post(TABLES_API.CREATE, tableData)
            .then(response => {
                addTableModal.hide();
                loadTables();
                resetForm();
                showAlert('Table created successfully', 'success');
            })
            .catch(error => {
                console.error('Error creating table:', error);
                showAlert(error.response?.data?.message || 'Failed to create table', 'danger');
            })
            .finally(() => {
                showLoading(false);
            });
    }
    
    // Update existing table
    function updateTable(tableId, tableData) {
        showLoading(true, 'Updating table...');
        
        axios.put(TABLES_API.UPDATE(tableId), tableData)
            .then(response => {
                console.log(response,'responseresponse')
                addTableModal.hide();
                loadTables();
                resetForm();
                showAlert('Table updated successfully', 'success');
            })
            .catch(error => {
                console.error('Error updating table:', error);
                showAlert(error.response?.data?.message || 'Failed to update table', 'danger');
            })
            .finally(() => {
                showLoading(false);
            });
    }
    
    // Delete table
    function deleteTable(event) {
        const tableId = event.currentTarget.dataset.id;
        
        if (!confirm('Are you sure you want to delete this table? This action cannot be undone.')) {
            return;
        }
        
        showLoading(true, 'Deleting table...');
        
        axios.delete(TABLES_API.DELETE(tableId))
            .then(response => {
                loadTables();
                showAlert('Table deleted successfully', 'success');
            })
            .catch(error => {
                console.error('Error deleting table:', error);
                showAlert(error.response?.data?.message || 'Failed to delete table', 'danger');
            })
            .finally(() => {
                showLoading(false);
            });
    }
    
    // ======================
    // UI FUNCTIONS
    // ======================
    
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
            
            row.innerHTML = `
                <td data-label="Table #">${table.tableNumber}</td>
                <td data-label="Location">${table.location}</td>
                <td data-label="Capacity">${table.capacity}</td>
                <td data-label="Status">
                    <select class="form-select form-select-sm status-select" 
                            data-id="${table._id}" 
                            data-current-status="${table.status}">
                        <option value="available" ${table.status === 'available' ? 'selected' : ''}>Available</option>
                        <option value="occupied" ${table.status === 'occupied' ? 'selected' : ''}>Occupied</option>
                        <option value="reserved" ${table.status === 'reserved' ? 'selected' : ''}>Reserved</option>
                    </select>
                </td>
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

            // Add event listeners to buttons in this row
            row.querySelector('.view-qr').addEventListener('click', () => showQRModal(table));
            row.querySelector('.edit-table').addEventListener('click', () => setupEditModal(table));
            row.querySelector('.delete-table').addEventListener('click', deleteTable);
            
            tbody.appendChild(row);
        });
    }
    
    // Setup the edit modal with table data
    function setupEditModal(table) {
        isEditMode = true;
        currentEditTableId = table._id;
        
        // Fill the form
        tableForm.querySelector('[name="tableNumber"]').value = table.tableNumber;
        tableForm.querySelector('[name="location"]').value = table.location;
        tableForm.querySelector('[name="capacity"]').value = table.capacity;
        tableForm.querySelector('[name="status"]').value = table.status;
        
        // Update modal title
        document.querySelector('#addTableModal .modal-title').textContent = 'Edit Table';
        
        // Show modal
        addTableModal.show();
    }
    
    // Reset the form and edit mode
    function resetForm() {
        tableForm.reset();
        isEditMode = false;
        currentEditTableId = null;
        document.querySelector('#addTableModal .modal-title').textContent = 'Add New Table';
    }
    
    // Show QR code modal
    function showQRModal(table) {
        currentTableForQR = table;
        
        // Clear previous QR code
        qrCodeContainer.innerHTML = '';
        
        // Generate new QR code
        const qrCode = document.createElement('canvas');
        QRCode.toCanvas(qrCode, `${window.location.origin}/tables/${table._id}/menu`, {
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
    }
    
    // Handle status changes
    function handleStatusChange(event) {
        if (!event.target.classList.contains('status-select')) return;
        
        const select = event.target;
        const tableId = select.dataset.id;
        const newStatus = select.value;
        const currentStatus = select.dataset.currentStatus;
        
        // Don't make API call if status didn't change
        if (newStatus === currentStatus) return;
        
        // Show loading state
        select.disabled = true;
        
        axios.put(TABLES_API.UPDATE_STATUS(tableId), { status: newStatus })
            .then(response => {
                // Update the current status attribute
                select.dataset.currentStatus = newStatus;
                showAlert('Status updated successfully', 'success');
            })
            .catch(error => {
                console.error('Error updating status:', error);
                // Revert to previous value
                select.value = currentStatus;
                showAlert('Failed to update status', 'danger');
            })
            .finally(() => {
                select.disabled = false;
            });
    }
    
    // Apply filters
    // function applyFilters() {
    //     const filters = {
    //         status: document.getElementById('statusFilter').value,
    //         location: document.getElementById('locationFilter').value,
    //         capacity: document.getElementById('capacityFilter').value
    //     };
        
    //     loadTables(filters);
    // }
    





    function applyFilters() {
        const filters = {
            status: document.getElementById('statusFilter').value || undefined,
            location: document.getElementById('locationFilter').value || undefined,
            minCapacity: document.getElementById('capacityFilter').value || undefined
        };
        
        // Remove undefined filters
        Object.keys(filters).forEach(key => {
            if (filters[key] === undefined) {
                delete filters[key];
            }
        });
        
        loadTables(filters);
    }











    // Print QR code
    function printQRCode() {
        if (!currentTableForQR) return;
        
        const printWindow = window.open('', '', 'width=600,height=600');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Table QR Code - ${currentTableForQR.tableNumber}</title>
                    <style>
                        body { text-align: center; padding: 20px; font-family: Arial; }
                        h1 { color: #2E7D32; margin-bottom: 5px; }
                        p { color: #666; margin-top: 0; }
                        img { margin: 20px auto; display: block; }
                    </style>
                </head>
                <body>
                    <h1>Table ${currentTableForQR.tableNumber}</h1>
                    <p>Scan to view menu</p>
                    <img src="${qrCodeContainer.querySelector('canvas').toDataURL()}" width="300">
                    <p>${currentTableForQR.location} • Capacity: ${currentTableForQR.capacity}</p>
                    <p>${new Date().toLocaleString()}</p>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }
    
    // ======================
    // HELPER FUNCTIONS
    // ======================
    
    // Show alert message
    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '9999';
        alertDiv.style.minWidth = '300px';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto dismiss after 3 seconds
        setTimeout(() => {
            const alert = bootstrap.Alert.getOrCreateInstance(alertDiv);
            alert.close();
        }, 3000);
    }
    
    // Show loading state
    function showLoading(isLoading, message = '') {
        if (isLoading) {
            saveTableBtn.disabled = true;
            saveTableBtn.innerHTML = `
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ${message || 'Loading...'}
            `;
        } else {
            saveTableBtn.disabled = false;
            saveTableBtn.innerHTML = `
                <i class="fas fa-save mr-1"></i> ${isEditMode ? 'Update' : 'Save'} Table
            `;
        }
    }
});