import pydicom

file_path = "30bcii29j69i03011331.dcm"

# Чтение DICOM файла
dicom_data = pydicom.dcmread(file_path)

# Печать всех метаданных
print(dicom_data)
