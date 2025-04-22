import * as React from "react";
import { App } from "./App";
import { createRoot } from "react-dom/client";


class Project_Home {
	constructor({ page, wrapper }) {
		this.$wrapper = $(wrapper);
		this.page = page;

		this.init();
	}

	init() {
		this.setup_page_actions();
		this.setup_app();
	}

	setup_page_actions() {
		// setup page actions
		this.primary_btn = this.page.set_primary_action(__("Print Message"), () =>
	  		frappe.msgprint("Hello My Page!")
		);
	}

	setup_app() {
		// create and mount the react app
		const root = createRoot(this.$wrapper.get(0));
		root.render(<App />);
		this.$project_home = root;
	}
}

frappe.provide("frappe.ui");
frappe.ui.Project_Home = Project_Home;
export default Project_Home;