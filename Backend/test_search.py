"""Quick test script for the Realtime Search Engine."""
import sys
import os
sys.stdout.reconfigure(encoding='utf-8')

import RealtimeSearchEngine

print("=" * 60)
print("  JARVIS Realtime Search Engine - Test")
print("=" * 60)

# Test 1: Raw search
test_query = "what is machine learning"
print(f"\n[TEST 1] Web Search: '{test_query}'")
print("-" * 40)
results = RealtimeSearchEngine.SearchWeb(test_query, 5)
if results:
    print(f"Found {len(results)} results:")
    for i, r in enumerate(results, 1):
        print(f"  [{i}] {r.title}")
        print(f"      {r.snippet[:100]}..." if r.snippet else "")
        print(f"      URL: {r.url}")
        print()
else:
    print("No results found.")

# Test 2: Quick search (dict format)
print(f"\n[TEST 2] Quick Search (dict format)")
print("-" * 40)
quick = RealtimeSearchEngine.QuickSearch("Python programming", 3)
for item in quick:
    print(f"  - {item['title']}")

# Test 3: Smart search (Gemini summarized)
print(f"\n[TEST 3] Smart Search (Gemini-summarized)")
print("-" * 40)
answer = RealtimeSearchEngine.SmartSearch("what is artificial intelligence and how is it used today", 4)
print(answer)

print("\n" + "=" * 60)
print("  All tests complete!")
print("=" * 60)
