const dropzone = document.querySelector('.dropzone');
const form = document.querySelector('#upload-form');
const input = document.querySelector('.dropzone__input');
const fileNameDisplay = document.querySelector('.dropzone__text');

dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.backgroundColor = '#F5F5DC'; // Изменяем цвет при наведении
});

dropzone.addEventListener('dragleave', () => {
    dropzone.style.backgroundColor = '#f9f9f9'; // Возвращаем цвет
});

dropzone.addEventListener('drop', (e) => {
    e.preventDefault();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        input.files = files; // Привязываем файлы к input
        const fileName = files[0].name;
        fileNameDisplay.textContent = `Выбран файл: ${fileName}`; // Отображаем имя файла
    }
});

dropzone.addEventListener('click', () => {
    if (document.activeElement !== input) {
        input.click();
    }
});

// Обработка выбора файла через input
input.addEventListener('change', () => {
    if (input.files.length > 0) {
        const fileName = input.files[0].name;
        fileNameDisplay.textContent = `Выбран файл: ${fileName}`; // Обновляем имя файла
    }
});

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const file = input.files[0];
    if (!file) {
        alert('Пожалуйста, выберите файл.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    fetch('/process-zip/', {
    method: 'POST',
    body: formData,
    headers: {
        'X-CSRFToken': getCSRFToken()
    }
})
    .then(response => response.json())
    .then(data => {
        console.log('Ответ от сервера:', data); // Отладочный вывод
        if (data.success) {
            if (data.fios && data.fios.length > 1) {
                showFioSelectionDialog(data.fios); // Показать окно выбора
            } else if (data.fios && data.fios.length === 1) {
                alert('ФИО обработано: ' + data.fios[0]);
            } else {
                alert('ФИО не найдено.');
            }
        } else {
            alert('Ошибка обработки: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        alert('Произошла ошибка.');
    });

});

function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]').value;
}

function showFioSelectionDialog(fios) {
    // Создаём модальное окно
    const dialog = document.createElement('div');
    dialog.classList.add('fio-dialog');

    const title = document.createElement('h3');
    title.textContent = 'Выберите ФИО для обработки:';
    dialog.appendChild(title);

    const select = document.createElement('select');
    select.id = 'fio-select';

    fios.forEach(fio => {
        const option = document.createElement('option');
        option.value = fio;
        option.textContent = fio;
        select.appendChild(option);
    });
    dialog.appendChild(select);

    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Подтвердить';
    confirmButton.addEventListener('click', () => {
        const selectedFio = document.getElementById('fio-select').value;
        sendSelectedFio(selectedFio);
        dialog.remove(); // Удаляем модальное окно
    });
    dialog.appendChild(confirmButton);

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Отмена';
    cancelButton.addEventListener('click', () => dialog.remove());
    dialog.appendChild(cancelButton);

    document.body.appendChild(dialog);

    // Стили для диалога
    const style = document.createElement('style');
    style.textContent = `
        .fio-dialog {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 1px solid #ccc;
            padding: 20px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            text-align: center;
        }
        .fio-dialog h3 {
            margin-bottom: 15px;
        }
        .fio-dialog select {
            margin-bottom: 15px;
            width: 100%;
        }
        .fio-dialog button {
            margin: 5px;
            padding: 5px 10px;
        }
    `;
    document.head.appendChild(style);
}

function sendSelectedFio(fio) {
    fetch('/confirm-fio/', {
        method: 'POST',
        body: JSON.stringify({ selectedFio: fio }),
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(`ФИО ${data.patient} сохранено успешно.`);
            } else {
                alert('Ошибка при сохранении ФИО.');
            }
        })
        .catch(error => {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при сохранении.');
        });
}


