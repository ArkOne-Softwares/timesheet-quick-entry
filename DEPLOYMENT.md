# 🚀 Arkone Projects - Mobile-First Project Management

A mobile-first React + ERPNext project management tool with Kanban boards, task management, and timesheet tracking.

## 🎯 Features

✅ **Mobile-First Design** - Optimized for mobile and responsive on all devices  
✅ **Kanban Board** - Drag and drop task management with `react-beautiful-dnd`  
✅ **Project Management** - Uses existing ERPNext Project DocType  
✅ **Task Management** - Built on ERPNext Task DocType with enhanced UI  
✅ **Timesheet Tracking** - Integrated with ERPNext Timesheet system  
✅ **Advanced Filtering** - Search, filter, and sort tasks efficiently  
✅ **Real-time Updates** - Context API with useReducer for state management  

## 🧱 Architecture

- **Backend**: ERPNext (v15+) with Frappe framework
- **Frontend**: React with TailwindCSS (served by ERPNext)
- **State Management**: useReducer + Context API
- **API Layer**: Custom `@frappe.whitelist()` methods
- **Drag & Drop**: react-beautiful-dnd
- **Custom DocTypes**: BoardViewConfig for saved user views

## 📦 Installation

### 1. Prerequisites

```bash
# Ensure you have ERPNext v15+ installed
bench version

# Install Node.js and npm for frontend dependencies
node --version
npm --version
```

### 2. Install the App

```bash
# Navigate to your ERPNext bench directory
cd /path/to/your/bench

# Get the app (if from git)
bench get-app arkone_projects https://github.com/your-repo/arkone_projects.git

# Or if you have the app locally
cp -r /path/to/arkone_projects apps/

# Install the app
bench install-app arkone_projects

# Install frontend dependencies
cd apps/arkone_projects
npm install

# Build frontend assets
npm run build
```

### 3. Setup & Configuration

```bash
# Create new site (if needed)
bench new-site yourdomain.com

# Install the app on your site
bench --site yourdomain.com install-app arkone_projects

# Migrate to create custom DocTypes
bench --site yourdomain.com migrate

# Clear cache and restart
bench --site yourdomain.com clear-cache
bench restart
```

### 4. Frontend Development Setup

```bash
# For development with auto-rebuild
npm run dev

# For production build
npm run build
```

## 🏗️ Development Workflow

### Phase 1: Backend Setup ✅
- [x] ERPNext app structure
- [x] API endpoints (`api.py`)
- [x] Custom DocType (`BoardViewConfig`)
- [x] Frappe whitelist methods

### Phase 2: Frontend Foundation ✅
- [x] React components structure
- [x] Context API with useReducer
- [x] API service layer
- [x] Utility functions

### Phase 3: Core Components ✅
- [x] Mobile-first KanbanBoard
- [x] Responsive FilterBar
- [x] Enhanced App.jsx
- [x] Custom hooks (useFilters)

### Phase 4: Next Steps 🔄
- [ ] Update existing components (Projects, Tasks, Alltasks)
- [ ] Add timesheet integration UI
- [ ] Mobile navigation
- [ ] Add new task form
- [ ] Testing and optimization

## 🎨 Component Architecture

```
App.jsx (Main container)
├── Projects.jsx (Sidebar)
├── FilterBar.jsx (Search & filters) 
├── KanbanBoard.jsx (Drag & drop board)
├── Tasks.jsx (List view)
└── Alltasks.jsx (All tasks view)

Shared:
├── ProjectContext (State management)
├── apiService (Backend communication)
├── utils/ (Helper functions)
└── hooks/ (Custom hooks)
```

## 🔧 API Endpoints

### Projects
- `GET /api/method/arkone_projects.arkone_projects.api.get_projects`
- Query params: `filters` (JSON string)

### Tasks  
- `GET /api/method/arkone_projects.arkone_projects.api.get_tasks`
- Query params: `project`, `filters` (JSON strings)
- `POST /api/method/arkone_projects.arkone_projects.api.create_task`
- `POST /api/method/arkone_projects.arkone_projects.api.update_task_status`

### Timesheet
- `GET /api/method/arkone_projects.arkone_projects.api.get_timesheet_data`
- `POST /api/method/arkone_projects.arkone_projects.api.create_timesheet_entry`

### Utilities
- `GET /api/method/arkone_projects.arkone_projects.api.get_user_permissions`

## 📱 Mobile-First Features

### Responsive Design
- **Mobile**: Single column, touch-optimized
- **Tablet**: Two column layout
- **Desktop**: Full sidebar + main content

### Touch Interactions
- Swipe navigation on mobile
- Touch-friendly buttons and controls
- Optimized drag and drop for mobile

### Performance
- Lazy loading components
- Efficient state management
- Minimal re-renders

## 🎯 Usage

### 1. Access the Application
Navigate to: `https://yoursite.com/app/project-home`

### 2. Project Selection
- Choose a project from the sidebar
- View project tasks in Kanban or List view

### 3. Task Management
- **Kanban View**: Drag tasks between status columns
- **List View**: Filter, search, and sort tasks
- **Mobile**: Optimized touch interactions

### 4. Filtering & Search
- Search by task name, description, or project
- Filter by status, priority, assigned user
- Sort by creation date, priority, due date, etc.

### 5. Timesheet Integration
- Log time directly on tasks
- View time tracking summary
- Submit timesheets

## 🔐 Permissions

The app respects ERPNext's built-in role permissions:

- **Project Manager**: Full access to all features
- **Project User**: Can view and update assigned tasks
- **Employee**: Can log time and update own task status

## 🚨 Troubleshooting

### Common Issues

1. **Module not found errors**
   ```bash
   # Ensure all dependencies are installed
   npm install
   # Rebuild assets
   npm run build
   ```

2. **API errors** 
   ```bash
   # Check ERPNext logs
   bench --site yourdomain.com logs
   ```

3. **Frontend not loading**
   ```bash
   # Clear cache
   bench --site yourdomain.com clear-cache
   bench restart
   ```

### Development Tips

1. **Frontend Development**
   ```bash
   # Use dev mode for auto-rebuild
   npm run dev
   
   # Watch for changes
   tail -f logs/web.log
   ```

2. **Backend Development**
   ```bash
   # Enable developer mode
   bench --site yourdomain.com set-config developer_mode 1
   
   # Auto-reload on Python changes
   bench --site yourdomain.com set-config auto_reload 1
   ```

## 📈 Roadmap

### v1.1 - Enhanced Mobile UX
- [ ] Mobile navigation drawer
- [ ] Swipe gestures
- [ ] Offline support

### v1.2 - Advanced Features  
- [ ] Task templates
- [ ] Bulk operations
- [ ] Advanced reporting

### v1.3 - Integrations
- [ ] Notification system
- [ ] Email integration
- [ ] Third-party integrations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Documentation**: [ERPNext Documentation](https://docs.erpnext.com)
- **Community**: [ERPNext Forum](https://discuss.erpnext.com)
- **Issues**: GitHub Issues

---

Built with ❤️ by ArkOne Softwares
