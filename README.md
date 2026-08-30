# 📸 PolyPhotos

> **Multi-Account Cloud Photo Backup & Auto-Chaining Storage Orchestrator.**  
> *Combine multiple 15GB free Google accounts into an infinite photo backup pool.*  
> An open-source project by **[Velorio Labs](https://github.com/VelorioLabs)**.

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Theme](https://img.shields.io/badge/Theme-Dark%20%26%20Light-yellow.svg)](https://veloriolabs.github.io/polyphotos)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-veloriolabs.github.io%2Fpolyphotos-ccff00)](https://veloriolabs.github.io/polyphotos)
[![Org](https://img.shields.io/badge/VelorioLabs-Ecosystem-white)](https://github.com/VelorioLabs)

---

## ⚡ The Problem PolyPhotos Solves

Google offers only 15GB of free storage across Google Photos, Gmail, and Google Drive. Once it reaches 13GB or 14GB, Google starts blocking emails and badgering you to pay \$20–\$100/year.

**PolyPhotos** allows you to link multiple free Google accounts (e.g. `user1@gmail.com`, `user2@gmail.com`, `user3@gmail.com` = **45GB+ Free Pool**) and manages them as one single, infinite photo vault:

1. ⚠️ **Proactive Threshold Warning**: When Account 1 has less than 1.5 GB remaining, PolyPhotos warns you and auto-switches uploads to Account 2.
2. 🔄 **Differential Sync**: Only **new remaining photos** are uploaded to the new account. Old photos remain in Account 1 with zero duplicate uploads.
3. 🖼️ **Unified Gallery Timeline**: Merges all photos from all linked accounts into a single, beautiful chronological gallery.
4. 🌓 **Dark & Light Mode**: Seamless 1-click theme switcher.
5. 💾 **Local Archive Offloader**: 1-click export of full accounts to your PC hard drive over LocalDrop to free up cloud space!

---

## 📱 Mobile APK & Web Client

- **Live Web Client**: [https://veloriolabs.github.io/polyphotos](https://veloriolabs.github.io/polyphotos)
- **Android APK Build**: Configured with Capacitor (`com.veloriolabs.polyphotos`).

---

## 🛠️ Development

```bash
git clone https://github.com/VelorioLabs/PolyPhotos.git
cd PolyPhotos
npm install
npm test
```

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
