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
    const modalPersonId = document.getElementById('modalId');
    const modalIdentificacionInput = document.getElementById('modalIdentificacion');
    const modalNombreInput = document.getElementById('modalNombre');
    const modalApellidoInput = document.getElementById('modalApellido');
    const modalRolSelect = document.getElementById('modal-select-rol');
    const modalGeneroSelect = document.getElementById('modal-select-genero');
    const modalEmailInput = document.getElementById('modalEmail');
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
                            listItem.textContent = `${person.nombre_usuario} (Identificación: ${person.identificacion})`;
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
                <td>${person.identificacion}</td>
                <td>${person.nombre_usuario}</td>
                <td>${person.apellido_usuario}</td>
                <td>${person.rol}</td>
                <td>${person.genero}</td>
                <td>${person.email}</td>
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
        const identificacion = document.getElementById('identificacion').value;
        const nombre = document.getElementById('nombre').value;
        const apellido = document.getElementById('apellido').value;
        const rol = document.getElementById('select-rol').value;
        const genero = document.getElementById('select-genero').value;
        const email = document.getElementById('email').value;
        const contrasenna = document.getElementById('contrasenna').value;
        
        if (id) {
            updatePerson(id, { identificacion, nombre, apellido, rol, genero, email, contrasenna });
        } else {
            addPerson({ identificacion, nombre, apellido, rol, genero, email, contrasenna });
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
    fetch(`/person/${id}`)
        .then(response => response.json())
        .then(person => {
            modalPersonId.value = person.id
            modalIdentificacionInput.value = person.identificacion;
            modalNombreInput.value = person.nombre_usuario;
            modalApellidoInput.value = person.apellido_usuario;
            modalRolSelect.value = person.rol;
            modalGeneroSelect.value = person.genero;
            modalEmailInput.value = person.email;
            
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
    const id = modalPersonId.value
    const identificacion = modalIdentificacionInput.value;
    const nombre = modalNombreInput.value;
    const apellido = modalApellidoInput.value;
    const rol = modalRolSelect.value;
    const genero = modalGeneroSelect.value; // Obtiene la nueva contraseña si fue ingresada
    const email = modalEmailInput.value;

    const personData = { identificacion, nombre, apellido, rol, genero, email };

    updatePerson(id, personData);
    editModal.classList.add('hidden');
});

closeModal.addEventListener('click', () => {
    editModal.classList.add('hidden');
});
});
