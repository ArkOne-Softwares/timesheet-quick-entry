frappe.pages["project_home"].on_page_load = function (wrapper) {
	frappe.ui.make_app_page({
		parent: wrapper,
		title: __("project_home"),
		single_column: true,
	});
};

frappe.pages["project_home"].on_page_show = function (wrapper) {
	load_desk_page(wrapper);
};

function load_desk_page(wrapper) {
	let $parent = $(wrapper).find(".layout-main-section");
	$parent.empty();

	frappe.require("project_home.bundle.jsx").then(() => {
		frappe.project_home = new frappe.ui.Project_Home({
			wrapper: $parent,
			page: wrapper.page,
		});
	});
}