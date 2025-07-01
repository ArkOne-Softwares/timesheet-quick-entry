# Copyright (c) 2025, ArkOne Softwares and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class BoardViewConfig(Document):
	def validate(self):
		"""Validate the board view configuration"""
		# Ensure only one default view per user per doctype
		if self.is_default:
			existing_default = frappe.db.get_value(
				'Board View Config',
				{
					'user': self.user,
					'reference_doctype': self.reference_doctype,
					'is_default': 1,
					'name': ['!=', self.name]
				}
			)
			
			if existing_default:
				frappe.throw(f"A default view already exists for {self.reference_doctype}. Please uncheck the existing default view first.")
	
	def before_save(self):
		"""Set user to current user if not set"""
		if not self.user:
			self.user = frappe.session.user
