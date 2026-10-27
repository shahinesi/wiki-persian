"""Unicode query normalization for Persian and Arabic-script wiki search."""

import unicodedata

ARABIC_TO_PERSIAN = str.maketrans({"ي": "ی", "ى": "ی", "ك": "ک"})
PERSIAN_TO_ARABIC = str.maketrans({"ی": "ي", "ک": "ك"})


def search_query_variants(query: str) -> list[str]:
	"""Return equivalent query spellings used by Persian and Arabic sources.

	Search keeps the source text unchanged. It tries the entered spelling, a
	canonical Persian spelling, and the common Arabic Yeh/Kaf spelling so users
	can find content regardless of which keyboard or source convention they use.
	Zero-width non-joiners are treated as word boundaries for token search.
	"""
	if not query:
		return []

	original = unicodedata.normalize("NFC", query).strip()
	if not original:
		return []

	variants = [original]
	seen = {original}

	def add(value: str) -> None:
		if value and value not in seen:
			seen.add(value)
			variants.append(value)

	canonical = unicodedata.normalize("NFKC", original).translate(ARABIC_TO_PERSIAN)
	add(canonical)
	add(canonical.translate(PERSIAN_TO_ARABIC))

	for value in tuple(variants):
		if "\u200c" in value:
			add(value.replace("\u200c", " "))
			add(value.replace("\u200c", ""))

	return variants
