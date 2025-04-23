# Timesheet Quick Entry

![Timesheet Quick Entry](https://arkone.dev/assets/img/timesheet-quick-entry-hero.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Frappe](https://img.shields.io/badge/Frappe-v14+-blue)](https://github.com/frappe/frappe)
[![ERPNext](https://img.shields.io/badge/ERPNext-v14+-orange)](https://github.com/frappe/erpnext)

> Streamline your project management workflow with faster timesheet entry, task assignment, and status management.

## 🚀 Features

- **🕒 Quick Timesheet Entries** - Add timesheet entries directly from your task view
- **✅ Task Management** - One-click task assignment and status changes
- **⚡ Integrated Workflow** - Complete tasks and submit timesheets in a single action
- **🔄 Real-time Updates** - Instantly reflect changes in task status and assignments
- **🎨 Modern UI** - Clean, intuitive interface that enhances productivity

## 📋 Overview

Timesheet Quick Entry is a Frappe application that enhances project management in ERPNext by providing a streamlined interface for managing tasks and timesheets. It's designed to reduce friction in daily project tracking and reporting, helping teams stay productive and managers stay informed.

Developed by [ArkOne Software](https://arkone.dev), this app brings enterprise-grade project management tools to your ERPNext installation.

## 🔧 Installation

### Prerequisites

- Frappe v14+
- ERPNext v14+
- Python 3.10+

### Using Bench

```bash
# Navigate to your bench directory
cd frappe-bench

# Get the app from GitHub
bench get-app timesheet-quick-entry https://github.com/ArkOne-Softwares/timesheet-quick-entry.git

# Install the app on your site
bench --site your-site.local install-app timesheet-quick-entry

# Update your bench
bench build
bench restart
```

### Manual Installation

If you prefer manual installation:

1. Clone the repository into your `apps` folder:
   ```bash
   cd frappe-bench/apps
   git clone https://github.com/ArkOne-Softwares/timesheet-quick-entry.git
   ```

2. Install dependencies:
   ```bash
   cd timesheet-quick-entry
   pip install -e .
   ```

3. Install the app on your site:
   ```bash
   cd ../../
   bench --site your-site.local install-app timesheet-quick-entry
   ```

## 💻 Usage

1. Navigate to the Projects module in ERPNext
2. Select a project to view its tasks
3. Click on a task to reveal action buttons:
   - **Add Timesheet Entry**: Log time for the selected task
   - **Assign to Me**: Instantly assign the task to yourself
   - **Change Status**: Update task status from a dropdown menu

## 📚 Documentation

For detailed documentation, visit our [documentation site](https://arkone.dev/docs/timesheet-quick-entry) or the [Wiki](https://github.com/ArkOne-Softwares/timesheet-quick-entry/wiki).

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Set up your development environment:
   ```bash
   cd frappe-bench/apps/timesheet-quick-entry
   pre-commit install
   ```
3. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. Make your changes, ensuring all code passes our quality checks
5. Push your branch and create a pull request

Our pre-commit hooks ensure code quality with:
- ruff (Python linting)
- eslint (JavaScript linting)
- prettier (Code formatting)
- pyupgrade (Python modernization)

## 🐛 Bug Reports and Feature Requests

Please use the [GitHub issue tracker](https://github.com/ArkOne-Softwares/timesheet-quick-entry/issues) to report bugs or submit feature requests.

## 📝 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.

## 🙏 Acknowledgements

- Built on the amazing [Frappe Framework](https://frappeframework.com)
- Works seamlessly with [ERPNext](https://erpnext.com)
- Developed and maintained by [ArkOne Software](https://arkone.dev)

---

<p align="center">
  <a href="https://arkone.dev">
    <img src="https://arkone.dev/assets/img/logo.png" alt="ArkOne Software" width="200">
  </a>
  <br>
  <a href="https://arkone.dev">Visit our website</a> | <a href="https://arkone.dev/contact">Contact us</a>
</p>

<!-- SEO keywords -->
<!-- 
  ERPNext timesheet entry, Frappe timesheet management, task management ERPNext,
  project management tool, timesheet automation, task tracking ERPNext,
  employee timesheet ERPNext, time tracking app, project tracking tool,
  ERPNext project extension, task assignment ERPNext, quick time entry
-->
