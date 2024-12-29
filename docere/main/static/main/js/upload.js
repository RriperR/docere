document.addEventListener('DOMContentLoaded', () => {
    const dropzone = document.querySelector('.dropzone');
    const input = document.querySelector('.dropzone__input');
    const fileNameDisplay = document.querySelector('.dropzone__text'); // Для отображения имени файла

    // Изменение цвета dropzone при drag-and-drop
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.backgroundColor = '#F5F5DC'; // Изменяем цвет при наведении
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.style.backgroundColor = '#f9f9f9'; // Возвращаем цвет
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.backgroundColor = '#f9f9f9';

        // Обрабатываем файл из drag-and-drop
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            input.files = files; // Привязываем файлы к input
            const fileName = files[0].name;
            fileNameDisplay.textContent = `Выбран файл: ${fileName}`; // Отображаем имя файла
        }
    });

    // Обрабатываем клик по dropzone
    dropzone.addEventListener('click', () => {
        if (document.activeElement !== input) {
            input.click(); // Открываем окно выбора файла
        }
    });

    // Обрабатываем выбор файла через input
    input.addEventListener('change', () => {
        if (input.files.length > 0) {
            handleFileUpload(input.files[0]); // Обрабатываем выбранный файл
        }
    });

    // Обработка файла
    function handleFileUpload(file) {
        if (file.type !== 'application/zip') {
            alert('Пожалуйста, загрузите ZIP-архив.');
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
            if (data.success) {
                alert('Архив обработан успешно.');
                console.log('Результат:', data.result);
            } else {
                alert('Ошибка при обработке: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при загрузке.');
        });
    }

    function getCSRFToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]').value;
    }
});
