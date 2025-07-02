import * as React from "react"; // this is imporant do not remove
import { App } from "./App";
import { createRoot } from "react-dom/client";


class Project_Home {
	constructor({ page, wrapper }) {
		this.$wrapper = $(wrapper);
		this.page = page;
		this.showAllTasks = false;

		this.init();
	}

	init() {
		this.setup_page_actions();
		this.setup_app();
	}

	setup_page_actions() {
		// setup page actions
		this.primary_btn = this.page.set_primary_action(__("View All Tasks"), () => {
			this.show_task_list();
		});
		
		// Setup secondary action for returning to project view
		this.secondary_btn = this.page.add_menu_item(__("Back to Projects"), () => {
			this.show_project_view();
		}, true);
		
		// Initially hide the back button since we start in project view
		$(this.secondary_btn).hide();
	}

	setup_app() {
		// create and mount the react app with initial view (project view)
		const root = createRoot(this.$wrapper.get(0));
		root.render(<App showTasks={this.showAllTasks} />);
		this.$project_home = root;
	}

	show_task_list() {
		// Switch to all tasks view
		this.showAllTasks = true;
		const root = createRoot(this.$wrapper.get(0));
		root.render(<App showTasks={true} />);
		this.$project_home = root;
		
		// Update buttons visibility
		$(this.primary_btn).hide();
		$(this.secondary_btn).show();
		
		// Update page title
		this.page.set_title(__("All Tasks"));
	}

	show_project_view() {
		// Switch back to project view
		this.showAllTasks = false;
		const root = createRoot(this.$wrapper.get(0));
		root.render(<App showTasks={false} />);
		this.$project_home = root;
		
		// Update buttons visibility
		$(this.primary_btn).show();
		$(this.secondary_btn).hide();
		
		// Reset page title
		this.page.set_title(__("Project Home"));
	}
}

frappe.provide("frappe.ui");
frappe.ui.Project_Home = Project_Home;
export default Project_Home;