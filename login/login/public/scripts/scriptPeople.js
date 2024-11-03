document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const suggestionsList = document.getElementById('suggestions');
    const infoTable = document.getElementById('infoTable');
    const tableBody = infoTable.querySelector('tbody');
    const personForm = document.getElementById('personForm');
    const submitBtn = document.getElementById('submitBtn');

    const editModal = document.getElementById('editModal');
    const modalForm = document.getElementById('modalForm');
    const closeModal = document.getElementById('closeModal');
    const modalPersonIdInput = document.getElementById('modalPersonId');
    const modalPersonIdentificationInput = document.getElementById('modalPersonIdentification');
    const modalPersonNameInput = document.getElementById('modalPersonName');
    const modalPersonAgeInput = document.getElementById('modalPersonAge');
    const modalPersonAddressInput = document.getElementById('modalPersonAddress');
    const modalPasswordInput = document.getElementById('modalPassword'); // Nuevo campo de contraseña opcional
    const modalSubmitBtn = document.getElementById('modalSubmitBtn');


    // Manejar la búsqueda
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.trim();
  
        if (searchTerm) {
            fetch(`/search?term=${searchTerm}`)
                .then(response => response.json())
                .then(data => {
                    suggestionsList.innerHTML = '';
                    if (data.length > 0) {
                        data.forEach(person => {
                            const listItem = document.createElement('li');
                            listItem.textContent = `(Nombre: ${person.name}) (Identificación: ${person.identificacion})`;
                            listItem.addEventListener('click', () => displayPersonInfo(person));
                            suggestionsList.appendChild(listItem);
                        });
                    } else {
                        suggestionsList.innerHTML = '<li>No results found</li>';
                    }
                });
        } else {
            suggestionsList.innerHTML = '';
        }
    });

    // Mostrar información de la persona
    function displayPersonInfo(person) {
        suggestionsList.innerHTML = '';
        searchInput.value = '';
  
        infoTable.classList.remove('hidden');
        tableBody.innerHTML = `
            <tr>
                <td>${person.id}</td>
                <td>${person.identificacion}</td>
                <td>${person.name}</td>
                <td>${person.apellido}</td>
                <td>${person.rol}</td>
                <td>${person.genero}</td>
                <td>${person.contraseña}</td>
                <td>
                    <button onclick="openEditModal(${person.id})">Edit</button>
                    <button onclick="deletePerson(${person.id})">Delete</button>
                </td>
            </tr>
        `;
    }

    // Manejar el envío del formulario
    personForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const id = document.getElementById('personId').value;
        const identificacion = document.getElementById('personIdentification').value;
        const name = document.getElementById('nombre').value;
        const apellido = document.getElementById('apellido').value;
        const rol = document.getElementById('select-rol').value;
        const genero = document.getElementById('select-genero').value;
        const password = document.getElementById('password').value;
        
        
        if (id) {
            updatePerson(id, {identificacion, name,apellido,rol,genero,password });
        } else {
            addPerson({identificacion, name,apellido,rol,genero,password });
        }
    });

    // Función para agregar una persona
    function addPerson(person) {
        fetch('/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(person)
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            location.reload();
        });
    }

// Función para actualizar una persona
function updatePerson(id, person) {
    fetch(`/update/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(person)
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        location.reload();
    });
}

    // Función para eliminar una persona
    window.deletePerson = function(id) {
        if (confirm('Are you sure you want to delete this person?')) {
            fetch(`/delete/${id}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                location.reload();
            });
        }
    }

    // Función para abrir el modal de edición
window.openEditModal = function(id) {
    fetch(`/usuarios/${id}`)
        .then(response => response.json())
        .then(person => {
            modalPersonIdInput.value = person.id;
            modalPersonIdentificationInput.value = person.identificacion;
            modalPersonNameInput.value = person.nombre;
            modalPersonAgeInput.value = person.apellido;
            modalPersonAddressInput.value = person.genero.value;
            editModal.classList.remove('hidden');
        });
};
    // Cerrar el modal
    closeModal.addEventListener('click', () => {
        editModal.classList.add('hidden');
    });

// Manejar el envío del formulario del modal
modalForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const id = modalPersonIdInput.value;
    const identificacion = modalPersonIdentificationInput.value;
    const name = modalPersonNameInput.value;
    const apellido = modalPersonAgeInput.value;
    const genero = modalPersonAddressInput.value;
    const password = modalPasswordInput.value; // Obtiene la nueva contraseña si fue ingresada

    const personData = { identificacion, name, apellido, genero };
    if (password) personData.password = password; // Agrega el campo solo si hay una nueva contraseña

    updatePerson(id, personData);
    editModal.classList.add('hidden');
});

closeModal.addEventListener('click', () => {
    editModal.classList.add('hidden');
});
});
