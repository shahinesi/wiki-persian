import unittest

from wiki.persian_search import search_query_variants


class TestPersianSearchQueryVariants(unittest.TestCase):
	def test_normalizes_arabic_yeh_and_kaf_for_persian_pages(self):
		variants = search_query_variants("راهنماي كافه")
		self.assertIn("راهنمای کافه", variants)
		self.assertIn("راهنماي كافه", variants)

	def test_supports_space_and_zwnj_separated_terms(self):
		variants = search_query_variants("جست\u200cوجو")
		self.assertIn("جست وجو", variants)
		self.assertIn("جستوجو", variants)

	def test_empty_queries_do_not_create_search_variants(self):
		self.assertEqual(search_query_variants("  "), [])

	def test_variant_order_is_stable(self):
		query = "راهنماي كافه"
		self.assertEqual(search_query_variants(query), search_query_variants(query))
