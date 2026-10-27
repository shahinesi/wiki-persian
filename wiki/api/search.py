import frappe

from wiki.persian_search import search_query_variants
from wiki.telemetry import capture

PAGE_SEARCH_LIMIT = 20


@frappe.whitelist()
def search_pages(query: str) -> list[dict]:
	"""Find pages by URL across every space the user can read."""
	query = (query or "").strip()
	if not query:
		return []

	# Routes hyphenate words, so "getting started" still finds `getting-started`.
	# Search both titles and routes. Try Arabic/Persian Yeh and Kaf variants so
	# keyboard and source spelling differences do not hide a Persian page.
	or_filters = []
	for variant in search_query_variants(query):
		route = variant.replace(" ", "-")
		or_filters.extend(
			[
				["Wiki Document", "title", "like", f"%{variant}%"],
				["Wiki Document", "route", "like", f"%/%{route}%"],
			]
		)
	pages = frappe.get_list(
		"Wiki Document",
		filters={
			"is_group": 0,
			"is_external_link": 0,
			"wiki_space": ("is", "set"),
		},
		or_filters=or_filters,
		fields=[
			"name",
			"title",
			"route",
			"is_published",
			"wiki_space",
			"wiki_space.space_name as space_name",
			"wiki_space.route as space_route",
		],
		order_by="`tabWiki Document`.modified desc",
		limit=PAGE_SEARCH_LIMIT,
	)
	capture("search_performed", interval="1d", surface="app", hits=bool(pages))
	return pages
