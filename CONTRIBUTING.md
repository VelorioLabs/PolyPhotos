# Contributing to VelorioLabs

Thank you for your interest in contributing to **VelorioLabs** open-source projects! We welcome contributions from developers, researchers, and security analysts of all skill levels.

---

## 📜 Code of Conduct
We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Please treat all community members with respect and professionalism.

---

## 🛠️ How to Contribute

1. **Fork the Repository**: Click the 'Fork' button at the top right of the GitHub repository.
2. **Clone your Fork**:
   ```bash
   git clone https://github.com/<your-username>/<repo-name>.git
   cd <repo-name>
   ```
3. **Create a Feature Branch**:
   ```bash
   git checkout -b feat/your-awesome-feature
   ```
4. **Make Changes & Test**: Ensure all unit tests and linting pass:
   ```bash
   pytest tests/  # or python -m unittest discover -s tests
   ```
5. **Commit with Meaningful Messages**: Follow conventional commits:
   - `feat: add real-time stream encryption`
   - `fix: resolve WebSocket reconnect timeout`
   - `docs: update API usage guidelines`
6. **Push and Submit a Pull Request (PR)**:
   ```bash
   git push origin feat/your-awesome-feature
   ```
   Open a PR against the `main` branch with a clear description of your changes.

---

## 🧪 Development Standards
- Maintain clean, self-documenting code with informative docstrings.
- Ensure 100% test pass rate for all pull requests.
- Avoid introducing heavy unvetted external dependencies.

---

## 📬 Questions & Community
Join our development discussions or open an Issue on GitHub for questions, feature requests, or bug reports.
