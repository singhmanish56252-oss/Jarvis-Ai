"""
RealtimeSearchEngine.py — Real-time web search engine for Jarvis AI.

Provides live web search results using DuckDuckGo (via duckduckgo-search library),
then optionally summarizes the results using Gemini for a coherent answer.

Features:
  - DuckDuckGo search via the duckduckgo-search library (primary, reliable)
  - DuckDuckGo HTML scraping fallback (no API key required)
  - Gemini-powered summarization of search results
  - Configurable result count and timeout
"""

import os
import re
import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import quote_plus, unquote
from dotenv import load_dotenv

load_dotenv()

# ─── Configuration ──────────────────────────────────────────────────────
SEARCH_TIMEOUT = 10            # HTTP request timeout in seconds
MAX_RESULTS = 8                # Maximum number of search results to return
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1"
}


# ─── Search Result Data Class ───────────────────────────────────────────
class SearchResult:
    """Represents a single search result."""

    def __init__(self, title: str, snippet: str, url: str):
        self.title = title
        self.snippet = snippet
        self.url = url

    def __repr__(self):
        return f"SearchResult(title='{self.title[:50]}...', url='{self.url}')"

    def to_dict(self):
        return {"title": self.title, "snippet": self.snippet, "url": self.url}


# ─── Primary: ddgs library ──────────────────────────────────────────────
def _search_ddgs_library(query: str, max_results: int = MAX_RESULTS) -> list[SearchResult]:
    """
    Search using the ddgs (DuckDuckGo Search) Python library.
    This is the most reliable free method (no API key needed).
    """
    results = []
    try:
        from ddgs import DDGS

        ddgs = DDGS(timeout=20)
        try:
            ddg_results = ddgs.text(query, max_results=max_results, backend="api")
        except Exception:
            # Try with default backend if 'api' fails
            try:
                ddg_results = ddgs.text(query, max_results=max_results)
            except Exception:
                ddg_results = []

        for item in ddg_results:
            title = item.get("title", "")
            snippet = item.get("body", "")
            url = item.get("href", "")

            if title and url:
                results.append(SearchResult(
                    title=title,
                    snippet=snippet,
                    url=url
                ))

    except ImportError:
        print("[RealtimeSearch] ddgs library not installed. Install with: pip install ddgs")
    except Exception as e:
        print(f"[RealtimeSearch] DDGS library error: {e}")

    return results


# ─── Fallback: DuckDuckGo HTML Scraping ──────────────────────────────────
def _search_duckduckgo_html(query: str, max_results: int = MAX_RESULTS) -> list[SearchResult]:
    """
    Search DuckDuckGo's HTML interface and extract results.
    Fallback method — doesn't require any API key or library.
    """
    results = []
    encoded_query = quote_plus(query)
    url = f"https://html.duckduckgo.com/html/?q={encoded_query}"

    try:
        response = requests.get(url, headers=HEADERS, timeout=SEARCH_TIMEOUT)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        # DuckDuckGo HTML results are in <div class="result">
        result_divs = soup.find_all("div", class_="result")

        for div in result_divs[:max_results]:
            # Extract title
            title_tag = div.find("a", class_="result__a")
            if not title_tag:
                continue
            title = title_tag.get_text(strip=True)

            # Extract URL — DuckDuckGo wraps URLs in redirect links
            raw_href = title_tag.get("href", "")
            actual_url = _extract_url_from_ddg(raw_href)

            # Extract snippet
            snippet_tag = div.find("a", class_="result__snippet")
            if not snippet_tag:
                snippet_tag = div.find("td", class_="result__snippet")
            snippet = snippet_tag.get_text(strip=True) if snippet_tag else ""

            if title and actual_url:
                results.append(SearchResult(
                    title=title,
                    snippet=snippet,
                    url=actual_url
                ))

    except requests.exceptions.Timeout:
        print("[RealtimeSearch] HTML search timed out.")
    except requests.exceptions.RequestException as e:
        print(f"[RealtimeSearch] HTML request error: {e}")
    except Exception as e:
        print(f"[RealtimeSearch] HTML parsing error: {e}")

    return results


def _extract_url_from_ddg(href: str) -> str:
    """Extract the actual URL from DuckDuckGo's redirect URL."""
    if not href:
        return ""

    # DuckDuckGo sometimes uses //duckduckgo.com/l/?uddg=<encoded_url>&...
    if "uddg=" in href:
        try:
            url_part = href.split("uddg=")[1]
            url_part = url_part.split("&")[0]
            return unquote(url_part)
        except (IndexError, ValueError):
            pass

    # If it's already a direct URL
    if href.startswith("http"):
        return href

    # Handle protocol-relative URLs
    if href.startswith("//"):
        return "https:" + href

    return href


