app_name = "arkone_projects"
app_title = "Focal Board"
app_publisher = "ArkOne Softwares"
app_description = "Simple project management that also add task and timesheet easily"
app_email = "arkonesoft@gmail.com"
app_license = "mit"

# Apps
# ------------------

required_apps = ["frappe", "erpnext"]

# Each item in the list will be shown as an app in the apps page
# app_include = [
#     {
#         "name": "arkone_projects",
#         "logo": "/assets/arkone_projects/logo.png",
#         "title": "Arkone Projects",
#         "route": "/project_home",
#         "has_permission": "arkone_projects.api.permission.has_app_permission"
#     }
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
app_include_css = "/assets/arkone_projects/css/arkone_projects.css"
# app_include_js = "/assets/arkone_projects/js/arkone_projects.js"

# include js, css files in header of web template
# web_include_css = "/assets/arkone_projects/css/arkone_projects.css"
# web_include_js = "/assets/arkone_projects/js/arkone_projects.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "arkone_projects/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "arkone_projects/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# automatically load and sync documents of this doctype from downstream apps
# importable_doctypes = [doctype_1]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "arkone_projects.utils.jinja_methods",
# 	"filters": "arkone_projects.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "arkone_projects.install.before_install"
after_install = "arkone_projects.setup.setup.after_install"
# after_migrate = "arkone_projects.setup.setup.after_migrate"

# Uninstallation
# ------------

# before_uninstall = "arkone_projects.uninstall.before_uninstall"
# after_uninstall = "arkone_projects.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "arkone_projects.utils.before_app_install"
# after_app_install = "arkone_projects.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "arkone_projects.utils.before_app_uninstall"
# after_app_uninstall = "arkone_projects.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "arkone_projects.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"arkone_projects.tasks.all"
# 	],
# 	"daily": [
# 		"arkone_projects.tasks.daily"
# 	],
# 	"hourly": [
# 		"arkone_projects.tasks.hourly"
# 	],
# 	"weekly": [
# 		"arkone_projects.tasks.weekly"
# 	],
# 	"monthly": [
# 		"arkone_projects.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "arkone_projects.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "arkone_projects.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "arkone_projects.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["arkone_projects.utils.before_request"]
# after_request = ["arkone_projects.utils.after_request"]

# Job Events
# ----------
# before_job = ["arkone_projects.utils.before_job"]
# after_job = ["arkone_projects.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Fixtures
# -----------

fixtures = [
    {
        "doctype": "Custom Field",
        "filters": [
            ["dt", "in", ["Project"]]
        ]
    }
]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"arkone_projects.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

