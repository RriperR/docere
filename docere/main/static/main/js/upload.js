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
            const fileName = input.files[0].name;
            fileNameDisplay.textContent = `Выбран файл: ${fileName}`; // Отображаем имя файла
        }
    });
});