# ─── Unified Search Function ────────────────────────────────────────────
def SearchWeb(query: str, max_results: int = MAX_RESULTS) -> list[SearchResult]:
    """
    Search the web using multiple strategies with automatic fallback.
    
    Strategy order:
      1. duckduckgo-search library (most reliable)
      2. DuckDuckGo HTML scraping (fallback)

    Args:
        query: The search query string.
        max_results: Maximum number of results to return.

    Returns:
        List of SearchResult objects with title, snippet, and URL.
    """
    print(f"[RealtimeSearch] Searching: '{query}'")

    # Strategy 1: duckduckgo-search library
    results = _search_ddgs_library(query, max_results)

    # Strategy 2: DuckDuckGo HTML scraping fallback
    if not results:
        print("[RealtimeSearch] Library returned no results. Trying HTML scraping fallback...")
        results = _search_duckduckgo_html(query, max_results)

    print(f"[RealtimeSearch] Found {len(results)} results.")
    return results


def FormatResultsAsText(results: list[SearchResult]) -> str:
    """
    Format search results into a readable text block.
    Useful for feeding into the LLM as context.
    """
    if not results:
        return "No search results found."

    lines = []
    for i, r in enumerate(results, 1):
        lines.append(f"[{i}] {r.title}")
        if r.snippet:
            lines.append(f"    {r.snippet}")
        lines.append(f"    Source: {r.url}")
        lines.append("")

    return "\n".join(lines)


# ─── Gemini-Powered Smart Search ────────────────────────────────────────
def SmartSearch(query: str, max_results: int = 6, language: str = None) -> str:
    """
    Perform a web search and use Gemini to summarize the results
    into a coherent, informative answer. Supports Hindi, Hinglish, and English.

    Args:
        query: The user's search query.
        max_results: Number of web results to use as context.
        language: "hi" (Hindi), "hinglish", or "en" (English).

    Returns:
        A Gemini-summarized answer grounded in live web results in the requested language.
    """

    # Get raw search results
    results = SearchWeb(query, max_results)

    if not results:
        if language == "hi":
            return f"मुझे '{query}' के लिए कोई परिणाम नहीं मिले, सर।"
        elif language == "hinglish":
            return f"Mujhe '{query}' ke liye koi results nahi mile, sir."
        return f"I couldn't find any results for '{query}'. Please try a different search."

    # Format results as context for Gemini
    search_context = FormatResultsAsText(results)

    # Detect language if not provided
    if not language:
        if re.search(r'[\u0900-\u097F]', query):
            language = "hi"
        else:
            language = "en"

    if language == "hi":
        lang_instruction = "- IMPORTANT: Synthesize the answer entirely in fluent Hindi using Devanagari script. Maintain polite and professional tone ('जी सर...')."
    elif language == "hinglish":
        lang_instruction = "- IMPORTANT: Synthesize the answer naturally in Hinglish (Hindi written in Roman/English alphabet, e.g. 'Ji sir...')."
    else:
        lang_instruction = "- Synthesize the response in clear, professional English."

    # Build the summarization prompt
    summarization_prompt = f"""You are JARVIS, an advanced AI assistant. The user asked a question that requires 
up-to-date information from the web. I've searched the internet and found the following results.

USER QUERY: {query}

WEB SEARCH RESULTS:
{search_context}

INSTRUCTIONS:
{lang_instruction}
- Synthesize the search results into a clear, accurate, and helpful response.
- Cite specific sources when making factual claims (e.g., "According to [Source Name]...").
- If the results contain conflicting information, mention both perspectives.
- Keep your response concise but comprehensive (2-4 paragraphs max).
- Use a professional, slightly witty tone befitting JARVIS.
- If the search results don't adequately answer the query, say so honestly.
- Do NOT make up information not present in the search results.
"""

    # Use Gemini to summarize
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        # Return raw results if no API key
        return f"Here are the search results for '{query}':\n\n{search_context}"

    from google import genai
    client = genai.Client(api_key=api_key)

    MODELS = ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash"]

    last_error = None
    for model_name in MODELS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=summarization_prompt,
                config=genai.types.GenerateContentConfig(
                    temperature=0.4,
                    top_p=0.9,
                    max_output_tokens=1024,
                ),
            )
            if response and response.text:
                return response.text
        except Exception as e:
            last_error = e
            continue

    # If Gemini fails, return raw results
    return f"Here are the search results for '{query}':\n\n{search_context}"


# ─── Quick Search (Raw Results Only) ────────────────────────────────────
def QuickSearch(query: str, max_results: int = 5) -> list[dict]:
    """
    Perform a quick search and return results as a list of dicts.
    Useful for the API endpoint.

    Returns:
        List of dicts with 'title', 'snippet', and 'url' keys.
    """
    results = SearchWeb(query, max_results)
    return [r.to_dict() for r in results]


# ─── Test / Demo ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 60)
    print("  JARVIS Realtime Search Engine - Test")
    print("=" * 60)

    test_query = "latest AI news 2026"
    print(f"\n🔍 Testing web search: '{test_query}'")
    print("-" * 40)

    results = SearchWeb(test_query)
    if results:
        print(FormatResultsAsText(results))
    else:
        print("No results found.")

    print("\n" + "=" * 60)
    print("🧠 Testing Smart Search (Gemini-summarized)...")
    print("-" * 40)
    answer = SmartSearch(test_query)
    print(answer)
