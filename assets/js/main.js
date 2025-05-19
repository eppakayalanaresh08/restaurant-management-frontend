document.addEventListener('DOMContentLoaded', function () {
    axios.get('https://restaurant-management-backend-4g2b.onrender.com/api/tables')
        .then(response => {
            const tables = response.data;
            const total = tables.length;
            const available = tables.filter(t => t.status === 'available').length;
            const occupied = tables.filter(t => t.status === 'occupied').length;

            document.getElementById('totalTables').textContent = total;
            document.getElementById('availableTables').textContent = available;
            document.getElementById('occupiedTables').textContent = occupied;
        })
        .catch(error => {
            console.error('Failed to fetch dashboard data', error);
        });

    // Similarly load reservations data
    axios.get('https://restaurant-management-backend-4g2b.onrender.com/api/reservations')
        .then(response => {
            const reservations = response.data.slice(0, 5); // recent 5
            const tbody = document.querySelector('#reservationsTable tbody');
            tbody.innerHTML = '';

            reservations.forEach(res => {
                tbody.innerHTML += `
                    <tr>
                        <td>${res.tableNumber}</td>
                        <td>${res.customerName}</td>
                        <td>${new Date(res.time).toLocaleString()}</td>
                        <td>${res.partySize}</td>
                        <td>${res.status}</td>
                    </tr>
                `;
            });

            document.getElementById('totalReservations').textContent = reservations.length;
        })
        .catch(error => {
            console.error('Failed to fetch reservations', error);
        });
});
