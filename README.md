# Final Project Computer Vision

Repositori ini berisi kode sumber, dataset, dan laporan untuk Proyek Akhir mata kuliah Computer Vision. Proyek ini berfokus pada sistem pengenalan wajah (*Face Recognition*) dengan membandingkan dan mengimplementasikan beberapa model *State-of-the-Art* (SOTA).

## 📂 Struktur Repositori

Berikut adalah penjelasan mengenai isi folder dan file dalam repositori ini:

| Folder / File | Deskripsi |
| :--- | :--- |
| **`Apps/`** | Kode sumber aplikasi antarmuka (Frontend/Backend), dikembangkan menggunakan TypeScript. |
| **`Face.evoLVe/`** | Implementasi library/model *Face.evoLVe* untuk pengenalan wajah performa tinggi. |
| **`FaceNet/`** | Implementasi model *FaceNet* (Google) untuk embedding wajah. |
| **`Insightface/`** | Implementasi model *InsightFace* (ArcFace/RetinaFace) untuk analisis wajah 2D/3D. |
| **`dataset/`** | Kumpulan data gambar asli yang digunakan dalam proyek. |
| **`dataset_augmented/`** | Kumpulan data yang telah melalui proses augmentasi untuk variasi training. |
| **`reference/`** | Jurnal, paper, atau referensi yang mendukung penelitian proyek ini. |
| **`report/`** | Dokumen laporan akhir proyek. |
| **`video present/`** | Video presentasi atau demo hasil proyek. |
| **`augmentation.ipynb`** | *Jupyter Notebook* berisi skrip untuk melakukan augmentasi data citra. |

## 🛠 Teknologi & Model

Proyek ini dibangun menggunakan teknologi berikut:

* **Bahasa Pemrograman:**
    * Python (Jupyter Notebook) - Untuk pemrosesan data & model DL.
    * TypeScript - Untuk pengembangan aplikasi (*Apps*).
* **Computer Vision Models:**
    * FaceNet
    * InsightFace
    * Face.evoLVe

## 🚀 Cara Menggunakan

1. **Clone Repositori**
   ```bash
   git clone [https://github.com/jason32456/Final_Project_Computer_Vision.git](https://github.com/jason32456/Final_Project_Computer_Vision.git)
   cd Final_Project_Computer_Vision

2. **Eksplorasi Data Buka file augmentation.ipynb menggunakan Jupyter Notebook atau Google Colab untuk melihat bagaimana dataset diproses.**

3. **Menjalankan Aplikasi Silakan buka folder Apps/ dan ikuti instruksi spesifik di dalamnya (biasanya memerlukan instalasi npm install atau sejenisnya jika berbasis Node.js/TypeScript).**
